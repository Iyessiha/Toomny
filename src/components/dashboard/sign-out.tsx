"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ label = "Se déconnecter" }: { label?: string }) {
  const [pending, setPending] = useState(false);

  return (
    <button
      onClick={async () => {
        setPending(true);
        await createClient().auth.signOut();
        // Rechargement complet : vide la session côté serveur immédiatement.
        window.location.href = "/";
      }}
      disabled={pending}
      className="text-sm text-[var(--subtle)] transition-colors hover:text-[var(--foreground)] disabled:opacity-60"
    >
      {pending ? "…" : label}
    </button>
  );
}
