import type { Metadata } from "next";
import { getPublicPageTexts } from "@/i18n/public-pages";
import { visitorLocale } from "@/i18n/server-locale";
import { redirect } from "next/navigation";
import { requireAuth, isProvider } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/shell";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { getDashboardTexts } from "@/i18n/dashboard";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getPublicPageTexts(await visitorLocale()).titles.profile };
}
export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const user = await requireAuth();
  if (!isProvider(user.role)) redirect("/dashboard");
  const locale = user.preferredLocale;
  const t = getDashboardTexts(locale);

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("provider_profiles")
    .select("headline, bio, city, content_locale, avatar_url, skills")
    .eq("profile_id", user.id)
    .maybeSingle();

  return (
    <DashboardShell
      user={user}
      title={t.profile.title}
      subtitle={t.profile.subtitle}
      locale={locale}
      nav={[
        { href: "/dashboard", label: t.nav.overview },
        { href: "/dashboard/prestations", label: t.nav.services },
        { href: "/dashboard/profil", label: t.nav.profile, current: true },
        { href: "/orders", label: t.nav.orders },
      ]}
    >
      <div className="max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6">
        <ProfileForm
          defaults={{
            headline: profile?.headline ?? "",
            bio: profile?.bio ?? "",
            city: profile?.city ?? user.city ?? "",
            contentLocale: profile?.content_locale ?? "fr",
            avatarUrl: profile?.avatar_url ?? null,
            skills: profile?.skills ?? null,
          }}
          publicPath={`/prestataires/${user.id}`}
          locale={locale}
        />
      </div>
    </DashboardShell>
  );
}
