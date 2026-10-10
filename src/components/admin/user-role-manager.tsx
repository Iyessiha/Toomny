"use client";

import { useState } from "react";
import { changeUserRole } from "@/app/(fr)/admin/users/actions";
import { getAdminTexts } from "@/i18n/admin";
import type { Locale } from "@/i18n/dictionaries";

const ROLES = ["client", "provider", "admin"] as const;

export function UserRoleManager({
  userId,
  currentRole,
  locale,
}: {
  userId: string;
  currentRole: string;
  locale: Locale;
}) {
  const t = getAdminTexts(locale);
  const [role, setRole] = useState(currentRole);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleChange(newRole: string) {
    if (newRole === role) return;
    setBusy(true);
    setMsg(null);
    const result = await changeUserRole(userId, newRole as "client" | "provider" | "admin");
    if (result.error) {
      setMsg({ ok: false, text: t.usersPage.roleError });
    } else {
      setRole(newRole);
      setMsg({ ok: true, text: t.usersPage.roleSaved });
      setTimeout(() => setMsg(null), 2000);
    }
    setBusy(false);
  }

  return (
    <div className="flex items-center gap-2 justify-end">
      {msg && (
        <span className={`text-xs ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>{msg.text}</span>
      )}
      <select
        value={role}
        disabled={busy}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs outline-none focus:border-[var(--color-brand-500)] disabled:opacity-50"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>{t.roles[r] ?? r}</option>
        ))}
      </select>
    </div>
  );
}
