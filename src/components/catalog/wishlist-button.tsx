"use client";

import { useState, useEffect } from "react";

const KEY = "toomny_wishlist";

function getWishlist(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

function toggleWishlist(id: string): boolean {
  const list = getWishlist();
  const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  return next.includes(id);
}

export function WishlistButton({
  serviceId,
  size = "sm",
}: {
  serviceId: string;
  size?: "sm" | "md";
}) {
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSaved(getWishlist().includes(serviceId));
  }, [serviceId]);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setSaved(toggleWishlist(serviceId));
  }

  if (!mounted) return null;

  const isSmall = size === "sm";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={saved ? "Retirer des favoris" : "Ajouter aux favoris"}
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
