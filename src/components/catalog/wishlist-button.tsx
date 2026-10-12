"use client";

import { useSyncExternalStore } from "react";

const KEY = "toomny_wishlist";
const EVENT = "toomny:wishlist-change";

function snapshot(): string {
  try {
    return localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function subscribe(callback: () => void): () => void {
  // `storage` ne se déclenche que dans les AUTRES onglets : on émet aussi un
  // événement local après chaque écriture, pour ce même onglet.
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT, callback);
  };
}

function readIds(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function toggleWishlist(id: string): void {
  const list = readIds(snapshot());
  const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Stockage indisponible (mode privé) : le bouton reste inerte, sans erreur.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function WishlistButton({
  serviceId,
  size = "sm",
  labels,
}: {
  serviceId: string;
  size?: "sm" | "md";
  labels: { add: string; remove: string };
}) {
  // Lecture externe synchronisée : pas de setState dans un effet (rendus en
  // cascade), pas de flash à l'hydratation, et tous les boutons de la page
  // reflètent le même état.
  const raw = useSyncExternalStore(subscribe, snapshot, () => "[]");
  const saved = readIds(raw).includes(serviceId);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(serviceId);
  }

  const isSmall = size === "sm";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={saved ? labels.remove : labels.add}
      aria-pressed={saved}
      className={`flex items-center justify-center rounded-full border transition-all duration-200 ${
        isSmall ? "h-7 w-7 text-sm" : "h-9 w-9 text-base"
      } ${
        saved
          ? "border-red-300 bg-red-50 text-red-500 hover:border-red-400 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
          : "border-[var(--border)] bg-[var(--background)]/80 text-[var(--subtle)] hover:border-[var(--color-brand-300)] hover:text-red-400 backdrop-blur-sm"
      }`}
    >
      <svg
        width={isSmall ? 13 : 16}
        height={isSmall ? 13 : 16}
        viewBox="0 0 24 24"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
