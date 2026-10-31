import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { createClient } from "@/lib/supabase/server";
import { UUID_RE } from "@/lib/orders";
import { categoryMeta, categoryGradient } from "@/lib/categories";
import { ServiceSidebar } from "@/components/catalog/service-sidebar";
import { getCatalogTexts } from "@/i18n/catalog";
import { visitorLocale } from "@/i18n/server-locale";
import { detectLanguage } from "@/lib/detect-language";
import { getServices } from "@/lib/catalog";
import { ServiceCard } from "@/components/catalog/service-card";
import { ProviderAvatar } from "@/components/providers/provider-avatar";
import { ReviewsList } from "@/components/catalog/reviews-list";
import { WishlistButton } from "@/components/catalog/wishlist-button";
import { ShareButton } from "@/components/ui/share-button";
import { resolveDisplayNames } from "@/lib/names";
import { hasPaidPlan } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const locale = await visitorLocale();
  const t = getCatalogTexts(locale);
  if (!UUID_RE.test(id)) return { title: t.notFound };
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("title, description")
    .eq("id", id)
    .maybeSingle();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://toomny.com";
  return {
    title: data?.title ?? t.notFound,
    description: data?.description ? data.description.slice(0, 160) : undefined,
    alternates: { canonical: `${siteUrl}/services/${id}` },
    openGraph: {
      title: data?.title ?? "Toomny",
      description: data?.description ? data.description.slice(0, 200) : undefined,
      url: `${siteUrl}/services/${id}`,
    },
  };
}

export default async function ServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  const locale = await visitorLocale();
  const t = getCatalogTexts(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: service } = await supabase
    .from("services")
    .select(
      "id, title, description, price_minor, currency, delivery_days, status, provider_id, cover_url, gallery_urls, tags, category:categories(slug, name_fr, name_en)"
    )
    .eq("id", id)
    .maybeSingle();
  if (!service) notFound();
  // Prestation non publiée : visible seulement par son prestataire.
  if (service.status !== "active" && user?.id !== service.provider_id) notFound();

  // Prestation rédigée dans l'autre langue : lien vers le traducteur gratuit de Google (sans clé).
  const writtenIn = detectLanguage(`${service.title} ${service.description ?? ""}`);
  const pageUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://toomny.com"}/services/${service.id}`;
  const translateLink =
    writtenIn && writtenIn !== locale
      ? {
          href: `https://translate.google.com/translate?sl=${writtenIn}&tl=${locale}&u=${encodeURIComponent(pageUrl)}`,
          note: locale === "en"
            ? "This service is written in French."
            : "Cette prestation est rédigée en anglais.",
          label: locale === "en" ? "Translate this page (free, Google Translate)" : "Traduire cette page (gratuit, Google Traduction)",
        }
      : null;

  const category = Array.isArray(service.category) ? service.category[0] : service.category;
  const meta = category ? categoryMeta(category.slug) : null;
  const gradient = categoryGradient(category?.slug);

  const [{ data: provider }, { data: providerProfile }, { data: reviewRows }, { data: pkgRows }] =
    await Promise.all([
      supabase
        .from("provider_directory")
        .select("display_name, country_code")
        .eq("id", service.provider_id)
        .maybeSingle(),
      supabase
        .from("provider_profiles")
        .select("headline, bio, rating_avg, rating_count, completed_orders, avatar_url")
        .eq("profile_id", service.provider_id)
        .maybeSingle(),
      supabase
        .from("reviews")
        .select("id, rating, comment, created_at, author_id")
        .eq("target_id", service.provider_id)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("service_packages")
        .select("id, tier, name, description, price_minor, delivery_days, currency")
        .eq("service_id", service.id)
        .order("tier"),
    ]);

  // Suppléments : affichés seulement si le prestataire a un plan payant (règle aussi vérifiée à la commande).
  // Le plan n'est pas lisible par les visiteurs : on le lit côté serveur, seul le résultat est utilisé.
  const [{ data: planRow }, { data: addonRows }] = await Promise.all([
    createAdminClient().from("provider_profiles").select("plan, plan_expires_at").eq("profile_id", service.provider_id).maybeSingle(),
    supabase
      .from("service_addons")
      .select("id, title, description, price_minor, currency, extra_delivery_days")
      .eq("service_id", service.id)
      .eq("active", true)
      .order("created_at", { ascending: true }),
  ]);
  const addons = hasPaidPlan(planRow?.plan, planRow?.plan_expires_at ?? null)
    ? ((addonRows ?? []) as { id: string; title: string; description: string | null; price_minor: number; currency: string; extra_delivery_days: number }[])
    : [];

  const packages = (pkgRows ?? []) as {
    id: string; tier: 1 | 2 | 3; name: string; description: string | null;
    price_minor: number; delivery_days: number; currency: string;
  }[];

  const reviews = (reviewRows ?? []) as {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    author_id: string;
  }[];

  // Noms des acheteurs (pseudo ou prénom + initiale). Résolution côté serveur :
  // la RLS ne laisse chacun lire que sa propre ligne `profiles`.
  const authorIds = [...new Set(reviews.map((r) => r.author_id).filter(Boolean))];
  const authorNames = await resolveDisplayNames(authorIds);

  function authorName(authorId: string): string {
    const found = authorNames.get(authorId)?.short;
    return found && found !== "—" ? found : t.verifiedClient;
  }
  const avg =
    reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
  const isOwner = user?.id === service.provider_id;

  // Autres services du même prestataire
  const { data: moreFromProvider } = await supabase
    .from("services")
    .select("id, title, price_minor, currency, delivery_days")
    .eq("provider_id", service.provider_id)
    .eq("status", "active")
    .neq("id", id)
    .limit(4);

  // Recommended services — same category, other providers
  const allCatServices = category?.slug
    ? await getServices({ categorySlug: category.slug })
    : [];
  const recommended = allCatServices
    .filter((s) => s.id !== id && s.provider?.id !== service.provider_id)
    .slice(0, 4);

  // Rating breakdown bars
  const breakdown = [5, 4, 3, 2, 1].map((n) => ({
    star: n,
    count: reviews.filter((r) => r.rating === n).length,
  }));
  const maxBreakdown = Math.max(...breakdown.map((b) => b.count), 1);

  const providerInitials = (provider?.display_name ?? "P").slice(0, 2).toUpperCase();
  const categoryName =
    locale === "en" ? category?.name_en ?? category?.name_fr : category?.name_fr;

  const trustItems = [
    { icon: "🔒", label: t.trustHeld },
    { icon: "📱", label: t.trustMobileMoney },
    { icon: "⭐", label: t.trustRatings },
  ];

  return (
    <>
      <Header locale={locale} />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* Fil d'Ariane */}
        <nav
          className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[var(--subtle)]"
          aria-label="breadcrumb"
        >
          <Link href="/services" className="hover:text-[var(--foreground)]">
            {t.listTitle}
          </Link>
          <span aria-hidden>›</span>
          {category && (
            <>
              <Link
                href={`/services?categorie=${category.slug}`}
                className="hover:text-[var(--foreground)]"
              >
                {categoryName}
              </Link>
              <span aria-hidden>›</span>
            </>
          )}
          <span className="truncate text-[var(--foreground)]">{service.title}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          {/* ── Colonne principale ── */}
          <div className="space-y-8">
            {/* Hero cover image */}
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl">
              {service.cover_url ? (
                <Image
                  src={service.cover_url}
                  alt={service.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 65vw"
                  priority
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center"
                  style={{ background: gradient }}
                  aria-hidden
                >
                  {meta?.icon ? (
                    <meta.icon className="h-24 w-24 text-white/20" />
                  ) : (
                    <span className="text-6xl font-bold text-white/25">{providerInitials}</span>
                  )}
                </div>
              )}
            </div>

            {/* Gallery row (additional images) */}
            {Array.isArray(service.gallery_urls) && service.gallery_urls.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {service.gallery_urls.map((url, i) => (
                  <div
                    key={url}
                    className="relative aspect-[4/3] h-32 shrink-0 overflow-hidden rounded-xl bg-[var(--surface)]"
                  >
                    <Image
                      src={url}
                      alt={`${service.title} — image ${i + 2}`}
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Title + category badge + provider row */}
            <div>
              {meta && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1 text-xs font-medium text-[var(--subtle)]">
                  <meta.icon className="h-3.5 w-3.5" aria-hidden />
                  {categoryName}
                </span>
              )}
              <div className="mt-3 flex items-start gap-3">
                <h1 className="flex-1 text-2xl font-bold leading-tight sm:text-3xl">
                  {service.title}
                </h1>
                <div className="mt-1 flex shrink-0 items-center gap-2">
                  <ShareButton title={service.title} locale={locale} size="sm" />
                  <WishlistButton serviceId={service.id} size="md" labels={{ add: t.wishlistAdd, remove: t.wishlistRemove }} />
                </div>
              </div>

              {/* Provider chip + rating */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link
                  href={`/prestataires/${service.provider_id}`}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1.5 text-sm transition-colors hover:border-[var(--color-brand-300)]"
                >
                  <ProviderAvatar
                    name={provider?.display_name ?? t.detailProvider}
                    photoUrl={providerProfile?.avatar_url}
                    categorySlug={category?.slug}
                    size={28}
                  />
                  <span className="font-semibold">
                    {provider?.display_name ?? t.detailProvider}
                  </span>
                  {provider?.country_code && (
                    <span className="text-[var(--subtle)]">· {provider.country_code}</span>
                  )}
                </Link>

                {avg !== null ? (
                  <span className="flex items-center gap-1 text-sm">
                    <span className="text-amber-400">
                      {"★".repeat(Math.min(Math.round(avg), 5))}
                      {"☆".repeat(Math.max(0, 5 - Math.round(avg)))}
                    </span>
                    <span className="font-semibold text-amber-600">{avg.toFixed(1)}</span>
                    <span className="text-[var(--subtle)]">
                      ({reviews.length} {t.reviewsCount.toLowerCase()})
                    </span>
                  </span>
                ) : (
                  <span className="text-sm text-[var(--subtle)]">{t.noReviews}</span>
                )}
              </div>
            </div>

            {/* Tags */}
            {Array.isArray(service.tags) && service.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(service.tags as string[]).map((tag: string) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--subtle)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            <section>
              <h2 className="font-display text-xl font-bold">{t.aboutService}</h2>
              {translateLink && (
                <p className="mt-4 rounded-xl bg-[var(--surface)] px-4 py-3 text-sm text-[var(--subtle)]">
                  {translateLink.note}{" "}
                  <a
                    href={translateLink.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[var(--color-brand-600)] underline underline-offset-2"
                  >
                    {translateLink.label}
                  </a>
                </p>
              )}
              <div className="mt-4 whitespace-pre-line text-base leading-relaxed text-[var(--subtle)]">
                {service.description}
              </div>
            </section>

            {/* About the provider */}
            {(providerProfile?.bio || providerProfile?.headline) && (
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
                <h2 className="font-display text-xl font-bold">
                  {t.aboutProvider} {provider?.display_name ?? t.detailProvider}
                </h2>
                <div className="mt-5 flex items-start gap-4">
                  <ProviderAvatar
                    name={provider?.display_name ?? t.detailProvider}
                    photoUrl={providerProfile?.avatar_url}
                    categorySlug={category?.slug}
                    size={64}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-semibold">{provider?.display_name}</p>
                    {providerProfile.headline && (
                      <p className="mt-0.5 text-sm text-[var(--subtle)]">
                        {providerProfile.headline}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-6 text-sm">
                      {providerProfile.completed_orders != null &&
                        providerProfile.completed_orders > 0 && (
                          <div>
                            <p className="font-bold">{providerProfile.completed_orders}</p>
                            <p className="text-xs text-[var(--subtle)]">{t.missions}</p>
                          </div>
                        )}
                      {providerProfile.rating_avg != null && (
                        <div>
                          <p className="font-bold">
                            {Number(providerProfile.rating_avg).toFixed(1)}
                            <span className="ml-1 font-normal text-amber-400">★</span>
                          </p>
                          <p className="text-xs text-[var(--subtle)]">{t.rating}</p>
                        </div>
                      )}
                      {provider?.country_code && (
                        <div>
                          <p className="font-bold">{provider.country_code}</p>
                          <p className="text-xs text-[var(--subtle)]">{t.location}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {providerProfile.bio && (
                  <p className="mt-4 text-sm leading-relaxed text-[var(--subtle)]">
                    {providerProfile.bio}
                  </p>
                )}
                <Link
                  href={`/prestataires/${service.provider_id}`}
                  className="mt-4 inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold transition-colors hover:border-[var(--color-brand-400)] hover:text-[var(--color-brand-600)]"
                >
                  {t.viewFullProfile}
                </Link>
              </section>
            )}

            {/* Reviews section */}
            <section>
              <div className="flex items-center gap-3">
                <h2 className="font-display text-xl font-bold">{t.reviews}</h2>
                {avg !== null && (
                  <span className="flex items-center gap-1 text-sm font-semibold">
                    <span className="text-amber-400">★</span>
                    <span>{avg.toFixed(1)}</span>
                    <span className="font-normal text-[var(--subtle)]">({reviews.length})</span>
                  </span>
                )}
              </div>

              {reviews.length === 0 ? (
                <p className="mt-4 text-sm text-[var(--subtle)]">{t.noReviewsList}</p>
              ) : (
                <div className="mt-6">
                  <ReviewsList
                    reviews={reviews.map((r) => ({
                      id: r.id,
                      rating: r.rating,
                      comment: r.comment,
                      created_at: r.created_at,
                      authorName: authorName(r.author_id),
                    }))}
                    avg={avg!}
                    breakdown={breakdown}
                    maxBreakdown={maxBreakdown}
                    reviewsCountLabel={t.reviewsCount.toLowerCase()}
                    locale={locale}
                  />
                </div>
              )}
            </section>
          </div>

          {/* ── Sidebar de commande ── */}
          <aside id="commande" className="h-fit space-y-4 lg:sticky lg:top-6">
            <ServiceSidebar
              serviceId={service.id}
              providerId={service.provider_id}
              providerName={provider?.display_name ?? undefined}
              packages={packages}
              addons={addons}
              basePrice={service.price_minor}
              baseCurrency={service.currency}
              baseDelivery={service.delivery_days}
              locale={locale}
              isGuest={!user}
              isOwner={isOwner}
              trustItems={trustItems}
              providerServices={(moreFromProvider ?? []).map((s) => ({
                id: s.id,
                title: s.title,
                price_minor: s.price_minor,
                currency: s.currency,
              }))}
            />
          </aside>
        </div>

        {/* Recommended services */}
        {recommended.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-xl font-bold">{t.alsoViewed}</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {recommended.map((s) => (
                <ServiceCard key={s.id} service={s} locale={locale} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ── Barre sticky mobile (≤ lg) ── */}
      {!isOwner && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--background)]/95 px-4 py-3 backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
            <div>
              <p className="text-[10px] text-[var(--subtle)]">{t.from}</p>
              <p className="font-display text-lg font-bold text-[var(--color-brand-600)]">
                {(service.price_minor).toLocaleString(locale === "fr" ? "fr-FR" : "en-US")} FCFA
              </p>
            </div>
            <a
              href="#commande"
              className="flex-1 rounded-full bg-[var(--color-brand-500)] px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[var(--color-brand-600)]"
            >
              {user ? t.order : t.loginToOrder}
            </a>
          </div>
        </div>
      )}

      {/* Espace pour la barre sticky mobile */}
      <div className="h-16 lg:hidden" aria-hidden />

      <Footer locale={locale} />
    </>
  );
}
