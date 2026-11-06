import type { Metadata } from "next";
import { GlassyDashboards, type DashRole } from "../glassy-dashboards";
import { GlassyShell, GlassyContextBar } from "../glassy-shell";

/**
 * Maquette des tableaux de bord « Aurora Glass ».
 *
 * Trois rôles sur une seule route, choisis par `?role=`. Aucune donnée réelle
 * n'est lue : tout vient de `glassy-demo.ts`, pour que la maquette s'affiche
 * même sans base de données.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Proposition — tableaux de bord",
  robots: { index: false, follow: false },
};

const ROLES: DashRole[] = ["client", "prestataire", "admin"];

export default async function DashboardsPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const current: DashRole = ROLES.includes(role as DashRole) ? (role as DashRole) : "client";

  return (
    <GlassyShell>
      <GlassyContextBar
        label="Proposition · tableaux de bord"
        links={[
          { href: "/design-glassy", label: "← La vitrine" },
          { href: "/", label: "Design actuel" },
        ]}
      />

      <GlassyDashboards role={current} />

      <p className="mx-auto max-w-7xl px-4 pb-10 text-[10px] text-white/35 sm:px-6">
        Données fictives · aucune lecture en base · même contenu que les espaces
        connectés actuels (commandes, versements, litiges, vérifications).
      </p>
    </GlassyShell>
  );
}
