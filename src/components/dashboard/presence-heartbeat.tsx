"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/** Intervalle entre deux signaux de présence. La vue ne compte en ligne que les 15 dernières minutes. */
const HEARTBEAT_MS = 2 * 60 * 1000;
const SESSION_KEY = "toomny-presence-session";

function sessionId(): string {
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const created = crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    return crypto.randomUUID();
  }
}

/**
 * Signale la présence du connecté tant que l'onglet est visible. Hors session,
 * l'appel est refusé par la base : l'erreur est ignorée, rien n'est affiché.
 */
export function PresenceHeartbeat() {
  useEffect(() => {
    const supabase = createClient();
    const id = sessionId();

    const beat = () => {
      if (document.visibilityState !== "visible") return;
      void supabase.rpc("update_user_presence", { p_session_id: id }).then(
        () => undefined,
        () => undefined,
      );
    };

    beat();
    const timer = window.setInterval(beat, HEARTBEAT_MS);
    document.addEventListener("visibilitychange", beat);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", beat);
    };
  }, []);

  return null;
}
