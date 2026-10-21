import { getAdminTexts } from "@/i18n/admin";
import { getMarketplaceTexts } from "@/i18n/marketplace";
import type { Locale } from "@/i18n/dictionaries";

export type NavItem = { href: string; label: string; current?: boolean };
export type NavGroup = { label: string; items: NavItem[] };

export function getAdminNavGroups(locale: Locale, currentPath: string): NavGroup[] {
  const nav = getAdminTexts(locale).nav;
  const mktNav = getMarketplaceTexts(locale).nav;

  const item = (href: string, label: string): NavItem => ({
    href,
    label,
    current: currentPath === href,
  });

  return [
    {
      label: "",
      items: [item("/admin", nav.overview)],
    },
    {
      label: nav.sections.finance,
      items: [
        item("/admin/orders", nav.orders),
        item("/admin/payouts", nav.payouts),
        item("/admin/plans", nav.plans),
      ],
    },
    {
      label: nav.sections.users,
      items: [
        item("/admin/users", nav.users),
        item("/admin/verifications", nav.kyc),
      ],
    },
    {
      label: nav.sections.content,
      items: [
        item("/admin/services", nav.services),
        item("/admin/categories", nav.categories),
        item("/admin/pixels", nav.pixels),
      ],
    },
    {
      label: nav.sections.operations,
      items: [item("/admin/disputes", mktNav.disputes)],
    },
  ];
}

export function flattenNavGroups(groups: NavGroup[]): NavItem[] {
  return groups.flatMap((g) => g.items);
}
