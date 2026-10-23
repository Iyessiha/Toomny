"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { getNotificationTexts, type NotificationParams } from "@/i18n/notifications";
import type { Locale } from "@/i18n/dictionaries";

const SOUND_KEY = "toomny-alert-sound";
const TOAST_MS = 8000;
const MAX_TOASTS = 3;

type Toast = { id: number; title: string; body: string; href: string };
type NotificationRow = { id: string; type: string; params: NotificationParams | null; link: string };

const COPY = {
  fr: { sound_on: "Son activé", sound_off: "Son coupé", close: "Fermer", alert: "Nouvelle notification" },
  en: { sound_on: "Sound on", sound_off: "Sound off", close: "Close", alert: "New notification" },
} as const;

let audio: AudioContext | null = null;

/** Crée (ou reprend) le contexte audio. Le navigateur n'autorise le son qu'après un geste de l'utilisateur. */
function audioContext(): AudioContext | null {
  try {
    if (!audio) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audio = new Ctor();
    }
    if (audio.state === "suspended") void audio.resume();
    return audio;
  } catch {
    return null;
  }
}

/** Carillon court en deux notes, généré sans fichier audio. */
function playChime(): void {
  const ctx = audioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  [
    { at: 0, freq: 880 },
    { at: 0.16, freq: 1175 },
  ].forEach(({ at, freq }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now + at);
    gain.gain.exponentialRampToValueAtTime(0.25, now + at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.4);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + at);
    osc.stop(now + at + 0.45);
  });
}

function readSoundPreference(): boolean {
  try {
    return window.localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

/**
 * Alertes en direct pour le tableau de bord : une nouvelle notification fait sonner,
 * affiche un bandeau cliquable, met à jour le titre de l'onglet et rafraîchit les badges.
 * Le canal Realtime est filtré sur le lecteur et protégé par la RLS des notifications.
 */
export function LiveAlerts({ locale }: { locale: Locale }) {
  const router = useRouter();
  const t = COPY[locale];
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [soundOn, setSoundOn] = useState(true);
  const soundRef = useRef(true);
  const nextId = useRef(0);
  const unread = useRef(0);
  const baseTitle = useRef<string | null>(null);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((toast) => toast.id !== id));
  }, []);

  const notifyNew = useCallback(
    (row: NotificationRow) => {
      if (soundRef.current) playChime();
      if (navigator.vibrate) navigator.vibrate([120, 60, 120]);

      const copy = getNotificationTexts(locale).items[row.type as keyof ReturnType<typeof getNotificationTexts>["items"]];
      const toast: Toast = {
        id: ++nextId.current,
        title: copy?.title ?? t.alert,
        body: copy ? copy.body(row.params ?? {}) : "",
        href: row.link,
      };
      setToasts((list) => [toast, ...list].slice(0, MAX_TOASTS));
      window.setTimeout(() => dismiss(toast.id), TOAST_MS);

      unread.current += 1;
      if (baseTitle.current !== null) document.title = `(${unread.current}) ${baseTitle.current}`;
      router.refresh();
    },
    [dismiss, locale, router, t.alert],
  );

  useEffect(() => {
    const saved = readSoundPreference();
    soundRef.current = saved;
    setSoundOn(saved);
    baseTitle.current = document.title;

    // Le son exige un geste : on prépare le contexte au premier clic ou toucher.
    const unlock = () => {
      audioContext();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);

    const supabase = createClient();
    let channel: RealtimeChannel | null = null;
    let cancelled = false;

    void supabase.auth.getUser().then(({ data }) => {
      const userId = data.user?.id;
      if (!userId || cancelled) return;
      channel = supabase
        .channel(`notifications-${userId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${userId}` },
          (payload) => notifyNew(payload.new as NotificationRow),
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      if (channel) void supabase.removeChannel(channel);
      if (baseTitle.current !== null) document.title = baseTitle.current;
    };
  }, [notifyNew]);

  function toggleSound() {
    const next = !soundRef.current;
    soundRef.current = next;
    setSoundOn(next);
    try {
      window.localStorage.setItem(SOUND_KEY, next ? "on" : "off");
    } catch {
      // Préférence non sauvegardée : elle reste active pour cette page.
    }
    if (next) playChime();
  }

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-50 flex w-[min(92vw,360px)] flex-col gap-3">
      <div className="pointer-events-auto flex justify-end">
        <button
          type="button"
          onClick={toggleSound}
          aria-pressed={soundOn}
          className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--subtle)] shadow-sm hover:text-[var(--foreground)]"
        >
          {soundOn ? `🔔 ${t.sound_on}` : `🔕 ${t.sound_off}`}
        </button>
      </div>

      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          aria-live="polite"
          className="pointer-events-auto rounded-2xl border border-[var(--color-brand-500)] bg-white p-4 shadow-xl"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[var(--color-brand-500)] text-sm font-bold text-white" aria-hidden>
              !
            </span>
            <Link href={toast.href} onClick={() => dismiss(toast.id)} className="min-w-0 flex-1">
              <p className="font-display text-sm font-bold text-[var(--foreground)]">{toast.title}</p>
              {toast.body && <p className="mt-0.5 line-clamp-2 text-xs text-[var(--subtle)]">{toast.body}</p>}
            </Link>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label={t.close}
              className="flex-none text-lg leading-none text-[var(--subtle)] hover:text-[var(--foreground)]"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
