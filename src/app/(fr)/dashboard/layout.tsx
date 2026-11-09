import { getCurrentUser, isProvider } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { unreadSupportCount } from "@/lib/support-unread-server";
import { NavBadgesProvider } from "@/components/dashboard/nav-badges";

/**
 * Compteurs de la navigation du tableau de bord, lus une fois par page.
 * - support : réponses de l'équipe non lues
 * - orders : actions attendues (prestataire : commande à démarrer ; client : livraison à valider)
 * - services : prestations renvoyées par l'équipe, à corriger
 * - notifications : notifications non lues
 * Chaque lecture passe par la RLS : seules les lignes du lecteur comptent.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) return <NavBadgesProvider value={{}}>{children}</NavBadgesProvider>;

  const supabase = await createClient();
  const provider = isProvider(user.role);

  const [support, notifications, toStart, toValidate, changesRequested] = await Promise.all([
    unreadSupportCount(createAdminClient(), user.id),
    supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null),
    provider
      ? supabase.from("orders").select("id", { count: "exact", head: true }).eq("provider_id", user.id).eq("status", "funded")
      : Promise.resolve({ count: 0 }),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("client_id", user.id).eq("status", "delivered"),
    provider
      ? supabase
          .from("services")
          .select("id", { count: "exact", head: true })
          .eq("provider_id", user.id)
          .eq("status", "draft")
          .not("review_notes", "is", null)
      : Promise.resolve({ count: 0 }),
  ]);

  return (
    <NavBadgesProvider
      value={{
        support,
        notifications: notifications.count ?? 0,
        orders: (toStart.count ?? 0) + (toValidate.count ?? 0),
        services: changesRequested.count ?? 0,
      }}
    >
      {children}
    </NavBadgesProvider>
  );
}
