"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Intervalle entre deux rafraîchissements en arrière-plan (onglet visible uniquement). */
const REFRESH_MS = 2 * 60 * 1000;

/**
 * Rafraîchit silencieusement les Server Components de la page :
 * - quand l'onglet reprend le focus (retour d'une autre page / autre onglet)
 * - toutes les 2 minutes, seulement tant que l'onglet est visible
 *
 * Utile sur le dashboard pour refléter les changements de statut
 * de commande déclenchés par les webhooks GeniusPay. Chaque rafraîchissement
 * rejoue les requêtes serveur de la page : on limite la fréquence pour
 * ne pas épuiser le CPU des fonctions.
 */
export function AutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const onFocus = () => router.refresh();
    window.addEventListener("focus", onFocus);

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, REFRESH_MS);

    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(interval);
    };
  }, [router]);

  return null;
}
