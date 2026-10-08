import type { Metadata } from "next";
import { headers } from "next/headers";
import { AuthScreen } from "@/components/auth/auth-screen";

export const metadata: Metadata = {
  title: "Créer un compte",
  description:
    "Rejoignez Toomny : recrutez un prestataire d'Afrique de l'Ouest, ou vendez vos services et soyez payé en mobile money.",
};

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
