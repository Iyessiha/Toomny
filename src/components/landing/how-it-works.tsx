"use client";

import { useState } from "react";
import { getLanding } from "@/content/landing";
import type { Locale } from "@/i18n/dictionaries";

type Key = "client" | "provider";

export function HowItWorks({ locale = "fr" }: { locale?: Locale }) {
  const t = getLanding(locale).how;
  const [key, setKey] = useState<Key>("client");
  const steps = t[key];

  return (
    <section id="fonctionnement" className="border-t border-[var(--border)]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div data-reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-600)]">
              {t.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">{t.title}</h2>
          </div>

          <div className="inline-flex shrink-0 rounded-full border border-[var(--border)] bg-[var(--background)] p-1 text-sm">
            {(["client", "provider"] as Key[]).map((k) => (
              <button
                key={k}
                onClick={() => setKey(k)}
                aria-pressed={key === k}
                className={`rounded-full px-5 py-2 font-medium transition-colors duration-200 ${
                  key === k ? "bg-[var(--color-brand-500)] text-white" : "text-[var(--subtle)] hover:text-[var(--foreground)]"
                }`}
              >
                {t.tabs[k]}
              </button>
            ))}
          </div>
        </div>

        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <li
              key={s.title}
              data-reveal
              style={{ transitionDelay: `${i * 80}ms` }}
              className="group relative rounded-2xl border border-[var(--border)] bg-[var(--background)] p-7 transition-colors duration-300 hover:border-[var(--color-brand-300)]"
            >
              <span className="font-display text-5xl font-extrabold text-[var(--color-brand-100)] transition-colors duration-300 group-hover:text-[var(--color-brand-200)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-[var(--subtle)]">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
