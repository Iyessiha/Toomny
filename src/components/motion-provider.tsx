"use client";

import { useEffect } from "react";

/**
 * Révélations au défilement + défilement fluide.
 *
 * Les révélations reposent sur IntersectionObserver et une transition CSS,
 * pas sur une librairie d'animation : l'affichage du contenu ne doit jamais
 * dépendre du bon chargement de 60 Ko de JavaScript sur une 3G. Lenis n'est
 * qu'un confort, chargé après coup, et son absence ne casse rien.
 *
 * Tout est neutralisé si l'utilisateur a demandé moins d'animations.
 */
export function MotionProvider() {
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

    // Filet de sécurité : au-delà de 3 s, on réaffiche tout quoi qu'il arrive.
    // Un contenu invisible est bien pire qu'un contenu sans animation.
    const safety = window.setTimeout(() => targets.forEach(reveal), 3000);

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

    return () => {
      window.clearTimeout(safety);
      observer.disconnect();
      destroyLenis();
    };
  }, []);

  return null;
}
