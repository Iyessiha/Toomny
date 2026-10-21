"use client";

import { useState, type FormEvent } from "react";
import { savePixelSettings } from "@/app/(fr)/admin/pixels/actions";
import { getAdminTexts } from "@/i18n/admin";
import { PIXEL_FIELDS, PIXEL_KEYS, type PixelSettings } from "@/lib/pixels";
import type { Locale } from "@/i18n/dictionaries";

export function PixelSettingsForm({ settings, locale }: { settings: PixelSettings; locale: Locale }) {
  const t = getAdminTexts(locale).pixelsPage;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    const result = await savePixelSettings(new FormData(e.currentTarget));
    setBusy(false);
    if (result.error === "invalid_field") {
      setError(t.errorField.replace("{field}", result.field ?? ""));
      return;
    }
    if (result.error) {
      // Le détail technique aide à trouver la cause (table absente, clé de service, etc.).
      setError(`${t.errorSave} (${result.error})`);
      return;
    }
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <p className="text-sm text-[var(--subtle)]">{t.help}</p>

      {error && <p role="alert" className="notice notice-danger">{error}</p>}
      {saved && <p role="status" className="notice notice-success">{t.saved}</p>}

      <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--background)] p-5">
        {PIXEL_KEYS.map((key) => (
          <div key={key} className="flex flex-col gap-1">
            <label htmlFor={key} className="text-sm font-medium">{PIXEL_FIELDS[key].label}</label>
            {key === "custom_code" ? (
              <textarea
                id={key}
                name={key}
                rows={8}
                defaultValue={settings[key] ?? ""}
                placeholder={t.placeholderEmpty}
                className="input font-mono text-xs"
                spellCheck={false}
              />
            ) : (
              <input
                id={key}
                name={key}
                defaultValue={settings[key] ?? ""}
                placeholder={t.placeholderEmpty}
                className="input font-mono"
                autoComplete="off"
                spellCheck={false}
              />
            )}
            <span className="text-xs text-[var(--subtle)]">{PIXEL_FIELDS[key].hint}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={busy} className="btn-primary btn-sm disabled:opacity-60">
          {busy ? t.saving : t.save}
        </button>
      </div>
    </form>
  );
}
