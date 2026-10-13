"use client";

import { useState, useTransition } from "react";
import { resetAllOrders } from "@/app/(fr)/admin/orders/actions";

export function ResetOrdersButton() {
  const [step, setStep] = useState<"idle" | "confirm" | "done">("idle");
  const [deleted, setDeleted] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const res = await resetAllOrders();
      if (res.error) {
        setError(res.error);
        setStep("idle");
      } else {
        setDeleted(res.deleted ?? null);
        setStep("done");
      }
    });
  }

  if (step === "done") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-brand-200)] bg-[var(--color-brand-50)] px-5 py-3 text-sm">
        <svg className="h-5 w-5 shrink-0 text-[var(--color-brand-500)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
        <span>
          Base remise à zéro —{" "}
          {deleted && Object.entries(deleted)
            .filter(([, n]) => n > 0)
            .map(([k, n]) => `${n} ${k}`)
            .join(", ")} supprimé(s).
        </span>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm dark:border-red-900/40 dark:bg-red-950/20">
        <div className="flex items-start gap-3">
          <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <p className="font-semibold text-red-700 dark:text-red-400">Supprimer toutes les commandes ?</p>
            <p className="mt-0.5 text-red-600/80 dark:text-red-400/70">
              Cette action est irréversible. Toutes les commandes, le ledger, les escrows et les messages associés seront effacés.
            </p>
          </div>
        </div>
        {error && <p className="rounded-lg bg-red-100 px-3 py-2 text-xs text-red-700 dark:bg-red-900/30">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleConfirm}
            className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 active:scale-95 transition-all"
          >
            Confirmer la suppression
          </button>
          <button
            onClick={() => setStep("idle")}
            className="rounded-full border border-[var(--border)] px-5 py-2 text-sm font-medium hover:bg-[var(--surface)] transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setStep("confirm")}
      className="flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:border-red-400 transition-colors dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-950/20"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
      </svg>
      Remettre à zéro les données de test
    </button>
  );
}
