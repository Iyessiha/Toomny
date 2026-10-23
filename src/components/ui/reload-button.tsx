"use client";

/** Bouton qui recharge la page. Isolé en composant client : une page serveur ne peut pas passer de gestionnaire d'événement. */
export function ReloadButton({ label, className }: { label: string; className?: string }) {
  return (
    <button type="button" onClick={() => window.location.reload()} className={className}>
      {label}
    </button>
  );
}
