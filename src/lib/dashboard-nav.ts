import type { NavItem, NavSection } from "@/components/dashboard/shell-ui";
import type { DashboardTexts } from "@/i18n/dashboard";
import { isProvider, type UserRole } from "@/lib/auth";

export type { NavItem, NavSection } from "@/components/dashboard/shell-ui";

function markCurrent(items: NavItem[], current?: string): NavItem[] {
  return items.map((item) => ({
    ...item,
    current: current ? item.href === current : false,
  }));
}

/**
 * Construit le menu de navigation connecté ordonné par rubriques selon le rôle
 * de l'utilisateur (`provider` / `both` vs `client` / `admin`).
 */
export function dashboardNavSections(
  nav: DashboardTexts["nav"],
  role: UserRole | string,
  current?: string,
): NavSection[] {
  if (isProvider(role as UserRole)) {
    return [
      {
        title: nav.sections.activity,
        items: markCurrent(
          [
            { href: "/dashboard", label: nav.overview },
            { href: "/orders", label: nav.orders },
            { href: "/messages", label: nav.messages },
            { href: "/demandes", label: nav.inquiries },
            { href: "/disputes", label: nav.disputes },
            { href: "/notifications", label: nav.notifications },
          ],
          current,
        ),
      },
      {
        title: nav.sections.business,
        items: markCurrent(
          [
            { href: "/dashboard/prestations", label: nav.services },
            { href: "/dashboard/versements", label: nav.payouts },
            { href: "/dashboard/plan", label: nav.plan },
            { href: "/dashboard/boost", label: nav.boost },
          ],
          current,
        ),
      },
      {
        title: nav.sections.account,
        items: markCurrent(
          [
            { href: "/dashboard/profil", label: nav.profile },
            { href: "/dashboard/verification", label: nav.kyc },
            { href: "/dashboard/compte", label: nav.account },
          ],
          current,
        ),
      },
    ];
  }

  return [
    {
      title: nav.sections.activity,
      items: markCurrent(
        [
          { href: "/dashboard", label: nav.home },
          { href: "/services", label: nav.findProvider },
          { href: "/orders", label: nav.myOrders },
          { href: "/messages", label: nav.messages },
          { href: "/demandes", label: nav.inquiries },
          { href: "/notifications", label: nav.notifications },
        ],
        current,
      ),
    },
    {
      title: nav.sections.account,
      items: markCurrent(
        [
          { href: "/dashboard/profil", label: nav.profile },
          { href: "/dashboard/compte", label: nav.account },
        ],
        current,
      ),
    },
  ];
}
