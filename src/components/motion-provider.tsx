"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Révélations au défilement + défilement fluide.
 *
 * On re-scanne les [data-reveal] à chaque changement de route : en App Router,
 * les composants sont remontés lors des navigations côté client, donc les
 * éléments perdent leur classe `is-revealed`. Sans rescan, ils restent
 * opacity:0 jusqu'au safety timeout de 3 s.
 *
 * Tout est neutralisé si l'utilisateur a demandé moins d'animations.
 */
export function MotionProvider() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const reveal = (el: Element) => el.classList.add("is-revealed");

    if (!root.classList.contains("js") || typeof IntersectionObserver === "undefined") {
      document.querySelectorAll("[data-reveal]").forEach(reveal);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          reveal(entry.target);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.01 },
    );

    const targets = document.querySelectorAll("[data-reveal]");
    targets.forEach((el) => observer.observe(el));

    // Filet de sécurité : au-delà de 1,5 s, on réaffiche tout.
    // Réduit de 3 s à 1,5 s pour limiter l'écran blanc sur connexion lente.
    const safety = window.setTimeout(() => targets.forEach(reveal), 1500);

    return () => {
      window.clearTimeout(safety);
      observer.disconnect();
    };
  }, [pathname]);

  // Lenis : chargé une seule fois, indépendamment des navigations.
  useEffect(() => {
    let destroyLenis = () => {};

    import("lenis")
      .then(({ default: Lenis }) => {
        const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
        let frame = 0;
        const raf = (time: number) => {
          lenis.raf(time);
          frame = requestAnimationFrame(raf);
        };
        frame = requestAnimationFrame(raf);
        destroyLenis = () => {
          cancelAnimationFrame(frame);
          lenis.destroy();
        };
      })
      .catch(() => {
        // Sans Lenis, le défilement natif prend le relais. Rien à faire.
      });

    return () => destroyLenis();
  }, []);

  return null;
}
