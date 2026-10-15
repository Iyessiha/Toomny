import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/shell";
import { dashboardNavSections } from "@/lib/dashboard-nav";
import { getDashboardTexts } from "@/i18n/dashboard";
import { WishlistGrid } from "@/components/dashboard/wishlist-grid";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Mes favoris · Toomny" };
}

export default async function WishlistPage() {
  const user = await requireAuth();
  const locale = user.preferredLocale;
  const t = getDashboardTexts(locale);

  const texts =
    locale === "en"
      ? {
          empty: "No favorites yet",
          emptyHint: "Click the heart icon on any service to save it here.",
          browseCta: "Browse services",
          loading: "Loading…",
        }
      : {
          empty: "Aucun favori pour l'instant",
          emptyHint: "Clique sur le cœur d'un service pour l'enregistrer ici.",
          browseCta: "Parcourir les services",
          loading: "Chargement…",
        };

  return (
    <DashboardShell
      user={user}
      kicker={t.nav.wishlist}
      title={t.nav.wishlist}
      locale={locale}
      navSections={dashboardNavSections(t.nav, user.role, "/dashboard/favoris")}
    >
      <WishlistGrid locale={locale} texts={texts} />
    </DashboardShell>
  );
}
