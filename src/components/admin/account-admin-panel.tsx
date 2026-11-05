"use client";

import { useState, useTransition } from "react";
import { changeUserEmail, sendUserPasswordReset } from "@/app/(fr)/admin/users/account-actions";

export function AccountAdminPanel({ userId, email }: { userId: string; email: string }) {
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [pending, startTransition] = useTransition();

  function reset() {
    setMessage(null);
    const fd = new FormData();
    fd.append("userId", userId);
    startTransition(async () => {
      const r = await sendUserPasswordReset(fd);
      setMessage("error" in r ? { tone: "error", text: r.error } : { tone: "ok", text: "Lien de réinitialisation envoyé à l'adresse du compte." });
    });
  }

  function changeEmail() {
    setMessage(null);
    const fd = new FormData();
    fd.append("userId", userId);
    fd.append("email", newEmail);
    startTransition(async () => {
      const r = await changeUserEmail(fd);
      if ("error" in r) setMessage({ tone: "error", text: r.error });
      else {
        setMessage({ tone: "ok", text: "Adresse modifiée. Vous pouvez maintenant envoyer le lien de réinitialisation." });
        setNewEmail("");
      }
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--subtle)]">
        Adresse actuelle : <span className="font-medium text-[var(--foreground)]">{email || "—"}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={reset} disabled={pending} className="btn-primary btn-sm">
          Envoyer le lien de réinitialisation
        </button>
      </div>
      <div className="space-y-2 border-t border-[var(--border)] pt-4">
        <label className="text-sm font-medium" htmlFor="new-email">Modifier l&apos;adresse e-mail</label>
        <div className="flex flex-wrap gap-2">
          <input
            id="new-email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="input min-w-64 flex-1"
            placeholder="adresse@exemple.com"
          />
          <button type="button" onClick={changeEmail} disabled={pending || newEmail.trim() === ""} className="btn-ghost btn-sm">
            Enregistrer la nouvelle adresse
          </button>
        </div>
      </div>
      {message && (
        <p role={message.tone === "error" ? "alert" : "status"} className={`text-sm ${message.tone === "error" ? "text-[var(--tone-danger-fg)]" : "text-[var(--subtle)]"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
