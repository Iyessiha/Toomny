"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Rafraîchit silencieusement les Server Components de la page :
 * - quand l'onglet reprend le focus (retour d'une autre page / autre onglet)
 * - toutes les 30 secondes en arrière-plan
 *
 * Utile sur le dashboard pour refléter les changements de statut
 * de commande déclenchés par les webhooks GeniusPay.
 */
export function AutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const onFocus = () => router.refresh();
    window.addEventListener("focus", onFocus);

    const interval = setInterval(() => router.refresh(), 30_000);

    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(interval);
    };
  }, [router]);

  return null;
}
