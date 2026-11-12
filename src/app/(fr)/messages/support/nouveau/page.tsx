import type { Metadata } from "next";
import { requireAuth, isProvider } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { dashboardNavSections } from "@/lib/dashboard-nav";
import { getDashboardTexts } from "@/i18n/dashboard";
import { getMarketplaceTexts } from "@/i18n/marketplace";
import { NewThreadForm } from "./new-thread-form";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const user = await requireAuth();
  return { title: getMarketplaceTexts(user.preferredLocale).messages.support.metaTitle };
}

export default async function NewSupportThreadPage() {
  const user = await requireAuth();
  if (!isProvider(user.role)) redirect("/messages");

  const locale = user.preferredLocale;
  const nav = getDashboardTexts(locale).nav;
  const ts = getMarketplaceTexts(locale).messages.support;

  return (
    <DashboardShell
      user={user}
      locale={locale}
      title={ts.title}
      subtitle={ts.subtitle}
      navSections={dashboardNavSections(nav, user.role, "/messages")}
    >
      <div className="mx-auto max-w-xl">
        <NewThreadForm locale={locale} />
      </div>
    </DashboardShell>
  );
}
