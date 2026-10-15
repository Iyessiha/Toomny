"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { HeroVisual } from "./hero-visual";
import { getLanding } from "@/content/landing";
import type { Locale } from "@/i18n/dictionaries";

type Key = "client" | "provider";

const PAYMENT_METHODS = [
  { name: "Wave", src: "/payment/wave.svg" },
  { name: "Orange Money", src: "/payment/orange_money.svg" },
  { name: "MTN MoMo", src: "/payment/mtn.svg" },
  { name: "Moov Money", src: "/payment/moov.svg" },
  { name: "Carte bancaire", src: "/payment/card.svg" },
];

export function Hero({ locale = "fr" }: { locale?: Locale }) {
  const t = getLanding(locale).hero;
  const [key, setKey] = useState<Key>("client");
  const a = t.audiences[key];
  const sceneRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // 3D tilt sur la carte hero — desktop seulement, réduit si prefers-reduced-motion.
  useEffect(() => {
    const scene = sceneRef.current;
    const card = cardRef.current;
    if (!scene || !card) return;
    if (!matchMedia("(min-width: 1024px) and (prefers-reduced-motion: no-preference)").matches) return;

    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const b = scene.getBoundingClientRect();
        const rx = ((e.clientY - b.top - b.height / 2) / b.height) * -12;
        const ry = ((e.clientX - b.left - b.width / 2) / b.width) * 12;
        card.style.transform = `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.02,1.02,1.02)`;
      });
    };
    const onLeave = () => {
      card.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
    };

    scene.addEventListener("mousemove", onMove);
    scene.addEventListener("mouseleave", onLeave);
    return () => {
      scene.removeEventListener("mousemove", onMove);
      scene.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="hero-video relative overflow-hidden">
      {/* Vidéo de fond — muette, en boucle, sans audio */}
      <video
        autoPlay
        muted
        loop
        playsInline
        poster="/video/hero-poster.jpg"
        className="absolute inset-0 h-full w-full object-cover"
        aria-hidden
      >
        <source src="/video/hero.mp4" type="video/mp4" />
      </video>

      {/* Overlay couleur marque — rend le texte lisible */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: "linear-gradient(160deg, rgba(8,67,35,0.78) 0%, rgba(6,15,11,0.85) 100%)",
        }}
      />
      {/* Dot grid décoratif */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(34,197,94,0.12) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
          maskImage: "radial-gradient(ellipse 55% 65% at 75% 40%, black, transparent)",
        }}
      />

      <div className="relative mx-auto grid max-w-6xl gap-16 px-4 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12">
        {/* Contenu toujours sur fond sombre (vidéo + overlay) → text-white */}
        <div className="text-white">
          {/* Sélecteur d'audience — glassmorphisme */}
          <div
            data-reveal
            className="glass-panel inline-flex rounded-full p-1 text-sm"
            role="tablist"
          >
            {(["client", "provider"] as Key[]).map((k) => (
              <button
                key={k}
                role="tab"
                aria-selected={key === k}
                onClick={() => setKey(k)}
                className={`rounded-full px-4 py-2 font-semibold transition-all duration-200 ${
                  key === k
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {t.audiences[k].label}
              </button>
            ))}
          </div>

          <h1
            data-reveal
            style={{ transitionDelay: "50ms" }}
            className="mt-6 text-[1.9rem] font-extrabold leading-[1.1] text-balance sm:mt-8 sm:text-[2.8rem] lg:text-[3.25rem] xl:text-[3.6rem]"
          >
            {a.title[0]}{" "}
            <em className="not-italic gradient-text">{a.title[1]}</em>
          </h1>

          <p data-reveal style={{ transitionDelay: "100ms" }} className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">
            {a.lead}
          </p>

          {a.points && a.points.length > 0 && (
            <ul
              data-reveal
              style={{ transitionDelay: "125ms" }}
              className="mt-4 flex flex-wrap gap-x-5 gap-y-2"
            >
              {a.points.map((pt) => (
                <li key={pt} className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-brand-300)]">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
                    <path d="M11.854 3.646a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L5.5 9.293l5.646-5.647a.5.5 0 0 1 .708 0Z"/>
                  </svg>
                  {pt}
                </li>
              ))}
            </ul>
          )}

          <div data-reveal style={{ transitionDelay: "150ms" }} className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={a.href}
              className="btn-landing-primary"
            >
              {a.cta}
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <a
              href="#fonctionnement"
              className="rounded-full border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20 sm:px-7 sm:py-3.5"
            >
              {t.secondaryCta}
            </a>
          </div>

          {/* Barre de recherche — glassmorphisme */}
          <form
            data-reveal
            style={{ transitionDelay: "175ms" }}
            method="GET"
            action="/services"
            className="glass-panel mt-8 flex w-full max-w-lg overflow-hidden rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.30)] focus-within:border-[rgba(34,197,94,0.5)]"
          >
            <input
              type="search"
              name="q"
              placeholder={locale === "fr" ? "Que recherchez-vous ?" : "What are you looking for?"}
              className="flex-1 bg-transparent px-5 py-3 text-sm text-white outline-none placeholder:text-white/50"
            />
            <button
              type="submit"
              className="m-1.5 flex shrink-0 items-center gap-2 rounded-full bg-[var(--color-brand-500)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-600)]"
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
              </svg>
              {locale === "fr" ? "Rechercher" : "Search"}
            </button>
          </form>

          <div data-reveal style={{ transitionDelay: "200ms" }} className="mt-6 flex flex-wrap items-center gap-3">
            <span className="mr-1 text-xs font-semibold uppercase tracking-[0.12em] text-white/55">
              {t.railsLabel}
            </span>
            {PAYMENT_METHODS.map((m) => (
              // eslint-disable-next-line @next/next/no-img-element -- SVG locaux 36px : next/image ne les optimise pas, <img> suffit.
              <img
                key={m.name}
                src={m.src}
                alt={m.name}
                title={m.name}
                width={36}
                height={36}
                className="rounded-full shadow-sm ring-1 ring-black/10 transition-transform duration-200 hover:scale-110"
              />
            ))}
          </div>
        </div>

        {/* Colonne droite : visuel 3D */}
        <div
          ref={sceneRef}
          className="hidden lg:flex lg:items-start lg:justify-center"
          data-reveal
          style={{ transitionDelay: "120ms" }}
        >
          <div
            ref={cardRef}
            style={{ transition: "transform 0.08s linear", willChange: "transform" }}
          >
            <HeroVisual locale={locale} mode={key} />
          </div>
        </div>
      </div>
    </section>
  );
}
