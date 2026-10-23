"use client";

type Props = { label: string };

export function PrintButton({ label }: Props) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full border border-[var(--color-brand-500)] px-5 py-2.5 text-center text-sm font-semibold text-[var(--color-brand-600)] hover:bg-white"
    >
      {label}
    </button>
  );
}
