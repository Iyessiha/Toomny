import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect, notFound } from "next/navigation";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCatalogTexts } from "@/i18n/catalog";
import { UUID_RE } from "@/lib/orders";
import { DirectInquiryForm } from "@/components/catalog/direct-inquiry-form";

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
    .from("provider_directory")
    .select("display_name")
    .eq("id", id)
    .maybeSingle();
  return {
    title: data?.display_name
      ? `Contacter ${data.display_name}`
      : "Contacter le prestataire",
  };
}

export default async function ProviderContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const user = await requireAuth();
  if (user.id === id) redirect(`/prestataires/${id}`);

  const locale = user.preferredLocale;
  const t = getCatalogTexts(locale);

  const supabase = await createClient();
  const [{ data: person }, { data: profile }] = await Promise.all([
    supabase
      .from("provider_directory")
      .select("id, display_name, country_code")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("provider_profiles")
      .select("headline, avatar_url")
      .eq("profile_id", id)
      .maybeSingle(),
  ]);

  if (!person) notFound();

  const initials = (person.display_name ?? "P").slice(0, 2).toUpperCase();
  const backHref = `/prestataires/${id}`;

  return (
    <>
      <Header locale={locale} />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        {/* Breadcrumb */}
        <nav
          className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[var(--subtle)]"
          aria-label="breadcrumb"
        >
          <Link href="/services" className="hover:text-[var(--foreground)]">
            {t.listTitle}
          </Link>
          <span aria-hidden>›</span>
          <Link href={backHref} className="hover:text-[var(--foreground)]">
            {person.display_name}
          </Link>
          <span aria-hidden>›</span>
          <span className="text-[var(--foreground)]">{t.contactSeller}</span>
        </nav>

        {/* Provider card */}
        <div className="mb-8 flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          {profile?.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={person.display_name ?? ""}
              width={56}
              height={56}
              className="h-14 w-14 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <span
              aria-hidden
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-500)] text-lg font-extrabold text-white"
            >
              {initials}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{person.display_name}</p>
            {profile?.headline && (
              <p className="mt-0.5 truncate text-sm text-[var(--subtle)]">
                {profile.headline}
              </p>
            )}
            {person.country_code && (
              <p className="mt-0.5 text-xs text-[var(--subtle)]">
                {person.country_code}
              </p>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 sm:p-8">
          <h1 className="text-xl font-bold">{t.contactTitle}</h1>
          <p className="mt-2 text-sm text-[var(--subtle)]">{t.contactLead}</p>

          <DirectInquiryForm
            providerId={id}
            locale={locale}
            backHref={backHref}
          />
        </div>
      </main>
      <Footer locale={locale} />
    </>
  );
}
