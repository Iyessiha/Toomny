"use client";

import { useEffect } from "react";

/**
 * Effets de la proposition Aurora Glass.
 *
 * Trois choses, toutes facultatives :
 *   1. l'apparition au défilement (IntersectionObserver) ;
 *   2. le reflet qui suit le curseur sur les surfaces de verre ;
 *   3. une parallaxe de quelques pixels sur les nappes d'aurore.
 *
 * Le point délicat est le point 1 : masquer un bloc avant de le révéler est ce
 * qui rend l'effet joli, mais un bloc masqué qui ne serait jamais révélé est un
 * bug. D'où le script inline ci-dessous : il pose la classe `js` avant la
 * première peinture, et programme sa propre annulation après 3 secondes. Si le
 * bundle client ne s'exécute pas (réseau bloqué, hydratation en échec), tout le
 * contenu redevient visible. Si l'observateur démarre, c'est lui qui annule le
 * minuteur et prend le relais.
 */

type RevealWindow = Window & { __toomnyGlassRevealFallback?: number };

export function GlassyEffects() {
  useEffect(() => {
    const scope = document.querySelector<HTMLElement>(".glass-scope");
    if (!scope) return;

    // L'observateur prend le relais : on désarme le filet de sécurité.
    const fallback = (window as RevealWindow).__toomnyGlassRevealFallback;
    if (fallback) window.clearTimeout(fallback);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (min-width: 1024px)").matches;

    // 1. Apparition au défilement.
    const targets = Array.from(scope.querySelectorAll<HTMLElement>("[data-g-reveal]"));
    let observer: IntersectionObserver | undefined;

    if (reduce || !("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-visible"));
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add("is-visible");
            observer?.unobserve(entry.target);
          }
        },
        { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
      );
      targets.forEach((el) => observer!.observe(el));
    }

    if (!fine) return () => observer?.disconnect();

    // 2. Reflet spéculaire.
    const onMove = (event: PointerEvent) => {
      const card = (event.target as HTMLElement | null)?.closest<HTMLElement>(".glass-specular");
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--gx", `${(((event.clientX - rect.left) / rect.width) * 100).toFixed(1)}%`);
      card.style.setProperty("--gy", `${(((event.clientY - rect.top) / rect.height) * 100).toFixed(1)}%`);
    };
    scope.addEventListener("pointermove", onMove, { passive: true });

    // 3. Parallaxe des nappes : quelques pixels, jamais plus.
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        scope.querySelectorAll<HTMLElement>(".aurora-orb").forEach((orb, i) => {
          orb.style.translate = `0 ${(y * (0.04 + i * 0.02)).toFixed(1)}px`;
        });
      });
    };
    if (!reduce) window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer?.disconnect();
      scope.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Posé avant le premier rendu du contenu : les blocs à révéler sont masqués
  // dès la première peinture, donc aucun flash. Le minuteur est le filet de
  // sécurité décrit plus haut.
  return (
    <script
      dangerouslySetInnerHTML={{
        __html:
          "try{if(matchMedia('(prefers-reduced-motion: no-preference)').matches){" +
          "var s=document.currentScript.parentElement;" +
          "s.classList.add('js');" +
          "window.__toomnyGlassRevealFallback=setTimeout(function(){s.classList.remove('js')},3000);" +
          "}}catch(e){}",
      }}
    />
  );
}
