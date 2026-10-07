"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ label = "Se déconnecter" }: { label?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      onClick={async () => {
        setPending(true);
        await createClient().auth.signOut();
        router.push("/");
        router.refresh();
      }}
      disabled={pending}
      className="text-sm text-[var(--subtle)] transition-colors hover:text-[var(--foreground)] disabled:opacity-60"
    >
      {pending ? "…" : label}
    </button>
  );
}
