"use client";

import { useState } from "react";

export function ResendConfirmationButton() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  async function resend() {
    setPending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/resend-confirmation", { method: "POST" });
      if (res.ok) setMessage({ tone: "success", text: "Un nouveau lien vient de vous être envoyé. Pensez à vérifier vos spams." });
      else if (res.status === 429) setMessage({ tone: "danger", text: "Trop de demandes. Réessayez dans une heure." });
      else setMessage({ tone: "danger", text: "L'envoi a échoué. Réessayez dans quelques instants." });
    } catch {
      setMessage({ tone: "danger", text: "Connexion impossible. Vérifiez votre réseau et réessayez." });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <button type="button" onClick={resend} disabled={pending} className="btn-primary w-full disabled:opacity-50">
        {pending ? "Envoi en cours…" : "Renvoyer le lien de confirmation"}
      </button>
      {message && (
        <p role={message.tone === "danger" ? "alert" : "status"} className={`notice notice-${message.tone}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
