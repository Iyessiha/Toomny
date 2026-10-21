import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminNavGroups } from "@/lib/admin-nav";
import { getAdminTexts } from "@/i18n/admin";
import { visitorLocale } from "@/i18n/server-locale";
import { PIXEL_KEYS, PIXEL_SETTINGS_EMPTY, type PixelSettings } from "@/lib/pixels";
import { PixelSettingsForm } from "@/components/admin/pixel-settings-form";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getAdminTexts(await visitorLocale()).pixelsPage.metaTitle };
}
export const dynamic = "force-dynamic";

export default async function AdminPixelsPage() {
  const user = await requireAdmin();
  const locale = user.preferredLocale;
  const t = getAdminTexts(locale).pixelsPage;

  const db = createAdminClient();
  const { data } = await db
    .from("pixels_publicitaires")
    .select(PIXEL_KEYS.join(", "))
    .eq("id", 1)
    .maybeSingle();

  const settings = { ...PIXEL_SETTINGS_EMPTY, ...(data as unknown as Partial<PixelSettings>) };

  return (
    <AdminShell
      user={user}
      locale={locale}
      kicker="Administration"
      title={t.title}
      subtitle={t.subtitle}
      nav={getAdminNavGroups(locale, "/admin/pixels")}
    >
      <PixelSettingsForm settings={settings} locale={locale} />
    </AdminShell>
  );
}
