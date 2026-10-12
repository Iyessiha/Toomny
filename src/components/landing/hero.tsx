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
    <section className="relative overflow-hidden">
      {/* Halo de marque */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 h-[520px] opacity-[0.55]"
        style={{
          background:
            "radial-gradient(60% 55% at 55% 40%, var(--color-brand-200) 0%, transparent 70%)",
        }}
      />
      {/* Dot grid décoratif côté visuel */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage: "radial-gradient(circle, var(--border) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage: "radial-gradient(ellipse 55% 65% at 75% 40%, black, transparent)",
        }}
      />

      <div className="relative mx-auto grid max-w-6xl gap-16 px-4 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12">
        <div>
          {/* Sélecteur d'audience */}
          <div
            data-reveal
            className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface)] p-1 text-sm shadow-sm"
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
                    ? "bg-[var(--background)] text-[var(--color-brand-700)] shadow-sm"
                    : "text-[var(--subtle)] hover:text-[var(--foreground)]"
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

          <p data-reveal style={{ transitionDelay: "100ms" }} className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--subtle)]">
            {a.lead}
          </p>

          <div data-reveal style={{ transitionDelay: "150ms" }} className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={a.href}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand-500)] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[var(--color-brand-500)]/20 transition-all duration-200 hover:-translate-y-px hover:bg-[var(--color-brand-600)] active:scale-95 sm:px-7 sm:py-3.5"
            >
              {a.cta}
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <a
              href="#fonctionnement"
              className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold transition-colors hover:border-[var(--color-brand-300)] hover:bg-[var(--surface)] sm:px-7 sm:py-3.5"
            >
              {t.secondaryCta}
            </a>
          </div>

          {/* Rail pills — preuve sociale immédiate, sans logos flottants. */}
          {/* Barre de recherche */}
          <form
            data-reveal
            style={{ transitionDelay: "175ms" }}
            method="GET"
            action="/services"
            className="mt-8 flex w-full max-w-lg overflow-hidden rounded-full border border-[var(--border)] bg-[var(--background)] shadow-lg shadow-black/[0.06] focus-within:border-[var(--color-brand-400)] focus-within:ring-2 focus-within:ring-[var(--color-brand-400)]/20"
          >
            <input
              type="search"
              name="q"
              placeholder={locale === "fr" ? "Que recherchez-vous ?" : "What are you looking for?"}
              className="flex-1 bg-transparent px-5 py-3 text-sm outline-none"
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
            <span className="mr-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--subtle)]">
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
            <HeroVisual locale={locale} />
          </div>
        </div>
      </div>
    </section>
  );
}
