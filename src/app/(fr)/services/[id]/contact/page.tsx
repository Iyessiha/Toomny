import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCatalogTexts } from "@/i18n/catalog";
import { UUID_RE } from "@/lib/orders";
import { categoryMeta, categoryGradient } from "@/lib/categories";
import { InquiryForm } from "@/components/catalog/inquiry-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return {};
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("title")
    .eq("id", id)
    .maybeSingle();
  return { title: data?.title ? `Contacter · ${data.title}` : "Contacter le prestataire" };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const user = await requireAuth();
  const locale = user.preferredLocale;
  const t = getCatalogTexts(locale);

  const supabase = await createClient();
  const { data: service } = await supabase
    .from("services")
    .select(
      "id, title, price_minor, currency, delivery_days, status, provider_id, cover_url, category:categories(slug, name_fr, name_en)"
    )
    .eq("id", id)
    .maybeSingle();

  if (!service || service.status !== "active") notFound();
  if (service.provider_id === user.id) redirect(`/services/${id}`);

  const category = Array.isArray(service.category) ? service.category[0] : service.category;
  const gradient = categoryGradient(category?.slug);
  const meta = category ? categoryMeta(category.slug) : null;

  const { data: provider } = await supabase
    .from("provider_directory")
    .select("display_name, country_code")
    .eq("id", service.provider_id)
    .maybeSingle();

  const providerInitials = (provider?.display_name ?? "P").slice(0, 2).toUpperCase();
  const categoryName = locale === "en" ? category?.name_en ?? category?.name_fr : category?.name_fr;

  return (
    <>
      <Header locale={locale} />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        {/* Breadcrumb */}
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[var(--subtle)]" aria-label="breadcrumb">
          <Link href="/services" className="hover:text-[var(--foreground)]">{t.listTitle}</Link>
          <span aria-hidden>›</span>
          <Link href={`/services/${id}`} className="hover:text-[var(--foreground)]">{service.title}</Link>
          <span aria-hidden>›</span>
          <span className="text-[var(--foreground)]">{t.contactSeller}</span>
        </nav>

        {/* Service summary card */}
        <div className="mb-8 flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl"
            style={service.cover_url ? undefined : { background: gradient }}
          >
            {service.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={service.cover_url} alt="" className="h-full w-full object-cover" />
            ) : meta?.icon ? (
              <meta.icon className="h-8 w-8 text-white/30" aria-hidden />
            ) : (
              <span className="text-xl font-bold text-white/40">{providerInitials}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{service.title}</p>
            <p className="mt-0.5 flex items-center gap-2 text-sm text-[var(--subtle)]">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ background: gradient }}
              >
                {providerInitials}
              </span>
              {provider?.display_name}
              {provider?.country_code && (
                <span className="text-[var(--subtle)]">· {provider.country_code}</span>
              )}
            </p>
          </div>
        </div>

        {/* Form section */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 sm:p-8">
          <h1 className="text-xl font-bold">{t.contactTitle}</h1>
          <p className="mt-2 text-sm text-[var(--subtle)]">{t.contactLead}</p>

          <InquiryForm
            serviceId={id}
            locale={locale}
            backHref={`/services/${id}`}
          />
        </div>
      </main>
      <Footer locale={locale} />
    </>
  );
}
