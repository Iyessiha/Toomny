"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Pixels par image : défilement lent, de gauche à droite. */
const PIXELS_PER_FRAME = 0.35;

/**
 * Carrousel de prestataires : défilement continu très lent de gauche à droite, pause au survol,
 * au toucher ou au focus, flèches pour naviguer. Désactivé si l'utilisateur réduit les animations.
 */
export function ProvidersSlider({
  children,
  label,
  prevLabel,
  nextLabel,
}: {
  children: ReactNode[];
  label: string;
  prevLabel: string;
  nextLabel: string;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const step = () => {
      const max = track.scrollWidth - track.clientWidth;
      if (max <= 0) return;
      // De gauche à droite : on part de la fin et on remonte vers le début, puis on reboucle.
      track.scrollLeft = track.scrollLeft <= 0 ? max : track.scrollLeft - PIXELS_PER_FRAME;
      frame = window.requestAnimationFrame(step);
    };
    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [paused]);

  function go(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: "smooth" });
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
        className="flex gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children.map((child, i) => (
          <li key={i} className="w-[80%] flex-none sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.7rem)]">
            {child}
          </li>
        ))}
      </ul>
      <div className="mt-6 flex items-center justify-center gap-3">
        <button type="button" onClick={() => go(-1)} aria-label={prevLabel} className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] hover:border-[var(--foreground)]">←</button>
        <button type="button" onClick={() => go(1)} aria-label={nextLabel} className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] hover:border-[var(--foreground)]">→</button>
      </div>
    </div>
  );
}
