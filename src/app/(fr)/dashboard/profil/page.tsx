import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAuth, isProvider } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/shell";
import { ProfileForm } from "@/components/dashboard/profile-form";

export const metadata: Metadata = { title: "Mon profil public · Toomny" };
export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const user = await requireAuth();
  if (!isProvider(user.role)) redirect("/dashboard");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("provider_profiles")
    .select("headline, bio, city, content_locale")
    .eq("profile_id", user.id)
    .maybeSingle();

  return (
    <DashboardShell
      user={user}
      title="Mon profil public"
      subtitle="Ce que les clients voient avant de commander"
      nav={[
        { href: "/dashboard", label: "Vue d'ensemble" },
        { href: "/dashboard/prestations", label: "Mes prestations" },
        { href: "/dashboard/profil", label: "Mon profil", current: true },
        { href: "/orders", label: "Commandes" },
      ]}
    >
      <div className="max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6">
        <ProfileForm
          defaults={{
            headline: profile?.headline ?? "",
            bio: profile?.bio ?? "",
            city: profile?.city ?? user.city ?? "",
            contentLocale: profile?.content_locale ?? "fr",
          }}
          publicPath={`/prestataires/${user.id}`}
        />
      </div>
    </DashboardShell>
  );
}
