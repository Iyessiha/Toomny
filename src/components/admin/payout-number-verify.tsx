"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setProviderPayoutVerified } from "@/app/(fr)/admin/payouts/actions";
import type { Locale } from "@/i18n/dictionaries";

/** Statut et bascule de vérification du numéro de versement, vus depuis l'admin. */
export function PayoutNumberVerify({
  providerId,
  verified,
  locale = "fr",
}: {
  providerId: string;
  verified: boolean;
  locale?: Locale;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fr = locale !== "en";

  async function toggle() {
    setPending(true);
    setError(null);
    const result = await setProviderPayoutVerified(providerId, !verified);
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-1 flex flex-col items-start gap-1">
      <span className="text-[11px] text-[var(--subtle)]">
        {verified ? (fr ? "Numéro vérifié" : "Number verified") : (fr ? "Numéro non vérifié" : "Number not verified")}
      </span>
      <button type="button" disabled={pending} onClick={toggle} className="btn-ghost btn-sm disabled:opacity-60">
        {verified ? (fr ? "Retirer la vérification" : "Unverify") : (fr ? "Marquer vérifié" : "Mark verified")}
      </button>
      {error && <span role="alert" className="text-[11px] text-[var(--tone-danger-fg)]">{error}</span>}
    </div>
  );
}
