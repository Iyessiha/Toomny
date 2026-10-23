import Link from "next/link";
import type { Locale } from "@/i18n/dictionaries";
import { getEncouragementTexts } from "@/i18n/encouragement";
import { SHARE_NETWORKS, shareHref, trackedUrl, type ShareNetwork } from "@/lib/share-links";
import type { Encouragement } from "@/lib/encouragement";

type Props = {
  encouragement: Encouragement;
  locale: Locale;
  siteUrl: string;
  /** Profil public du prestataire : toutes ses prestations au même endroit. */
  profileUrl: string;
};

/** Bandeau d'encouragement du tableau de bord : une action claire et, si utile, le partage. */
export function EncouragementCard({ encouragement, locale, siteUrl, profileUrl }: Props) {
  const t = getEncouragementTexts(locale);
  const copy = (() => {
    switch (encouragement.kind) {
      case "new_order":
        return { title: t.newOrder.title, body: t.newOrder.body(encouragement.count), cta: t.newOrder.cta, href: "/orders" };
      case "to_validate":
        return { title: t.toValidate.title, body: t.toValidate.body(), cta: t.toValidate.cta, href: "/orders" };
      case "mission_done":
        return { title: t.missionDone.title, body: t.missionDone.body(encouragement.count), cta: t.missionDone.cta, href: "/orders" };
      case "publish_first":
        return { title: t.publishFirst.title, body: t.publishFirst.body(), cta: t.publishFirst.cta, href: "/dashboard/prestations/nouveau" };
      case "share_services":
        return { title: t.shareServices.title, body: t.shareServices.body(), cta: t.shareServices.shareHeading, href: profileUrl };
      case "share_toomny":
        return { title: t.shareToomny.title, body: t.shareToomny.body(), cta: t.shareToomny.shareHeading, href: siteUrl };
    }
  })();

  const shares = encouragement.kind === "share_services" || encouragement.kind === "share_toomny";
  const shareBase = encouragement.kind === "share_services" ? profileUrl : siteUrl;
  const shareMessage =
    encouragement.kind === "share_services" ? t.shareServices.shareMessage : t.shareToomny.shareMessage;
  const shareMedium = encouragement.kind === "share_services" ? "provider_share" : "member_share";
  const shareCampaign = encouragement.kind === "share_services" ? "profile_share" : "referral";

  return (
    <section
      aria-live="polite"
      className="animate-rise mb-6 overflow-hidden rounded-3xl border border-[var(--color-brand-500)]/30 bg-gradient-to-br from-[var(--color-brand-50)] via-white to-[var(--color-gold-50,#fbf6e6)] p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-display text-lg font-bold text-[var(--foreground)]">{copy.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-[var(--subtle)]">{copy.body}</p>
        </div>
        {!shares && (
          <Link
            href={copy.href}
            className="shrink-0 rounded-full bg-[var(--color-brand-500)] px-5 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.02] active:scale-95"
          >
            {copy.cta}
          </Link>
        )}
      </div>

      {shares && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--subtle)]">{copy.cta}</p>
          <div className="flex flex-wrap gap-2">
            {SHARE_NETWORKS.map((network: ShareNetwork) => (
              <a
                key={network}
                href={shareHref(network, trackedUrl(shareBase, network, shareMedium, shareCampaign), shareMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-[var(--border)] bg-white px-3.5 py-2 text-xs font-semibold shadow-sm hover:border-[var(--color-brand-500)] hover:text-[var(--color-brand-600)]"
              >
                {t.networks[network]}
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
