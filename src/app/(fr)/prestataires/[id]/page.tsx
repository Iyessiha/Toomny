import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UUID_RE } from "@/lib/orders";
import { getCatalogTexts } from "@/i18n/catalog";
import { getShowcaseTexts } from "@/i18n/showcase";
import { visitorLocale } from "@/i18n/server-locale";
import { ServiceCard } from "@/components/catalog/service-card";
import { ShareButton } from "@/components/ui/share-button";
import { resolveDisplayNames } from "@/lib/names";

export const dynamic = "force-dynamic";

const LANG_LABEL: Record<string, string> = {
  fr: "Français", en: "English", ar: "العربية", wo: "Wolof",
  dz: "Dioula", bm: "Bambara", ff: "Pulaar", ha: "Haoussa",
  pt: "Português", es: "Español", de: "Deutsch", zh: "中文",
};
const LANG_FLAG: Record<string, string> = {
  fr: "🇫🇷", en: "🇬🇧", ar: "🌍", wo: "🇸🇳",
  dz: "🇨🇮", bm: "🇲🇱", ff: "🌍", ha: "🇳🇬",
  pt: "🇵🇹", es: "🇪🇸", de: "🇩🇪", zh: "🇨🇳",
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const locale = await visitorLocale();
  const t = getCatalogTexts(locale);
  if (!UUID_RE.test(id)) return { title: t.providerNotFound };
  const supabase = await createClient();
  const [{ data: person }, { data: profile }] = await Promise.all([
    supabase.from("provider_directory").select("display_name").eq("id", id).maybeSingle(),
    supabase.from("provider_profiles").select("headline").eq("profile_id", id).maybeSingle(),
  ]);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://toomny.com";
  return {
    title: person?.display_name ?? t.providerNotFound,
    description: profile?.headline ?? undefined,
    alternates: { canonical: `${siteUrl}/prestataires/${id}` },
    openGraph: {
      title: person?.display_name ?? "Prestataire Toomny",
      description: profile?.headline ?? undefined,
      url: `${siteUrl}/prestataires/${id}`,
    },
  };
}

export default async function ProviderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  const locale = await visitorLocale();
  const t = getCatalogTexts(locale);

  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const [
    { data: personFromView },
    { data: profile },
    { data: services },
    { data: reviews },
    { data: portfolioRows },
    { data: statsRow },
  ] = await Promise.all([
    supabase.from("provider_directory").select("id, display_name, country_code, verification_status").eq("id", id).maybeSingle(),
    supabase.from("provider_profiles").select("headline, bio, city, rating_avg, rating_count, completed_orders, avatar_url, skills, spoken_languages, business_type, company_name").eq("profile_id", id).maybeSingle(),
    supabase
      .from("services")
      .select("id, title, description, price_minor, currency, delivery_days, cover_url, tags, category:categories(slug)")
      .eq("provider_id", id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(24),
    supabase.from("reviews").select("id, rating, comment, created_at, author_id").eq("target_id", id).order("created_at", { ascending: false }).limit(20),
    supabase.from("portfolio_items").select("id, kind, title, description, url").eq("provider_id", id).order("created_at", { ascending: true }).limit(12),
    supabase
      .from("provider_order_stats")
      .select("orders_received, orders_completed, reviews_count, stars_5, stars_4, stars_3, stars_2, stars_1")
      .eq("provider_id", id)
      .maybeSingle(),
  ]);

  // Fallback : si le prestataire n'est pas dans la vue (role mal assigné),
  // on le cherche via le client admin tant qu'il a un provider_profile actif.
  let person = personFromView;
  if (!person && profile) {
    const admin = createAdminClient();
    const { data: raw } = await admin
      .from("profiles")
      .select("id, display_name, country_code, verification_status")
      .eq("id", id)
      .maybeSingle();
    if (raw) {
      person = {
        id: raw.id,
        display_name: raw.display_name,
        country_code: raw.country_code,
        verification_status: raw.verification_status === "verified" ? "verified" : "unverified",
      };
    }
  }

  if (!person) notFound();

  const rawList = services ?? [];
  const list = rawList.map((s) => {
    const cat = Array.isArray(s.category) ? s.category[0] : s.category;
    return {
      id: s.id,
      title: s.title,
      description: s.description ?? "",
      price_minor: s.price_minor,
      currency: s.currency,
      delivery_days: s.delivery_days,
      category_id: "",
      category_slug: cat?.slug ?? null,
      cover_url: s.cover_url ?? null,
      tags: (s.tags as string[]) ?? [],
      boosted: false,
      provider: {
        id,
        display_name: person?.display_name ?? null,
        country_code: person?.country_code ?? null,
        rating_avg: profile?.rating_avg ? Number(profile.rating_avg) : null,
        rating_count: profile?.rating_count ?? 0,
      },
    };
  });
  const st = getShowcaseTexts(locale);
  const { data: memberRow } = await createAdminClient().from("profiles").select("created_at").eq("id", id).maybeSingle();
  const memberSinceIso = (memberRow?.created_at as string | null) ?? null;
  const portfolio = (portfolioRows ?? []) as { id: string; kind: string; title: string; description: string | null; url: string }[];
  const kindLabel: Record<string, string> = { video: st.kindVideo, work: st.kindWork, link: st.kindLink };
  const isCompany = profile?.business_type === "company";
  const statusLabel = isCompany ? (profile?.company_name ? `${st.statusCompany} · ${profile.company_name}` : st.statusCompany) : st.statusIndividual;
  const memberSince = memberSinceIso
    ? new Date(memberSinceIso).toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR", { month: "long", year: "numeric" })
    : null;
  const reviewList = (reviews ?? []) as { id: string; rating: number; comment: string | null; created_at: string; author_id: string }[];

  // Noms des acheteurs (pseudo ou prénom + initiale). Résolution côté serveur :
  // la RLS ne laisse chacun lire que sa propre ligne `profiles`.
  const authorIds = [...new Set(reviewList.map((r) => r.author_id).filter(Boolean))];
  const authorNames = await resolveDisplayNames(authorIds);

  function authorName(authorId: string): string {
    const found = authorNames.get(authorId)?.short;
    return found && found !== "—" ? found : t.verifiedClient;
  }
  const avg = profile?.rating_avg ? Number(profile.rating_avg) : null;
  const stats = {
    ordersReceived: Number(statsRow?.orders_received ?? 0),
    ordersCompleted: Number(statsRow?.orders_completed ?? 0),
    reviewsCount: Number(statsRow?.reviews_count ?? 0),
    stars: [
      { value: 5, count: Number(statsRow?.stars_5 ?? 0) },
      { value: 4, count: Number(statsRow?.stars_4 ?? 0) },
      { value: 3, count: Number(statsRow?.stars_3 ?? 0) },
      { value: 2, count: Number(statsRow?.stars_2 ?? 0) },
      { value: 1, count: Number(statsRow?.stars_1 ?? 0) },
    ],
  };
  const satisfiedCount = (statsRow?.stars_5 ?? 0) + (statsRow?.stars_4 ?? 0);
  const satisfaction = stats.reviewsCount > 0 ? Math.round((Number(satisfiedCount) / stats.reviewsCount) * 100) : null;
  const initials = (person.display_name ?? "P").slice(0, 2).toUpperCase();
  const isVerified = person.verification_status === "verified";

  const languages = (profile?.spoken_languages ?? "")
    .split(",")
    .map((code: string) => code.trim().toLowerCase())
    .filter(Boolean);
  const place = [profile?.city, person.country_code].filter(Boolean).join(" · ");
  const shareTitle = person.display_name ?? "Prestataire Toomny";
  const starsOf = (value: number) => (reviewList.length === 0 ? 0 : Math.round((value / stats.reviewsCount) * 100));

  return (
    <>
      <Header locale={locale} />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-6">
        <nav aria-label="Fil d'Ariane" className="mb-4 text-xs text-[var(--subtle)]">
          <Link href="/prestataires" className="hover:text-[var(--foreground)]">{t.providersPageTitle}</Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--foreground)]">{person.display_name ?? t.detailProvider}</span>
        </nav>

        {/* Hero : identité, actions et indicateurs */}
        <section className="animate-rise overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <div
            aria-hidden
            className="h-28 bg-gradient-to-br from-[var(--color-brand-500)] via-[var(--color-brand-600)] to-[var(--color-brand-700,#0b5d30)] sm:h-40"
          />
          <div className="px-6 pb-8 sm:px-10">
            <div className="-mt-12 flex flex-col gap-6 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex min-w-0 items-end gap-5">
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={person.display_name ?? ""}
                    width={112}
                    height={112}
                    className="h-28 w-28 flex-none rounded-3xl border-4 border-[var(--surface)] object-cover shadow-lg"
                  />
                ) : (
                  <span
                    aria-hidden
                    className="flex h-28 w-28 flex-none items-center justify-center rounded-3xl border-4 border-[var(--surface)] bg-[var(--color-brand-100)] text-3xl font-extrabold text-[var(--color-brand-700)] shadow-lg"
                  >
                    {initials}
                  </span>
                )}
                <div className="min-w-0 pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-extrabold sm:text-3xl">{person.display_name ?? t.detailProvider}</h1>
                    {isVerified && (
                      <span title={t.identityVerified} className="rounded-full bg-[var(--color-brand-500)] px-2.5 py-0.5 text-[11px] font-bold text-white">
                        ✓ {t.badgeVerified}
                      </span>
                    )}
                  </div>
                  {profile?.headline && <p className="mt-1 text-base text-[var(--subtle)]">{profile.headline}</p>}
                  {place && <p className="mt-1 text-sm text-[var(--subtle)]">{place}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isCompany ? "bg-[var(--color-brand-50)] text-[var(--color-brand-700)]" : "bg-[var(--background)] text-[var(--subtle)]"}`}>
                      {statusLabel}
                    </span>
                    {memberSince && (
                      <span className="text-xs text-[var(--subtle)]">
                        {locale === "en" ? "Member since" : "Membre depuis"} {memberSince}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {currentUser && currentUser.id !== id && (
                  <Link
                    href={`/prestataires/${id}/contact`}
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand-500)] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-[var(--color-brand-500)]/25 transition-colors hover:bg-[var(--color-brand-600)]"
                  >
                    {t.contactCta}
                  </Link>
                )}
                {!currentUser && (
                  <Link href="/auth" className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-6 py-3 text-sm font-semibold hover:border-[var(--color-brand-300)] hover:text-[var(--color-brand-600)]">
                    {t.loginToContact}
                  </Link>
                )}
                <ShareButton title={shareTitle} locale={locale} />
              </div>
            </div>

            <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: t.rating, value: avg !== null ? `★ ${avg.toFixed(1)}` : "—" },
                { label: t.reviewsCount, value: String(stats.reviewsCount) },
                { label: t.ordersReceived, value: String(stats.ordersReceived) },
                { label: t.satisfaction, value: satisfaction !== null ? `${satisfaction} %` : "—" },
              ].map((tile) => (
                <div key={tile.label} className="rounded-2xl bg-[var(--background)] p-4 text-center">
                  <dt className="text-xs text-[var(--subtle)]">{tile.label}</dt>
                  <dd className="mt-1 font-display text-2xl font-extrabold">{tile.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-12">
            {/* Prestations */}
            <section>
              <h2 className="font-display text-xl font-bold">{t.providerTitle}</h2>
              {list.length === 0 ? (
                <p className="mt-4 text-sm text-[var(--subtle)]">{t.providerEmpty}</p>
              ) : (
                <ul className="mt-5 grid gap-5 sm:grid-cols-2">
                  {list.map((s) => (
                    <li key={s.id}>
                      <ServiceCard service={s} locale={locale} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Réalisations : vidéos, travaux et liens fournis par le prestataire */}
            {portfolio.length > 0 && (
              <section>
                <h2 className="font-display text-xl font-bold">{st.portfolioHeading}</h2>
                <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                  {portfolio.map((item) => (
                    <li key={item.id} className="flex flex-col gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                      <span className="w-fit rounded-full bg-[var(--color-brand-50)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--color-brand-700)]">
                        {kindLabel[item.kind] ?? item.kind}
                      </span>
                      <p className="font-semibold">{item.title}</p>
                      {item.description && <p className="text-sm leading-relaxed text-[var(--subtle)]">{item.description}</p>}
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="mt-auto text-sm font-semibold text-[var(--color-brand-600)] hover:underline"
                      >
                        {st.visit} →
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Avis */}
            <section>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 className="font-display text-xl font-bold">{t.reviews}</h2>
                {stats.reviewsCount > 0 && avg !== null && (
                  <p className="text-sm text-[var(--subtle)]">
                    <span className="font-display text-lg font-extrabold text-[var(--foreground)]">★ {avg.toFixed(1)}</span> {t.ratingOutOf} · {stats.reviewsCount} {t.reviewsCount.toLowerCase()}
                  </p>
                )}
              </div>

              {stats.reviewsCount > 0 && (
                <ul className="mt-5 space-y-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                  {stats.stars.map((star) => (
                    <li key={star.value} className="grid grid-cols-[3rem_1fr_2.5rem] items-center gap-3 text-xs">
                      <span className="font-semibold">★ {star.value}</span>
                      <span className="h-2 overflow-hidden rounded-full bg-[var(--border)]" aria-hidden="true">
                        <span className="block h-full rounded-full bg-amber-400" style={{ width: `${starsOf(star.count)}%` }} />
                      </span>
                      <span className="text-right text-[var(--subtle)]">{star.count}</span>
                    </li>
                  ))}
                </ul>
              )}

              {reviewList.length === 0 ? (
                <p className="mt-5 text-sm text-[var(--subtle)]">{t.noReviewsList}</p>
              ) : (
                <ul className="mt-5 space-y-4">
                  {reviewList.map((r) => (
                    <li key={r.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                      <div className="flex items-center gap-3">
                        <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-100)] text-sm font-bold text-[var(--color-brand-700)]">
                          {authorName(r.author_id).charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">{authorName(r.author_id)}</p>
                          <p className="text-xs text-amber-500" aria-label={`${r.rating} / 5`}>
                            {"★".repeat(r.rating)}
                            <span className="text-[var(--border)]">{"★".repeat(5 - r.rating)}</span>
                          </p>
                        </div>
                      </div>
                      {r.comment && <p className="mt-3 text-sm leading-relaxed text-[var(--subtle)]">{r.comment}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {profile?.bio && (
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
                <h2 className="font-display text-base font-bold">{t.detailAbout}</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[var(--subtle)]">{profile.bio}</p>
              </div>
            )}

            {profile?.skills && (
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
                <h2 className="font-display text-base font-bold">{t.skillsTitle}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.skills.split(",").map((s: string) => s.trim()).filter(Boolean).map((skill: string) => (
                    <span key={skill} className="rounded-full bg-[var(--color-brand-50)] px-3 py-1 text-xs font-semibold text-[var(--color-brand-700)]">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {languages.length > 0 && (
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
                <h2 className="font-display text-base font-bold">{t.languagesTitle}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {languages.map((code: string) => (
                    <span key={code} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1 text-xs font-medium">
                      <span aria-hidden>{LANG_FLAG[code] ?? "🌐"}</span>
                      {LANG_LABEL[code] ?? code.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
              <h2 className="font-display text-base font-bold">{t.activityTitle}</h2>
              {stats.ordersReceived === 0 && <p className="mt-2 text-sm text-[var(--subtle)]">{t.noActivity}</p>}
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-[var(--subtle)]">{t.ordersReceived}</dt><dd className="font-semibold">{stats.ordersReceived}</dd></div>
                <div className="flex justify-between"><dt className="text-[var(--subtle)]">{t.ordersCompleted}</dt><dd className="font-semibold">{stats.ordersCompleted}</dd></div>
                <div className="flex justify-between"><dt className="text-[var(--subtle)]">{t.reviewsCount}</dt><dd className="font-semibold">{stats.reviewsCount}</dd></div>
              </dl>
            </div>
          </aside>
        </div>
      </main>
      <Footer locale={locale} />
    </>
  );
}
