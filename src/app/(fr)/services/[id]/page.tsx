import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/money";
import { UUID_RE } from "@/lib/orders";
import { categoryMeta, categoryGradient } from "@/lib/categories";
import { ServiceOrderForm } from "@/components/orders/service-order-form";
import { getCatalogTexts } from "@/i18n/catalog";
import { visitorLocale } from "@/i18n/server-locale";
import { getServices } from "@/lib/catalog";
import { ServiceCard } from "@/components/catalog/service-card";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return { title: "Prestation introuvable" };
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("title, description")
    .eq("id", id)
    .maybeSingle();
  const locale = await visitorLocale();
  const t = getCatalogTexts(locale);
  return {
    title: data?.title ?? t.notFound,
    description: data?.description ? data.description.slice(0, 160) : undefined,
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

  const category = Array.isArray(service.category) ? service.category[0] : service.category;
  const meta = category ? categoryMeta(category.slug) : null;
  const gradient = categoryGradient(category?.slug);

  const [{ data: provider }, { data: providerProfile }, { data: reviewRows }] =
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
        .eq("target_id", service.provider_id),
    ]);

  const reviews = (reviewRows ?? []) as {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    author_id: string;
  }[];

  // Profils des acheteurs (pour afficher le prénom + initiale)
  const authorIds = [...new Set(reviews.map((r) => r.author_id).filter(Boolean))];
  const { data: authorProfiles } = authorIds.length
    ? await supabase
        .from("profiles")
        .select("id, display_name, first_name, last_name")
        .in("id", authorIds)
    : { data: [] };

  function authorName(authorId: string): string {
    const p = (authorProfiles ?? []).find((x) => x.id === authorId);
    if (!p) return locale === "en" ? "Verified Client" : "Client vérifié";
    if (p.display_name) return p.display_name;
    const first = p.first_name ?? "";
    const lastInitial = p.last_name ? ` ${p.last_name.charAt(0).toUpperCase()}.` : "";
    return (first + lastInitial).trim() || (locale === "en" ? "Verified Client" : "Client vérifié");
  }
  const avg =
    reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
  const isOwner = user?.id === service.provider_id;

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

  const trustItems =
    locale === "en"
      ? [
          { icon: "🔒", label: "Payment held in escrow until you approve" },
          { icon: "📱", label: "Pay by mobile money: Wave, Orange Money, MTN MoMo" },
          { icon: "⭐", label: "Transparent ratings on each order" },
        ]
      : [
          { icon: "🔒", label: "Paiement conservé jusqu'à votre validation" },
          { icon: "📱", label: "Paiement mobile money : Wave, Orange Money, MTN MoMo" },
          { icon: "⭐", label: "Notes transparentes à chaque commande" },
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
              <h1 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl">
                {service.title}
              </h1>

              {/* Provider chip + rating */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link
                  href={`/prestataires/${service.provider_id}`}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1.5 text-sm transition-colors hover:border-[var(--color-brand-300)]"
                >
                  {providerProfile?.avatar_url ? (
                    <Image
                      src={providerProfile.avatar_url}
                      alt={provider?.display_name ?? ""}
                      width={28}
                      height={28}
                      className="h-7 w-7 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ background: gradient }}
                    >
                      {providerInitials}
                    </span>
                  )}
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
              <h2 className="font-display text-xl font-bold">
                {locale === "en" ? "About the service" : "À propos de cette prestation"}
              </h2>
              <div className="mt-4 whitespace-pre-line text-base leading-relaxed text-[var(--subtle)]">
                {service.description}
              </div>
            </section>

            {/* About the provider */}
            {(providerProfile?.bio || providerProfile?.headline) && (
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
                <h2 className="font-display text-xl font-bold">
                  {locale === "en"
                    ? `About ${provider?.display_name ?? "the provider"}`
                    : `À propos de ${provider?.display_name ?? "ce prestataire"}`}
                </h2>
                <div className="mt-5 flex items-start gap-4">
                  {providerProfile?.avatar_url ? (
                    <Image
                      src={providerProfile.avatar_url}
                      alt={provider?.display_name ?? ""}
                      width={64}
                      height={64}
                      className="h-16 w-16 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white"
                      style={{ background: gradient }}
                    >
                      {providerInitials}
                    </span>
                  )}
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
                          <p className="text-xs text-[var(--subtle)]">
                            {locale === "en" ? "Location" : "Localisation"}
                          </p>
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
                  {locale === "en" ? "View full profile →" : "Voir le profil complet →"}
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
                <div className="mt-6 space-y-6">
                  {/* Rating summary + breakdown bars */}
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="text-center">
                        <p className="text-5xl font-bold">{avg!.toFixed(1)}</p>
                        <p className="mt-1 text-lg text-amber-400">
                          {"★".repeat(Math.min(Math.round(avg!), 5))}
                          {"☆".repeat(Math.max(0, 5 - Math.round(avg!)))}
                        </p>
                        <p className="mt-1 text-xs text-[var(--subtle)]">
                          {reviews.length} {t.reviewsCount.toLowerCase()}
                        </p>
                      </div>
                      <div className="flex-1 min-w-[160px] space-y-2">
                        {breakdown.map(({ star, count }) => (
                          <div key={star} className="flex items-center gap-2 text-xs">
                            <span className="w-4 text-right text-[var(--subtle)]">{star}</span>
                            <span className="text-amber-400">★</span>
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--border)]">
                              <div
                                className="h-full rounded-full bg-amber-400 transition-all"
                                style={{ width: `${(count / maxBreakdown) * 100}%` }}
                              />
                            </div>
                            <span className="w-4 text-[var(--subtle)]">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Individual reviews */}
                  <div className="divide-y divide-[var(--border)]">
                    {reviews.slice(0, 6).map((review, idx) => (
                      <div key={review.id ?? idx} className="py-5 first:pt-0">
                        <div className="flex items-start gap-3">
                          <span
                            aria-hidden
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-100)] text-xs font-bold text-[var(--color-brand-700)]"
                          >
                            {authorName(review.author_id).charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold">
                                {authorName(review.author_id)}
                              </span>
                              <span className="text-xs text-amber-400">
                                {"★".repeat(review.rating)}
                                {"☆".repeat(5 - review.rating)}
                              </span>
                              {review.created_at && (
                                <span className="text-xs text-[var(--subtle)]">
                                  {new Date(review.created_at).toLocaleDateString(
                                    locale === "fr" ? "fr-FR" : "en-US",
                                    { year: "numeric", month: "short", day: "numeric" }
                                  )}
                                </span>
                              )}
                            </div>
                            {review.comment ? (
                              <p className="mt-1.5 text-sm leading-relaxed text-[var(--subtle)]">
                                {review.comment}
                              </p>
                            ) : (
                              <p className="mt-1.5 text-sm italic text-[var(--subtle)]">
                                {locale === "en" ? "No comment." : "Pas de commentaire."}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* ── Sidebar de commande ── */}
          <aside className="h-fit space-y-4 lg:sticky lg:top-6">
            {/* Pricing + CTA card */}
            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">
              <div className="border-b border-[var(--border)] px-6 pb-4 pt-5">
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--subtle)]">
                  {t.from}
                </p>
                <p className="font-display text-3xl font-bold text-[var(--color-brand-600)]">
                  {formatMoney(BigInt(service.price_minor), service.currency, locale)}
                </p>
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-[var(--subtle)]">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {locale === "en" ? "Delivery in" : "Livraison en"}{" "}
                  <strong className="font-semibold text-[var(--foreground)]">
                    {service.delivery_days}
                  </strong>{" "}
                  {service.delivery_days > 1 ? t.days : t.day}
                </p>
              </div>

              <div className="space-y-3 p-6">
                {!user ? (
                  <Link
                    href="/auth"
                    className="flex items-center justify-center gap-2 rounded-full bg-[var(--color-brand-500)] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-brand-600)]"
                  >
                    {t.loginToOrder}
                  </Link>
                ) : isOwner ? (
                  <p className="text-center text-sm text-[var(--subtle)]">{t.ownService}</p>
                ) : (
                  <>
                    <ServiceOrderForm serviceId={service.id} locale={locale} />
                    <Link
                      href={`/services/${service.id}/contact`}
                      className="flex items-center justify-center gap-2 rounded-full border border-[var(--color-brand-300)] px-6 py-3 text-sm font-semibold text-[var(--color-brand-600)] transition-colors hover:bg-[var(--color-brand-50)]"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      {t.contactSeller}
                    </Link>
                    <Link
                      href={`/prestataires/${service.provider_id}`}
                      className="flex items-center justify-center gap-2 rounded-full border border-[var(--border)] px-6 py-3 text-sm font-semibold transition-colors hover:border-[var(--color-brand-400)] hover:text-[var(--color-brand-600)]"
                    >
                      {locale === "en" ? "View profile" : "Voir le profil"}
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Trust badges */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <ul className="space-y-3">
                {trustItems.map((item) => (
                  <li key={item.label} className="flex items-start gap-3 text-sm">
                    <span aria-hidden className="mt-0.5 text-base">
                      {item.icon}
                    </span>
                    <span className="leading-snug text-[var(--subtle)]">{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        {/* Recommended services */}
        {recommended.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-xl font-bold">
              {locale === "en" ? "Others also viewed" : "Les clients ont aussi consulté"}
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {recommended.map((s) => (
                <ServiceCard key={s.id} service={s} locale={locale} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer locale={locale} />
    </>
  );
}
