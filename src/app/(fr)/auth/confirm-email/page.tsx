import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SignOutButton } from "@/components/dashboard/sign-out";
import { ResendConfirmationButton } from "@/components/auth/resend-confirmation-button";

export const metadata: Metadata = {
  title: "Confirmez votre adresse · Toomny",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function ConfirmEmailPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");
  if (user.emailConfirmed) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4 py-12">
      <div className="space-y-2 text-center">
        <h1 className="font-display text-2xl font-bold">Confirmez votre adresse</h1>
        <p className="text-sm text-[var(--subtle)]">
          Nous avons envoyé un lien de confirmation à <span className="font-semibold text-[var(--foreground)]">{user.email}</span>.
          Cliquez dessus pour accéder à votre espace. Le lien est valable 24 heures.
        </p>
      </div>
      <ResendConfirmationButton />
      <p className="text-center text-xs text-[var(--subtle)]">
        Mauvaise adresse ? Déconnectez-vous puis créez un nouveau compte.
      </p>
      <div className="flex justify-center">
        <SignOutButton label="Se déconnecter" />
      </div>
    </main>
  );
}
