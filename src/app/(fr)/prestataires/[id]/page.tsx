import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/money";
import { UUID_RE } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return { title: "Prestataire introuvable" };
  const supabase = await createClient();
  const { data } = await supabase.from("provider_directory").select("display_name").eq("id", id).maybeSingle();
  return { title: data?.display_name ?? "Prestataire introuvable" };
}

export default async function ProviderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const supabase = await createClient();
  // Seules les colonnes de vitrine sont lisibles (pas de numéro de versement).
  const [{ data: person }, { data: profile }, { data: services }, { data: reviews }] = await Promise.all([
    supabase.from("provider_directory").select("id, display_name, country_code").eq("id", id).maybeSingle(),
    supabase.from("provider_profiles").select("headline, bio, city, rating_avg, rating_count, completed_orders").eq("profile_id", id).maybeSingle(),
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

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <header className="flex flex-col gap-4 border-b border-[var(--border)] pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">{person.display_name ?? "Prestataire"}</h1>
            <p className="mt-2 text-base text-[var(--subtle)]">{profile?.headline ?? "Prestataire Toomny"}</p>
            <p className="mt-1 text-sm text-[var(--subtle)]">
              {[profile?.city, person.country_code].filter(Boolean).join(" · ")}
            </p>
          </div>
          <dl className="grid grid-cols-3 gap-6 text-center">
            <div><dt className="text-xs text-[var(--subtle)]">Note</dt><dd className="font-display text-lg font-bold">{avg !== null ? `★ ${avg.toFixed(1)}` : "—"}</dd></div>
            <div><dt className="text-xs text-[var(--subtle)]">Avis</dt><dd className="font-display text-lg font-bold">{profile?.rating_count ?? 0}</dd></div>
            <div><dt className="text-xs text-[var(--subtle)]">Missions</dt><dd className="font-display text-lg font-bold">{profile?.completed_orders ?? 0}</dd></div>
          </dl>
        </header>

        {profile?.bio && <p className="mt-8 max-w-3xl whitespace-pre-line text-base leading-relaxed">{profile.bio}</p>}

        <section className="mt-12">
          <h2 className="font-display text-xl font-bold">Prestations</h2>
          {list.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--subtle)]">Aucune prestation publiée pour le moment.</p>
          ) : (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((s) => (
                <li key={s.id}>
                  <Link href={`/services/${s.id}`} className="block rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 hover:border-[var(--color-brand-300)]">
                    <p className="font-semibold">{s.title}</p>
                    <p className="mt-3 text-sm text-[var(--subtle)]">
                      {formatMoney(BigInt(s.price_minor), s.currency, "fr")} · {s.delivery_days} j
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-12">
          <h2 className="font-display text-xl font-bold">Avis</h2>
          {reviewList.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--subtle)]">Pas encore d&apos;avis.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {reviewList.map((r) => (
                <li key={r.id} className="rounded-2xl border border-[var(--border)] p-5">
                  <p className="text-sm font-semibold">★ {r.rating} / 5</p>
                  {r.comment && <p className="mt-2 text-sm leading-relaxed">{r.comment}</p>}
                  <p className="mt-2 text-xs text-[var(--subtle)]">{new Date(r.created_at).toLocaleDateString("fr-FR")}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
