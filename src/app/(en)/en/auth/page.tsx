import type { Metadata } from "next";
import { headers } from "next/headers";
import { AuthScreen } from "@/components/auth/auth-screen";

export const metadata: Metadata = {
  title: "Create an account",
  description:
    "Join Toomny: hire a vetted provider in West Africa, or sell your services and get paid by mobile money.",
};

export default async function AuthPageEn({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;

  const h = await headers();
  const country = h.get("x-vercel-ip-country") ?? undefined;
  const city = h.get("x-vercel-ip-city") ? decodeURIComponent(h.get("x-vercel-ip-city") as string) : undefined;

  return (
    <AuthScreen
      locale="en"
      initialRole={role === "provider" ? "provider" : "client"}
      initialCountry={country}
      initialCity={city}
    />
  );
}
