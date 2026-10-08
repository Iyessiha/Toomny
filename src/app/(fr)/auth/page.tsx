import type { Metadata } from "next";
import { getPublicPageTexts } from "@/i18n/public-pages";
import { visitorLocale } from "@/i18n/server-locale";
import { headers } from "next/headers";
import { AuthScreen } from "@/components/auth/auth-screen";

export async function generateMetadata(): Promise<Metadata> {
  const t = getPublicPageTexts(await visitorLocale()).titles;
  return { title: t.auth, description: t.authDescription };
}

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;

  // Pays et ville détectés par Vercel : pré-remplissage du formulaire, jamais une contrainte.
  const h = await headers();
  const country = h.get("x-vercel-ip-country") ?? undefined;
  const city = h.get("x-vercel-ip-city") ? decodeURIComponent(h.get("x-vercel-ip-city") as string) : undefined;

  return (
    <AuthScreen
      locale="fr"
      initialRole={role === "provider" ? "provider" : "client"}
      initialCountry={country}
      initialCity={city}
    />
  );
}
