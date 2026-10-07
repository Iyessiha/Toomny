import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type UserRole = "client" | "provider" | "both" | "admin";

export type CurrentUser = {
  id: string;
  email: string | null;
  displayName: string | null;
  countryCode: string | null;
  role: UserRole;
  verificationStatus: string;
};

/** Profil de l'utilisateur connecté, ou null. Ne redirige pas. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();

  // getUser() valide le jeton auprès du serveur d'auth ; getSession() se
  // contente de lire un cookie qui pourrait être forgé.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, country_code, role, verification_status")
    .eq("id", user.id)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id,
    email: user.email ?? null,
    displayName: data.display_name,
    countryCode: data.country_code,
    role: data.role as UserRole,
    verificationStatus: data.verification_status,
  };
}

/** Exige une session. Renvoie vers /auth sinon. */
export async function requireAuth(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");
  return user;
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
