import type { Metadata } from "next";
import { getPublicPageTexts } from "@/i18n/public-pages";
import { visitorLocale } from "@/i18n/server-locale";
import { redirect } from "next/navigation";
import { requireAuth, isProvider } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/shell";
import { dashboardNavSections } from "@/lib/dashboard-nav";
import { Section } from "@/components/dashboard/pro";
import { ProfileWorkspace } from "@/components/dashboard/profile-workspace";
import { hasAiAccess } from "@/lib/provider-assist";
import { getDashboardTexts } from "@/i18n/dashboard";
import { NotificationBell } from "@/components/dashboard/notification-bell";

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
    .select("headline, bio, city, content_locale, avatar_url, skills, spoken_languages, website_url, linkedin_url, twitter_url, plan, plan_expires_at")
    .eq("profile_id", user.id)
    .maybeSingle();

  return (
    <DashboardShell
      user={user}
      bell={<NotificationBell locale={locale} />}
      kicker={t.nav.profile}
      title={t.profile.title}
      subtitle={t.profile.subtitle}
      locale={locale}
      navSections={dashboardNavSections(t.nav, user.role, "/dashboard/profil")}
    >
      <div className="max-w-2xl">
        <Section title={t.profile.title} subtitle={t.profile.subtitle}>
        <ProfileWorkspace
          hasAiAccess={hasAiAccess(profile?.plan, profile?.plan_expires_at ?? null)}
          defaults={{
            headline: profile?.headline ?? "",
            bio: profile?.bio ?? "",
            city: profile?.city ?? user.city ?? "",
            contentLocale: profile?.content_locale ?? "fr",
            avatarUrl: profile?.avatar_url ?? null,
            skills: profile?.skills ?? null,
            spokenLanguages: profile?.spoken_languages ?? null,
            websiteUrl: profile?.website_url ?? null,
            linkedinUrl: profile?.linkedin_url ?? null,
            twitterUrl: profile?.twitter_url ?? null,
          }}
          publicPath={`/prestataires/${user.id}`}
          locale={locale}
        />
        </Section>
      </div>
    </DashboardShell>
  );
}
