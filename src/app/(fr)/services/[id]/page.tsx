import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/money";
import { UUID_RE } from "@/lib/orders";
import { categoryMeta } from "@/lib/categories";
import { ServiceOrderForm } from "@/components/orders/service-order-form";
import { getCatalogTexts } from "@/i18n/catalog";
import { visitorLocale } from "@/i18n/server-locale";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return { title: "Prestation introuvable" };
  const supabase = await createClient();
  const { data } = await supabase.from("services").select("title, description").eq("id", id).maybeSingle();
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
  const { data: { user } } = await supabase.auth.getUser();

  const { data: service } = await supabase
    .from("services")
    .select("id, title, description, price_minor, currency, delivery_days, status, provider_id, category:categories(slug, name_fr, name_en)")
    .eq("id", id)
    .maybeSingle();
  if (!service) notFound();

  const [
    { data: provider },
    { data: providerProfile },
    { data: reviewRows },
    { data: otherServices },
  ] = await Promise.all([
    supabase.from("provider_directory").select("display_name, country_code").eq("id", service.provider_id).maybeSingle(),
    supabase.from("provider_profiles").select("headline, bio, rating_avg, rating_count, completed_orders").eq("profile_id", service.provider_id).maybeSingle(),
    supabase.from("reviews").select("rating").eq("target_id", service.provider_id),
    supabase
      .from("services")
      .select("id, title, price_minor, currency, delivery_days")
      .eq("provider_id", service.provider_id)
      .eq("status", "active")
      .neq("id", service.id)
      .limit(3),
  ]);

  const category = Array.isArray(service.category) ? service.category[0] : service.category;
  const meta = category ? categoryMeta(category.slug) : null;
  const reviews = reviewRows ?? [];
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
  const isOwner = user?.id === service.provider_id;

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
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {/* Fil d'Ariane */}
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[var(--subtle)]" aria-label="breadcrumb">
          <Link href="/services" className="hover:text-[var(--foreground)]">
            {t.listTitle}
          </Link>
          <span aria-hidden>›</span>
          {category && (
            <>
              <Link href={`/services?categorie=${category.slug}`} className="hover:text-[var(--foreground)]">
                {locale === "en" ? category.name_en ?? category.name_fr : category.name_fr}
              </Link>
              <span aria-hidden>›</span>
            </>
          )}
          <span className="truncate text-[var(--foreground)]">{service.title}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          {/* ── Colonne principale ── */}
          <div className="space-y-10">
            <article>
              {meta && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1 text-xs font-medium text-[var(--subtle)]">
                  <meta.icon className="h-3.5 w-3.5" aria-hidden />
                  {locale === "en" ? category?.name_en ?? category?.name_fr : category?.name_fr}
                </span>
              )}

              <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">{service.title}</h1>

              {/* Provider headline + rating */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link
                  href={`/prestataires/${service.provider_id}`}
                  className="inline-flex items-center gap-2 text-sm text-[var(--subtle)] hover:text-[var(--foreground)]"
                >
                  <span
                    aria-hidden
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-brand-100)] text-xs font-bold text-[var(--color-brand-700)]"
                  >
                    {(provider?.display_name ?? "P").slice(0, 2).toUpperCase()}
                  </span>
                  <span className="font-medium">{provider?.display_name ?? t.detailProvider}</span>
                  {provider?.country_code && <span className="text-[var(--subtle)]">· {provider.country_code}</span>}
                </Link>
                {avg !== null && (
                  <span className="text-sm text-[var(--subtle)]">
                    ★ {avg.toFixed(1)} ({reviews.length})
                  </span>
                )}
                {!avg && <span className="text-sm text-[var(--subtle)]">{t.noReviews}</span>}
              </div>

              <div className="mt-8 whitespace-pre-line text-base leading-relaxed">{service.description}</div>
            </article>

            {/* À propos du prestataire */}
            {(providerProfile?.bio || providerProfile?.headline) && (
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[var(--color-brand-100)] text-base font-bold text-[var(--color-brand-700)]"
                  >
                    {(provider?.display_name ?? "P").slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <p className="font-semibold">{provider?.display_name}</p>
                    {providerProfile.headline && (
                      <p className="text-sm text-[var(--subtle)]">{providerProfile.headline}</p>
                    )}
                  </div>
                </div>
                {providerProfile.bio && (
                  <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-[var(--subtle)]">
                    {providerProfile.bio}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-[var(--subtle)]">
                  {providerProfile.completed_orders != null && providerProfile.completed_orders > 0 && (
                    <span>✓ {providerProfile.completed_orders} {locale === "en" ? "missions" : "missions"}</span>
                  )}
                  {providerProfile.rating_avg && (
                    <span>★ {Number(providerProfile.rating_avg).toFixed(1)} / 5</span>
                  )}
                </div>
                <Link
                  href={`/prestataires/${service.provider_id}`}
                  className="mt-4 inline-block text-sm font-semibold text-[var(--color-brand-600)] hover:underline"
                >
                  {locale === "en" ? "View full profile →" : "Voir le profil complet →"}
                </Link>
              </section>
            )}

            {/* Autres services de ce prestataire */}
            {(otherServices ?? []).length > 0 && (
              <section>
                <h2 className="font-display text-xl font-bold">
                  {locale === "en" ? "Other services by this provider" : "Autres prestations de ce prestataire"}
                </h2>
                <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {(otherServices ?? []).map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/services/${s.id}`}
                        className="block rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 transition-all hover:-translate-y-px hover:border-[var(--color-brand-300)] hover:shadow-md"
                      >
                        <p className="font-semibold leading-snug">{s.title}</p>
                        <p className="mt-3 text-sm text-[var(--subtle)]">
                          {formatMoney(BigInt(s.price_minor), s.currency, locale)} ·{" "}
                          {s.delivery_days} {s.delivery_days > 1 ? t.days : t.day}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* ── Sidebar de commande ── */}
          <aside className="space-y-4 lg:sticky lg:top-6 h-fit">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6">
              <p className="font-display text-2xl font-bold">
                {formatMoney(BigInt(service.price_minor), service.currency, locale)}
              </p>
              <p className="mt-1 text-sm text-[var(--subtle)]">
                {locale === "en" ? "Delivery in" : "Livraison en"}{" "}
                <strong>{service.delivery_days}</strong>{" "}
                {service.delivery_days > 1 ? t.days : t.day}
              </p>

              <div className="mt-6">
                {!user ? (
                  <Link
                    href="/auth"
                    className="block rounded-full bg-[var(--color-brand-500)] px-6 py-3.5 text-center text-sm font-semibold text-white transition-colors hover:bg-[var(--color-brand-600)]"
                  >
                    {t.loginToOrder}
                  </Link>
                ) : isOwner ? (
                  <p className="text-sm text-[var(--subtle)]">{t.ownService}</p>
                ) : (
                  <ServiceOrderForm serviceId={service.id} locale={locale} />
                )}
              </div>
            </div>

            {/* Garanties */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <ul className="space-y-3">
                {trustItems.map((item) => (
                  <li key={item.label} className="flex items-start gap-3 text-sm">
                    <span aria-hidden className="mt-0.5 text-base">{item.icon}</span>
                    <span className="leading-snug text-[var(--subtle)]">{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </main>
      <Footer locale={locale} />
    </>
  );
}
