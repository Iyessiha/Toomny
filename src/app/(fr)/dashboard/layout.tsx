import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { unreadSupportCount } from "@/lib/support-unread-server";
import { NavBadgesProvider } from "@/components/dashboard/nav-badges";

/**
 * Compteurs de la navigation du tableau de bord. Une seule lecture par page :
 * les réponses de support non lues, affichées sur « Contacter Toomny ».
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const support = user ? await unreadSupportCount(createAdminClient(), user.id) : 0;
  return <NavBadgesProvider value={{ support }}>{children}</NavBadgesProvider>;
}
