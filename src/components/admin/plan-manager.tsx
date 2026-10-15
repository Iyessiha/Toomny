"use client";

import { useState } from "react";
import { setProviderPlan } from "@/app/(fr)/admin/plans/actions";
import { PLAN_TIERS, type PlanTier } from "@/lib/plans";
import type { Locale } from "@/i18n/dictionaries";
import { getAdminTexts } from "@/i18n/admin";

type Provider = {
  id: string;
  display_name: string | null;
  email: string | null;
  plan: string | null;
  plan_expires_at: string | null;
};

function PlanBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    debutant: "bg-[var(--surface)] text-[var(--subtle)] border border-[var(--border)]",
    essentiel: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    pro: "bg-[var(--tone-warning-bg)] text-[var(--tone-warning-fg)]",
    expert: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${colors[tier] ?? colors.debutant}`}>
      {tier}
    </span>
  );
}

function PlanRow({ provider, t }: { provider: Provider; t: ReturnType<typeof getAdminTexts>["plansPage"] }) {
  const [open, setOpen] = useState(false);
  const [tier, setTier] = useState<PlanTier>((provider.plan as PlanTier) ?? "debutant");
  const [days, setDays] = useState<string>("30");
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const isExpired =
    provider.plan_expires_at &&
    new Date(provider.plan_expires_at).getTime() < Date.now();

  async function onSave() {
    setPending(true);
    setMsg(null);
    const durationDays = days.trim() === "" ? null : parseInt(days, 10);
    const result = await setProviderPlan(provider.id, tier, durationDays);
    setPending(false);
    if (result.ok) {
      setMsg({ ok: true, text: t.saved });
      setOpen(false);
    } else {
      setMsg({ ok: false, text: result.error });
    }
  }

  const displayName = provider.display_name ?? provider.email ?? "—";

  return (
    <tr>
      <td className="whitespace-normal!">
        <span className="font-semibold">{displayName}</span>
        {provider.email && provider.display_name && (
          <span className="block text-xs text-[var(--subtle)]">{provider.email}</span>
        )}
      </td>
      <td>
        <PlanBadge tier={provider.plan ?? "debutant"} />
      </td>
      <td className="text-sm text-[var(--subtle)]">
        {provider.plan_expires_at ? (
          <span className={isExpired ? "text-red-500 font-semibold" : ""}>
            {isExpired ? `⚠ ${t.expired} · ` : ""}
            {new Date(provider.plan_expires_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}
          </span>
        ) : (
          t.neverExpires
        )}
      </td>
      <td>
        {!open ? (
          <button
            onClick={() => { setOpen(true); setMsg(null); setTier((provider.plan as PlanTier) ?? "debutant"); }}
            className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-medium transition-colors hover:border-[var(--color-gold-400)] hover:text-[var(--foreground)]"
          >
            {t.changePlan}
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as PlanTier)}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-xs outline-none focus:border-[var(--color-brand-500)]"
            >
              {PLAN_TIERS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            {tier !== "debutant" && (
              <input
                type="number"
                min="1"
                max="3650"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                placeholder={t.durationLabel}
                className="w-20 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-xs outline-none focus:border-[var(--color-brand-500)]"
              />
            )}
            <button
              onClick={onSave}
              disabled={pending}
              className="rounded-full bg-[var(--color-brand-500)] px-3 py-1 text-xs font-semibold text-white transition-opacity disabled:opacity-60"
            >
              {pending ? t.saving : t.save}
            </button>
            <button
              onClick={() => { setOpen(false); setMsg(null); }}
              className="rounded-full px-2 py-1 text-xs text-[var(--subtle)] hover:text-[var(--foreground)]"
            >
              ✕
            </button>
          </div>
        )}
        {msg && (
          <p className={`mt-1 text-xs ${msg.ok ? "text-emerald-600" : "text-red-500"}`}>
            {msg.text}
          </p>
        )}
      </td>
    </tr>
  );
}

type FilterKey = "all" | "free" | "paid" | "expired";

export function PlanManager({
  providers,
  locale,
}: {
  providers: Provider[];
  locale: Locale;
}) {
  const t = getAdminTexts(locale).plansPage;
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const now = Date.now();

  const filtered = providers.filter((p) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "free") return !p.plan || p.plan === "debutant";
    if (activeFilter === "paid") return !!p.plan && p.plan !== "debutant";
    if (activeFilter === "expired")
      return !!p.plan_expires_at && new Date(p.plan_expires_at).getTime() < now;
    return true;
  });

  const filterItems: { key: FilterKey; label: string }[] = [
    { key: "all", label: t.filterAll },
    { key: "free", label: t.filterFree },
    { key: "paid", label: t.filterPaid },
    { key: "expired", label: t.filterExpired },
  ];

  if (providers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] p-12 text-center">
        <p className="font-semibold">{t.emptyTitle}</p>
        <p className="mt-1 text-sm text-[var(--subtle)]">{t.emptyBody}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <nav className="mb-5 flex flex-wrap gap-2">
        {filterItems.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={activeFilter === f.key ? "chip chip-active" : "chip"}
          >
            {f.label}
          </button>
        ))}
      </nav>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-12 text-center">
          <p className="font-semibold">{t.emptyTitle}</p>
          <p className="mt-1 text-sm text-[var(--subtle)]">{t.emptyBody}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--subtle)]">{t.colProvider}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--subtle)]">{t.colPlan}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--subtle)]">{t.colExpiry}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--subtle)]">{t.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map((p) => (
                <PlanRow key={p.id} provider={p} t={t} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
