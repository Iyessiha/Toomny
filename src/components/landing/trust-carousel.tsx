"use client";

import { useEffect, useRef, useState } from "react";

export type TrustPoint = { title: string; body: string };

const AUTO_MS = 5000;

/**
 * Carrousel des garanties : défilement tactile et souris, flèches, points, et défilement
 * automatique qui s'arrête dès que l'utilisateur interagit. Même comportement sur mobile et ordinateur.
 */
export function TrustCarousel({ items, label, prevLabel, nextLabel }: { items: TrustPoint[]; label: string; prevLabel: string; nextLabel: string }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  function go(next: number) {
    const track = trackRef.current;
    if (!track) return;
    const count = items.length;
    const target = ((next % count) + count) % count;
    const child = track.children[target] as HTMLElement | undefined;
    child?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
    setIndex(target);
  }

  useEffect(() => {
    if (paused || items.length < 2) return;
    const timer = window.setInterval(() => go(index + 1), AUTO_MS);
    return () => window.clearInterval(timer);
  });

  function onScroll() {
    const track = trackRef.current;
    if (!track || track.children.length === 0) return;
    const width = (track.children[0] as HTMLElement).offsetWidth + 16;
    setIndex(Math.round(track.scrollLeft / width));
  }

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
    >
      <ul
        ref={trackRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((p) => (
          <li
            key={p.title}
            className="flex w-[82%] shrink-0 snap-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.7rem)]"
          >
            <span aria-hidden className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[var(--color-brand-500)] text-xs font-bold text-white">✓</span>
            <div>
              <p className="text-sm font-semibold">{p.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--subtle)]">{p.body}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => go(index - 1)}
          aria-label={prevLabel}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-sm hover:border-[var(--color-brand-500)]"
        >
          ←
        </button>
        <div className="flex items-center gap-1.5">
          {items.map((p, i) => (
            <button
              key={p.title}
              type="button"
              onClick={() => go(i)}
              aria-label={`${i + 1} / ${items.length}`}
              aria-current={i === index}
              className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-[var(--color-brand-500)]" : "w-2 bg-[var(--border)]"}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(index + 1)}
          aria-label={nextLabel}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-sm hover:border-[var(--color-brand-500)]"
        >
          →
        </button>
      </div>
    </div>
  );
}
