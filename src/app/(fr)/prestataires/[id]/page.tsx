import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/money";
import { UUID_RE } from "@/lib/orders";
import { getCatalogTexts } from "@/i18n/catalog";
import { visitorLocale } from "@/i18n/server-locale";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return { title: "Prestataire introuvable" };
  const supabase = await createClient();
  const [{ data: person }, { data: profile }] = await Promise.all([
    supabase.from("provider_directory").select("display_name").eq("id", id).maybeSingle(),
    supabase.from("provider_profiles").select("headline").eq("profile_id", id).maybeSingle(),
  ]);
  const locale = await visitorLocale();
  const t = getCatalogTexts(locale);
  return {
    title: person?.display_name ?? t.providerNotFound,
    description: profile?.headline ?? undefined,
  };
}

export default async function ProviderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  const locale = await visitorLocale();
  const t = getCatalogTexts(locale);

  const supabase = await createClient();

  const [
    { data: person },
    { data: profile },
    ,
    { data: services },
    { data: reviews },
  ] = await Promise.all([
    supabase.from("provider_directory").select("id, display_name, country_code, verification_status").eq("id", id).maybeSingle(),
    supabase.from("provider_profiles").select("headline, bio, city, rating_avg, rating_count, completed_orders").eq("profile_id", id).maybeSingle(),
    // placeholder — la vérification est lue depuis provider_directory (voir ci-dessus).
    Promise.resolve({ data: null }),
    supabase
      .from("services")
      .select("id, title, price_minor, currency, delivery_days")
      .eq("provider_id", id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(24),
    supabase.from("reviews").select("id, rating, comment, created_at").eq("target_id", id).order("created_at", { ascending: false }).limit(20),
  ]);

  if (!person) notFound();

  const list = services ?? [];
  const reviewList = reviews ?? [];
  const avg = profile?.rating_avg ? Number(profile.rating_avg) : null;
  const initials = (person.display_name ?? "P").slice(0, 2).toUpperCase();
  const isVerified = person.verification_status === "verified";

  return (
    <>
      <Header locale={locale} />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {/* En-tête prestataire */}
        <header className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
          {/* Halo de marque */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(60% 80% at 10% 0%, var(--color-brand-200) 0%, transparent 70%)",
            }}
          />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
            {/* Avatar */}
            <div className="flex-none">
              <span
                aria-hidden
                className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--color-brand-500)] text-2xl font-extrabold text-white shadow-lg shadow-[var(--color-brand-500)]/30"
              >
                {initials}
              </span>
            </div>

            {/* Infos */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold sm:text-3xl">
                  {person.display_name ?? "Prestataire"}
                </h1>
                {isVerified && (
                  <span
                    title={locale === "en" ? "Identity verified" : "Identité vérifiée"}
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-500)] px-2.5 py-0.5 text-[11px] font-bold text-white"
                  >
                    ✓ {locale === "en" ? "Verified" : "Vérifié"}
                  </span>
                )}
              </div>

              {profile?.headline && (
                <p className="mt-1 text-base text-[var(--subtle)]">{profile.headline}</p>
              )}

              <p className="mt-1 text-sm text-[var(--subtle)]">
                {[profile?.city, person.country_code].filter(Boolean).join(" · ")}
              </p>
            </div>

            {/* Stats */}
            <dl className="grid grid-cols-3 gap-4 text-center sm:gap-6 flex-none">
              <div>
                <dt className="text-xs text-[var(--subtle)]">{t.rating}</dt>
                <dd className="mt-0.5 font-display text-xl font-extrabold">
                  {avg !== null ? `★ ${avg.toFixed(1)}` : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--subtle)]">{t.reviewsCount}</dt>
                <dd className="mt-0.5 font-display text-xl font-extrabold">
                  {profile?.rating_count ?? 0}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--subtle)]">{t.missions}</dt>
                <dd className="mt-0.5 font-display text-xl font-extrabold">
                  {profile?.completed_orders ?? 0}
                </dd>
              </div>
            </dl>
          </div>

          {profile?.bio && (
            <p className="relative mt-6 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-[var(--subtle)]">
              {profile.bio}
            </p>
          )}
        </header>

        {/* Prestations */}
        <section className="mt-12">
          <h2 className="font-display text-xl font-bold">{t.providerTitle}</h2>
          {list.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--subtle)]">{t.providerEmpty}</p>
          ) : (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/services/${s.id}`}
                    className="group block rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-brand-300)] hover:shadow-lg hover:shadow-black/[0.04]"
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
          )}
        </section>

        {/* Avis */}
        <section className="mt-12">
          <h2 className="font-display text-xl font-bold">{t.reviews}</h2>
          {reviewList.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--subtle)]">{t.noReviewsList}</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {reviewList.map((r) => (
                <li key={r.id} className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                    </span>
                    <span className="text-sm text-[var(--subtle)]">{r.rating} {t.ratingOutOf}</span>
                  </div>
                  {r.comment && (
                    <p className="mt-2 text-sm leading-relaxed">{r.comment}</p>
                  )}
                  <p className="mt-2 text-xs text-[var(--subtle)]">
                    {new Date(r.created_at).toLocaleDateString(
                      locale === "en" ? "en-GB" : "fr-FR",
                      { day: "numeric", month: "long", year: "numeric" }
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
}
