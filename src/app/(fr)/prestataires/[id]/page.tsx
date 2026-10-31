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
import { InitialsAvatar } from "@/components/providers/initials-avatar";
import { CATEGORY_ILLUSTRATIONS, mainCategory } from "@/lib/provider-search";
import { ShareButton } from "@/components/ui/share-button";
import { resolveDisplayNames } from "@/lib/names";
import { formatMoney } from "@/lib/money";

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

  // Illustration de repli : catégorie principale des prestations actives.
  const profileCategory = mainCategory(
    (services ?? []).map((s) => {
      const raw = s.category as { slug?: string } | { slug?: string }[] | null;
      return Array.isArray(raw) ? raw[0]?.slug : raw?.slug;
    }),
  );

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
  const place = [profile?.city, person.country_code].filter(Boolean).join(", ");
  const shareTitle = person.display_name ?? "Prestataire Toomny";
  const fromMinor = list.length > 0 ? Math.min(...list.map((s) => Number(s.price_minor))) : null;
  const starsOf = (value: number) => (stats.reviewsCount === 0 ? 0 : Math.round((value / stats.reviewsCount) * 100));
  const skills = (profile?.skills ?? "").split(",").map((x: string) => x.trim()).filter(Boolean);

  return (
    <>
      <Header locale={locale} />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6">
        <nav aria-label="Fil d'Ariane" className="mb-6 text-xs text-[var(--subtle)]">
          <Link href="/prestataires" className="hover:text-[var(--foreground)]">{t.providersPageTitle}</Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--foreground)]">{person.display_name ?? t.detailProvider}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            {/* En-tête */}
            <header className="flex items-start gap-5">
              {profile?.avatar_url ? (
                <Image src={profile.avatar_url} alt={person.display_name ?? ""} width={96} height={96} className="h-24 w-24 flex-none rounded-full object-cover" />
              ) : profileCategory && CATEGORY_ILLUSTRATIONS.has(profileCategory) ? (
                <Image src={`/images/categories/${profileCategory}.png`} alt="" width={96} height={96} className="h-24 w-24 flex-none rounded-2xl" />
              ) : (
                <InitialsAvatar name={person.display_name ?? t.detailProvider} size={96} />
              )}
              <div className="min-w-0">
                <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold sm:text-3xl">
                  {person.display_name ?? t.detailProvider}
                  {isVerified && (
                    <span title={t.identityVerified} className="rounded-md bg-[var(--color-brand-50)] px-2 py-0.5 text-xs font-semibold text-[var(--color-brand-700)]">
                      ✓ {t.badgeVerified}
                    </span>
                  )}
                </h1>
                {profile?.headline && <p className="mt-1 text-base text-[var(--foreground)]">{profile.headline}</p>}
                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--subtle)]">
                  <span className="font-semibold text-[var(--foreground)]">{avg !== null ? `★ ${avg.toFixed(1)}` : "★ —"}</span>
                  <span>({stats.reviewsCount} {t.reviewsCount.toLowerCase()})</span>
                  <span aria-hidden>·</span>
                  <span>{stats.ordersReceived} {st.ordersReceivedShort}</span>
                  {place && (<><span aria-hidden>·</span><span>{place}</span></>)}
                </p>
              </div>
            </header>

            {/* Présentation */}
            {profile?.bio && (
              <section className="mt-10 border-t border-[var(--border)] pt-8">
                <h2 className="text-lg font-bold">{t.detailAbout}</h2>
                <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-[var(--foreground)]">{profile.bio}</p>
              </section>
            )}

            {/* Compétences */}
            {skills.length > 0 && (
              <section className="mt-10 border-t border-[var(--border)] pt-8">
                <h2 className="text-lg font-bold">{t.skillsTitle}</h2>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {skills.map((skill: string) => (
                    <li key={skill} className="rounded-full border border-[var(--border)] px-3.5 py-1.5 text-sm">
                      {skill}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Services : chaque titre commence par « Je vais » */}
            <section className="mt-10 border-t border-[var(--border)] pt-8">
              <h2 className="text-lg font-bold">{t.providerTitle}</h2>
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

            {/* Réalisations */}
            {portfolio.length > 0 && (
              <section className="mt-10 border-t border-[var(--border)] pt-8">
                <h2 className="text-lg font-bold">{st.portfolioHeading}</h2>
                <ul className="mt-4 divide-y divide-[var(--border)]">
                  {portfolio.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-4 py-4">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--subtle)]">{kindLabel[item.kind] ?? item.kind}</p>
                        <p className="mt-0.5 truncate font-semibold">{item.title}</p>
                        {item.description && <p className="mt-0.5 text-sm text-[var(--subtle)]">{item.description}</p>}
                      </div>
                      <a href={item.url} target="_blank" rel="noopener noreferrer nofollow" className="flex-none text-sm font-semibold text-[var(--color-brand-700)] hover:underline">
                        {st.visit} →
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Avis : synthèse et répartition */}
            <section className="mt-10 border-t border-[var(--border)] pt-8">
              <h2 className="text-lg font-bold">{t.reviews}</h2>
              {stats.reviewsCount === 0 ? (
                <p className="mt-4 text-sm text-[var(--subtle)]">{t.noReviewsList}</p>
              ) : (
                <div className="mt-5 grid gap-8 sm:grid-cols-[180px_1fr]">
                  <div>
                    <p className="font-display text-5xl font-bold">{avg?.toFixed(1)}</p>
                    <p className="mt-1 text-sm text-[var(--subtle)]">{stats.reviewsCount} {t.reviewsCount.toLowerCase()}</p>
                  </div>
                  <ul className="space-y-2">
                    {stats.stars.map((star) => (
                      <li key={star.value} className="grid grid-cols-[2.5rem_1fr_2rem] items-center gap-3 text-sm">
                        <span>{star.value} ★</span>
                        <span className="h-1.5 overflow-hidden rounded-full bg-[var(--border)]" aria-hidden="true">
                          <span className="block h-full rounded-full bg-[var(--foreground)]" style={{ width: `${starsOf(star.count)}%` }} />
                        </span>
                        <span className="text-right text-[var(--subtle)]">{star.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {reviewList.length > 0 && (
                <ul className="mt-8 divide-y divide-[var(--border)]">
                  {reviewList.map((r) => (
                    <li key={r.id} className="py-6">
                      <div className="flex items-center gap-3">
                        <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--background)] text-xs font-bold">
                          {authorName(r.author_id).charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{authorName(r.author_id)}</p>
                          <p className="text-xs text-[var(--subtle)]" aria-label={`${r.rating} / 5`}>
                            <span className="text-[var(--foreground)]">{"★".repeat(r.rating)}</span>
                            <span>{"★".repeat(5 - r.rating)}</span>
                          </p>
                        </div>
                      </div>
                      {r.comment && <p className="mt-3 text-[15px] leading-relaxed">{r.comment}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Colonne latérale : tarif et contact, toujours visibles */}
          <aside className="h-fit space-y-6 lg:sticky lg:top-24">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
              {fromMinor !== null && (
                <>
                  <p className="text-xs text-[var(--subtle)]">{t.from}</p>
                  <p className="mt-1 font-display text-3xl font-bold">{formatMoney(BigInt(fromMinor), "XOF", locale)}</p>
                </>
              )}
              <div className="mt-5 space-y-3">
                {currentUser && currentUser.id !== id && (
                  <Link href={`/prestataires/${id}/contact`} className="block rounded-full bg-[var(--color-brand-500)] px-5 py-3 text-center text-sm font-semibold text-white hover:bg-[var(--color-brand-600)]">
                    {t.contactCta}
                  </Link>
                )}
                {!currentUser && (
                  <Link href="/auth" className="block rounded-full border border-[var(--border)] px-5 py-3 text-center text-sm font-semibold hover:border-[var(--foreground)]">
                    {t.loginToContact}
                  </Link>
                )}
                <div className="flex justify-center">
                  <ShareButton title={shareTitle} locale={locale} />
                </div>
              </div>
            </div>

            <dl className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-[var(--subtle)]">{st.statusTitle}</dt><dd className="text-right font-medium">{statusLabel}</dd></div>
              {memberSince && (
                <div className="flex justify-between gap-4"><dt className="text-[var(--subtle)]">{locale === "en" ? "Member since" : "Membre depuis"}</dt><dd className="text-right font-medium">{memberSince}</dd></div>
              )}
              <div className="flex justify-between gap-4"><dt className="text-[var(--subtle)]">{t.ordersCompleted}</dt><dd className="text-right font-medium">{stats.ordersCompleted}</dd></div>
              {stats.reviewsCount > 0 && (
                <div className="flex justify-between gap-4"><dt className="text-[var(--subtle)]">{t.satisfaction}</dt><dd className="text-right font-medium">{satisfaction !== null ? `${satisfaction} %` : "—"}</dd></div>
              )}
              {languages.length > 0 && (
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--subtle)]">{t.languagesTitle}</dt>
                  <dd className="text-right font-medium">{languages.map((code: string) => LANG_LABEL[code] ?? code.toUpperCase()).join(", ")}</dd>
                </div>
              )}
            </dl>
          </aside>
        </div>
      </main>
      <Footer locale={locale} />
    </>
  );
}
