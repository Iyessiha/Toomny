"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "toomny_pwa_dismissed";

export function PwaInstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Ne pas re-afficher si déjà dismissé dans les 30 jours
    try {
      const ts = localStorage.getItem(DISMISSED_KEY);
      if (ts && Date.now() - Number(ts) < 30 * 24 * 3600 * 1000) return;
    } catch {}

    // Ne pas afficher si déjà installé en mode standalone
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // iOS : pas d'API beforeinstallprompt, on affiche l'astuce Safari
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as Record<string, unknown>).MSStream;
    if (ios && !window.matchMedia("(display-mode: standalone)").matches) {
      setIsIos(true);
      const t = setTimeout(() => setVisible(true), 4000);
      return () => clearTimeout(t);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      const t = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(t);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    try { localStorage.setItem(DISMISSED_KEY, String(Date.now())); } catch {}
    setVisible(false);
  }

  async function install() {
    if (!prompt) return;
    setInstalling(true);
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "dismissed") {
      try { localStorage.setItem(DISMISSED_KEY, String(Date.now())); } catch {}
    }
    setVisible(false);
    setPrompt(null);
    setInstalling(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Installer l'application Toomny"
      className="fixed bottom-0 left-0 right-0 z-[9999] flex justify-center p-4 sm:bottom-6 sm:right-6 sm:left-auto sm:p-0"
      style={{ animation: "pwa-slide-up 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}
    >
      <style>{`
        @keyframes pwa-slide-up {
          from { opacity: 0; transform: translateY(100%) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>

      <div className="w-full max-w-sm rounded-2xl border border-[var(--color-brand-200)] bg-[var(--background)] shadow-2xl overflow-hidden sm:w-80">
        {/* Bande verte supérieure */}
        <div className="h-1 w-full bg-gradient-to-r from-[var(--color-brand-400)] via-[var(--color-brand-500)] to-[var(--color-brand-600)]" />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="shrink-0 rounded-2xl overflow-hidden border border-[var(--border)]">
              <Image
                src="/icons/icon-192.png"
                alt="Toomny"
                width={52}
                height={52}
                className="block"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-bold leading-tight">Installer Toomny</p>
              <p className="mt-0.5 text-xs text-[var(--subtle)] leading-snug">
                Accès rapide · Fonctionne hors ligne · Zéro pub
              </p>
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Fermer"
              className="shrink-0 rounded-lg p-1 text-[var(--subtle)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Avantages */}
          <ul className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] text-[var(--subtle)]">
            {[
              { icon: "⚡", label: "Rapide" },
              { icon: "📶", label: "Hors ligne" },
              { icon: "🔔", label: "Notifications" },
            ].map(({ icon, label }) => (
              <li key={label} className="flex flex-col items-center gap-1 rounded-xl bg-[var(--surface)] py-2">
                <span className="text-base leading-none">{icon}</span>
                <span className="font-medium">{label}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          {isIos ? (
            <div className="mt-4 rounded-xl bg-[var(--surface)] p-3 text-xs text-[var(--subtle)] leading-relaxed">
              <p className="font-semibold text-[var(--foreground)] mb-1">Installer sur iPhone / iPad</p>
              Appuyez sur{" "}
              <svg className="inline h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a.75.75 0 01.75.75v10.5a.75.75 0 01-1.5 0V2.75A.75.75 0 0112 2zm-4.47 4.28a.75.75 0 011.06 0L12 9.69l3.41-3.41a.75.75 0 111.06 1.06l-4 4a.75.75 0 01-1.06 0l-4-4a.75.75 0 010-1.06z"/><path d="M3.75 14A2.25 2.25 0 016 11.75h2.25a.75.75 0 010 1.5H6a.75.75 0 00-.75.75v5.25c0 .414.336.75.75.75h12a.75.75 0 00.75-.75V14a.75.75 0 00-.75-.75h-2.25a.75.75 0 010-1.5H18A2.25 2.25 0 0120.25 14v5.25A2.25 2.25 0 0118 21.5H6a2.25 2.25 0 01-2.25-2.25V14z"/>
              </svg>{" "}
              puis « <strong className="text-[var(--foreground)]">Sur l'écran d'accueil</strong> »
            </div>
          ) : (
            <button
              type="button"
              onClick={install}
              disabled={installing}
              className="mt-4 w-full rounded-full bg-[var(--color-brand-500)] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[var(--color-brand-600)] active:scale-95 disabled:opacity-60"
            >
              {installing ? "Installation…" : "Installer l'application"}
            </button>
          )}

          <button
            type="button"
            onClick={dismiss}
            className="mt-2 w-full rounded-full py-2 text-xs text-[var(--subtle)] hover:text-[var(--foreground)] transition-colors"
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
