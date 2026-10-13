import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Locale } from "@/i18n/dictionaries";

export type UserRole = "client" | "provider" | "both" | "admin";

export type CurrentUser = {
  id: string;
  email: string | null;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  city: string | null;
  countryCode: string | null;
  role: UserRole;
  verificationStatus: string;
  preferredLocale: Locale;
  onboardingDone: boolean;
};

const PROFILE_COLUMNS =
  "id, display_name, first_name, last_name, phone, city, country_code, role, verification_status, preferred_locale, onboarding_done";

/**
 * Crée le profil d'un compte authentifié qui n'en a pas encore (inscription faite
 * avant la mise en place du trigger, ou trigger non appliqué). Même règle que le
 * trigger SQL : le rôle ne peut être que client ou prestataire, jamais admin.
 */
async function ensureProfile(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}) {
  const meta = user.user_metadata ?? {};
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : null);
  const country = typeof meta.country_code === "string" ? meta.country_code.toUpperCase() : "";

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? `${user.id}@invalid.local`,
      display_name: str(meta.display_name, 120),
      first_name: str(meta.first_name, 60),
      last_name: str(meta.last_name, 60),
      phone: str(meta.phone, 30),
      city: str(meta.city, 80),
      country_code: /^[A-Z]{2}$/.test(country) ? country : "CI",
      role: meta.role === "provider" ? "provider" : "client",
    },
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (error) {
    console.error("ensureProfile:", error.message);
    return null;
  }

  const { data } = await admin
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", user.id)
    .maybeSingle();
  return data;
}

/** Profil de l'utilisateur connecté, ou null. Ne redirige pas. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();

  // getUser() valide le jeton auprès du serveur d'auth ; getSession() se
  // contente de lire un cookie qui pourrait être forgé.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", user.id)
    .maybeSingle();

  if (error) console.error("getCurrentUser:", error.message);

  const profile = data ?? (await ensureProfile(user));
  if (!profile) return null;

  return {
    id: profile.id,
    email: user.email ?? null,
    displayName: profile.display_name,
    firstName: profile.first_name ?? null,
    lastName: profile.last_name ?? null,
    phone: profile.phone ?? null,
    city: profile.city ?? null,
    countryCode: profile.country_code,
    role: profile.role as UserRole,
    verificationStatus: profile.verification_status,
    preferredLocale: profile.preferred_locale === "en" ? "en" : "fr",
    onboardingDone: profile.onboarding_done ?? false,
  };
}

/** Exige une session. Renvoie vers /auth sinon. */
export async function requireAuth(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");
  return user as CurrentUser;
}

/**
 * Exige le rôle administrateur. Renvoie vers le tableau de bord sinon —
 * et non vers une page d'erreur, qui confirmerait l'existence de la zone.
 */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireAuth();
  if (user.role !== "admin") redirect("/dashboard");
  return user;
}

export function isProvider(role: UserRole): boolean {
  return role === "provider" || role === "both";
}
