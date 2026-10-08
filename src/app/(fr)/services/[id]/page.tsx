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

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return { title: "Prestation introuvable" };
  const supabase = await createClient();
  const { data } = await supabase.from("services").select("title").eq("id", id).maybeSingle();
  return { title: data?.title ?? "Prestation introuvable" };
}

export default async function ServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // RLS : seules les prestations publiées sont lisibles ici, sauf pour leur prestataire.
  const { data: service } = await supabase
    .from("services")
    .select("id, title, description, price_minor, currency, delivery_days, status, provider_id, category:categories(slug, name_fr)")
    .eq("id", id)
    .maybeSingle();
  if (!service) notFound();

  const [{ data: provider }, { data: reviewRows }] = await Promise.all([
    supabase.from("provider_directory").select("display_name, country_code").eq("id", service.provider_id).maybeSingle(),
    supabase.from("reviews").select("rating").eq("target_id", service.provider_id),
  ]);

  const category = Array.isArray(service.category) ? service.category[0] : service.category;
  const meta = category ? categoryMeta(category.slug) : null;
  const reviews = reviewRows ?? [];
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
  const isOwner = user?.id === service.provider_id;

  return (
    <>
      <Header />
      <main className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_380px]">
        <article>
          <p className="text-sm text-[var(--subtle)]">
            {meta && <meta.icon className="mr-2 inline h-4 w-4" aria-hidden />}
            <Link href={`/services?categorie=${category?.slug ?? ""}`} className="underline underline-offset-4">
              {category?.name_fr ?? "Catégorie"}
            </Link>
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">{service.title}</h1>
          <p className="mt-2 text-sm text-[var(--subtle)]">
            <Link href={`/prestataires/${service.provider_id}`} className="underline underline-offset-4">
              {provider?.display_name ?? "Prestataire"}
            </Link>
            {provider?.country_code ? ` · ${provider.country_code}` : ""}
            {avg !== null ? ` · ★ ${avg.toFixed(1)} (${reviews.length})` : " · Pas encore d'avis"}
          </p>
          <p className="mt-8 whitespace-pre-line text-base leading-relaxed">{service.description}</p>
        </article>

        <aside className="h-fit rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6">
          <p className="font-display text-2xl font-bold">{formatMoney(BigInt(service.price_minor), service.currency, "fr")}</p>
          <p className="mt-1 text-sm text-[var(--subtle)]">Livraison en {service.delivery_days} jour{service.delivery_days > 1 ? "s" : ""}</p>
          <div className="mt-6">
            {!user ? (
              <Link href="/auth" className="block rounded-full bg-[var(--color-brand-500)] px-6 py-3.5 text-center text-sm font-semibold text-white">
                Se connecter pour commander
              </Link>
            ) : isOwner ? (
              <p className="text-sm text-[var(--subtle)]">C&apos;est votre prestation.</p>
            ) : (
              <ServiceOrderForm serviceId={service.id} />
            )}
          </div>
        </aside>
      </main>
      <Footer />
    </>
  );
}
