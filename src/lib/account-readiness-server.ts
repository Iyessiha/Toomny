import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { accountReadiness, type Readiness } from "@/lib/account-readiness";

export type UserReadiness = {
  userId: string;
  role: string;
  displayName: string | null;
  readiness: Readiness;
};

/** État réel d'un compte : e-mail (côté auth), vérification et fiche prestataire. */
export async function readinessForUser(db: SupabaseClient, userId: string): Promise<UserReadiness | null> {
  const [{ data: profile }, { data: provider }, { data: auth }] = await Promise.all([
    db.from("profiles").select("role, display_name, verification_status").eq("id", userId).maybeSingle(),
    db.from("provider_profiles").select("headline, bio, city, skills, avatar_url").eq("profile_id", userId).maybeSingle(),
    db.auth.admin.getUserById(userId),
  ]);
  if (!profile) return null;

  const readiness = accountReadiness({
    emailConfirmed: Boolean(auth?.user?.email_confirmed_at),
    verificationStatus: profile.verification_status ?? "unverified",
    role: profile.role,
    profile: provider
      ? {
          headline: provider.headline,
          bio: provider.bio,
          city: provider.city,
          skills: provider.skills,
          avatarUrl: provider.avatar_url,
        }
      : null,
  });
  return { userId, role: profile.role, displayName: profile.display_name, readiness };
}
