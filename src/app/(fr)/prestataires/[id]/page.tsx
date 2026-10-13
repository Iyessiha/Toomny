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
import { visitorLocale } from "@/i18n/server-locale";
import { ServiceCard } from "@/components/catalog/service-card";
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
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const [
    { data: personFromView },
    { data: profile },
    { data: services },
    { data: reviews },
  ] = await Promise.all([
    supabase.from("provider_directory").select("id, display_name, country_code, verification_status").eq("id", id).maybeSingle(),
    supabase.from("provider_profiles").select("headline, bio, city, rating_avg, rating_count, completed_orders, avatar_url, skills, spoken_languages").eq("profile_id", id).maybeSingle(),
    supabase
      .from("services")
      .select("id, title, description, price_minor, currency, delivery_days, cover_url, tags, category:categories(slug)")
      .eq("provider_id", id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(24),
    supabase.from("reviews").select("id, rating, comment, created_at, author_id").eq("target_id", id).order("created_at", { ascending: false }).limit(20),
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
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={person.display_name ?? ""}
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-2xl object-cover shadow-lg"
                />
              ) : (
                <span
                  aria-hidden
                  className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--color-brand-500)] text-2xl font-extrabold text-white shadow-lg shadow-[var(--color-brand-500)]/30"
                >
                  {initials}
                </span>
              )}
            </div>

            {/* Infos */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold sm:text-3xl">
                  {person.display_name ?? t.detailProvider}
                </h1>
                {isVerified && (
                  <span
                    title={t.identityVerified}
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-500)] px-2.5 py-0.5 text-[11px] font-bold text-white"
                  >
                    ✓ {t.badgeVerified}
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

          {/* Compétences */}
          {profile?.skills && (
            <div className="relative mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--subtle)]">
                {t.skillsTitle}
              </p>
              <div className="flex flex-wrap gap-2">
                {profile.skills.split(",").map((s: string) => s.trim()).filter(Boolean).map((skill: string) => (
                  <span
                    key={skill}
                    className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Langues */}
          {profile?.spoken_languages && (
            <div className="relative mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--subtle)]">
                {t.languagesTitle}
              </p>
              <div className="flex flex-wrap gap-2">
                {profile.spoken_languages.split(",").map((l: string) => l.trim()).filter(Boolean).map((code: string) => (
                  <span
                    key={code}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-medium"
                  >
                    <span aria-hidden className="text-sm">
                      {LANG_FLAG[code.toLowerCase()] ?? "🌐"}
                    </span>
                    {LANG_LABEL[code.toLowerCase()] ?? code.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* CTA Contacter */}
          {currentUser && currentUser.id !== id && (
            <div className="relative mt-6 flex flex-wrap gap-3">
              <Link
                href={`/prestataires/${id}/contact`}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand-500)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-brand-600)]"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                {t.contactCta}
              </Link>
            </div>
          )}
          {!currentUser && (
            <div className="relative mt-6">
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold transition-colors hover:border-[var(--color-brand-300)] hover:text-[var(--color-brand-600)]"
              >
                {t.loginToContact}
              </Link>
            </div>
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
                  <ServiceCard service={s} locale={locale} />
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
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-100)] text-xs font-bold text-[var(--color-brand-700)]"
                    >
                      {authorName(r.author_id).charAt(0).toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-none">{authorName(r.author_id)}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                        </span>
                        <span className="text-sm text-[var(--subtle)]">{r.rating} {t.ratingOutOf}</span>
                      </div>
                    </div>
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
