import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminNavGroups } from "@/lib/admin-nav";
import { Section, Pill } from "@/components/dashboard/pro";
import type { Locale } from "@/i18n/dictionaries";

export const metadata: Metadata = { title: "Recherche · Administration Toomny", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Retire les caractères qui ont un sens dans les filtres PostgREST, pour une recherche sûre. */
function cleanQuery(raw: string): string {
  return raw.replace(/[^\p{L}\p{N}\s@._-]/gu, "").trim().slice(0, 80);
}

export default async function AdminSearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireAdmin();
  const locale: Locale = user.preferredLocale;
  const { q: rawQ = "" } = await searchParams;
  const q = cleanQuery(rawQ);
  const db = createAdminClient();

  const like = `%${q}%`;
  const [users, orders, services] = q
    ? await Promise.all([
        db
          .from("profiles")
          .select("id, display_name, first_name, last_name, role, verification_status")
          .or(`display_name.ilike.${like},first_name.ilike.${like},last_name.ilike.${like}`)
          .limit(15),
        db.from("orders").select("id, reference, status, created_at").ilike("reference", like).limit(15),
        db.from("services").select("id, title, status, created_at").ilike("title", like).limit(15),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const total = (users.data?.length ?? 0) + (orders.data?.length ?? 0) + (services.data?.length ?? 0);

  return (
    <AdminShell
      user={user}
      locale={locale}
      kicker="Administration"
      title="Recherche"
      subtitle="Un compte, une commande ou une prestation : tapez un nom, une référence ou un titre."
      nav={getAdminNavGroups(locale, "/admin")}
    >
      <form action="/admin/recherche" method="get" className="mb-8 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          autoFocus
          placeholder="Nom, référence (TMY-…), titre de prestation"
          className="input flex-1"
          aria-label="Rechercher"
        />
        <button type="submit" className="btn-primary">Rechercher</button>
      </form>

      {!q && <p className="text-sm text-[var(--subtle)]">Saisissez au moins un caractère pour lancer la recherche.</p>}
      {q && total === 0 && <p className="text-sm text-[var(--subtle)]">Aucun résultat pour « {q} ».</p>}

      {(users.data?.length ?? 0) > 0 && (
        <Section title="Comptes">
          <ul className="divide-y divide-[var(--border)]">
            {users.data!.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{u.display_name ?? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() ?? "—"}</p>
                  <p className="text-xs text-[var(--subtle)]">{u.role} · {u.verification_status}</p>
                </div>
                <Link href={`/admin/users/${u.id}`} className="btn-ghost btn-sm">Ouvrir</Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {(orders.data?.length ?? 0) > 0 && (
        <Section title="Commandes">
          <ul className="divide-y divide-[var(--border)]">
            {orders.data!.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <p className="font-mono text-sm font-semibold">{o.reference}</p>
                  <Pill tone="neutral">{o.status}</Pill>
                </div>
                <Link href={`/admin/orders/${o.id}`} className="btn-ghost btn-sm">Ouvrir</Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {(services.data?.length ?? 0) > 0 && (
        <Section title="Prestations">
          <ul className="divide-y divide-[var(--border)]">
            {services.data!.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <p className="truncate font-semibold">{s.title}</p>
                  <Pill tone="neutral">{s.status}</Pill>
                </div>
                <Link href={`/admin/services/${s.id}`} className="btn-ghost btn-sm">Ouvrir</Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </AdminShell>
  );
}
