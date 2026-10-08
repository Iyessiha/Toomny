import Link from "next/link";
import type { LegalPage } from "@/content/legal";

/** Mise en page commune des pages légales. */
export function LegalPageView({ page, homeLabel }: { page: LegalPage; homeLabel: string }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-2xl font-bold">{page.title}</h1>
      <p className="mt-2 text-xs text-[var(--subtle)]">{page.updated}</p>
      <p className="mt-6 text-sm leading-relaxed">{page.intro}</p>

      <div className="mt-8 flex flex-col gap-8">
        {page.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="font-display text-base font-bold">{s.heading}</h2>
            <div className="mt-2 flex flex-col gap-2">
              {s.paragraphs.map((p) => (
                <p key={p} className="text-sm leading-relaxed text-[var(--subtle)]">{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-10 text-sm">
        <Link href="/" className="underline underline-offset-4">{homeLabel}</Link>
      </p>
    </main>
  );
}
