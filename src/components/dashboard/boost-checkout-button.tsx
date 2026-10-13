"use client";

import { useState } from "react";
import type { BoostTier } from "@/lib/boost";

type Props = {
  tier: BoostTier;
  highlight?: boolean;
  label: string;
  redirectingLabel: string;
  errorLabel: string;
  disabled?: boolean;
};

export function BoostCheckoutButton({
  tier,
  highlight,
  label,
  redirectingLabel,
  errorLabel,
  disabled,
}: Props) {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  async function handleClick() {
    setState("loading");
    try {
      const res = await fetch("/api/boost/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const json = (await res.json()) as { checkoutUrl?: string; error?: string };
      if (!res.ok || !json.checkoutUrl) throw new Error(json.error ?? "Erreur");
      window.location.href = json.checkoutUrl;
    } catch {
      setState("error");
    }
  }

  const base =
    "mt-6 w-full rounded-xl py-3 text-sm font-semibold transition-opacity disabled:opacity-50";
  const style = highlight
    ? `${base} bg-white text-[var(--color-brand-600)]`
    : `${base} bg-[var(--color-brand-500)] text-white`;

  return (
    <div>
      <button
        className={style}
        onClick={handleClick}
        disabled={disabled || state === "loading"}
      >
        {state === "loading" ? redirectingLabel : label}
      </button>
      {state === "error" && (
        <p className="mt-2 text-center text-xs text-[var(--tone-danger-fg)]">{errorLabel}</p>
      )}
    </div>
  );
}
