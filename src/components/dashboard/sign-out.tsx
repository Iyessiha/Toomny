"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ label, compact }: { label: string; compact?: boolean }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        setPending(true);
        await createClient().auth.signOut();
        router.push("/");
        router.refresh();
      }}
      disabled={pending}
      className={
        compact
          ? "rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--subtle)] transition-colors hover:text-[var(--foreground)] disabled:opacity-60"
          : "mt-1 w-full text-left text-sm text-[var(--subtle)] transition-colors hover:text-[var(--foreground)] disabled:opacity-60"
      }
    >
      {pending ? "…" : label}
    </button>
  );
}
