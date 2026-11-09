import Image from "next/image";
import Link from "next/link";
import {
  Bell, ChevronRight, Clock, Download, Heart, LayoutDashboard, LifeBuoy,
  MessageSquare, Package, Plus, Search, Settings, ShieldCheck, Sparkles,
  Star, TrendingUp, Users, Wallet,
} from "lucide-react";
import { DEMO_PROVIDERS, DEMO_SERVICES } from "./glassy-demo";

/* ────────────────────────────────────────────────────────────────────────────
   Maquettes des tableaux de bord « Aurora Glass ».

   Trois rôles, une seule coquille : barre latérale de verre, barre supérieure,
   puis le contenu propre au rôle. Les chiffres sont fictifs et cohérents avec
   le modèle économique du site (0 % côté client, 3 à 10 % côté prestataire).

   Tout est rendu côté serveur : les onglets de rôle sont de simples liens
   (?role=client|prestataire|admin), donc aucun état client à synchroniser.
   ──────────────────────────────────────────────────────────────────────────── */

export type DashRole = "client" | "prestataire" | "admin";

const ROLES: { key: DashRole; label: string; hint: string }[] = [
  { key: "client", label: "Client", hint: "Suivre ses commandes et valider" },
  { key: "prestataire", label: "Prestataire", hint: "Vendre et encaisser" },
  { key: "admin", label: "Administration", hint: "Piloter la place de marché" },
];

const NAV: Record<DashRole, { group: string; items: { label: string; icon: typeof Wallet; badge?: string }[] }[]> = {
  client: [
    {
      group: "Activité",
      items: [
        { label: "Vue d'ensemble", icon: LayoutDashboard },
        { label: "Mes commandes", icon: Package, badge: "2" },
        { label: "Messages", icon: MessageSquare, badge: "3" },
        { label: "Favoris", icon: Heart },
      ],
    },
    {
      group: "Compte",
      items: [
        { label: "Profil", icon: Users },
        { label: "Support", icon: LifeBuoy },
        { label: "Paramètres", icon: Settings },
      ],
    },
  ],
  prestataire: [
    {
      group: "Activité",
      items: [
        { label: "Vue d'ensemble", icon: LayoutDashboard },
        { label: "Commandes", icon: Package, badge: "1" },
        { label: "Demandes", icon: MessageSquare, badge: "4" },
        { label: "Notifications", icon: Bell },
      ],
    },
    {
      group: "Business",
      items: [
        { label: "Mes prestations", icon: Sparkles },
        { label: "Versements", icon: Wallet },
        { label: "Ma vitrine", icon: Star },
        { label: "Plan & boost", icon: TrendingUp },
      ],
    },
    {
      group: "Compte",
      items: [
        { label: "Profil", icon: Users },
        { label: "Vérification", icon: ShieldCheck },
        { label: "Support", icon: LifeBuoy },
      ],
    },
  ],
  admin: [
    {
      group: "Finance",
      items: [
        { label: "Vue d'ensemble", icon: LayoutDashboard },
        { label: "Commandes", icon: Package, badge: "5" },
        { label: "Versements", icon: Wallet },
        { label: "Plans", icon: TrendingUp },
      ],
    },
    {
      group: "Utilisateurs",
      items: [
        { label: "Comptes", icon: Users },
        { label: "Vérifications", icon: ShieldCheck, badge: "7" },
      ],
    },
    {
      group: "Opérations",
      items: [
        { label: "Litiges", icon: LifeBuoy, badge: "2" },
        { label: "Support", icon: MessageSquare },
        { label: "Prestations", icon: Sparkles },
      ],
    },
  ],
};

/* ── Petits blocs réutilisables ───────────────────────────────────────────── */

function Stat({
  label,
  value,
  hint,
  trend,
  accent,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: string;
  accent?: boolean;
  icon: typeof Wallet;
}) {
  return (
    <div className={`glass glass-edge glass-specular g-round-md p-4 ${accent ? "g-ring-accent" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">{label}</p>
        <Icon width={14} height={14} className={accent ? "text-[#8bf0b6]" : "text-white/35"} aria-hidden />
      </div>
      <p className={`mt-2 font-display text-xl font-extrabold sm:text-2xl ${accent ? "text-[#9ff2c2]" : "text-white"}`}>
        {value}
      </p>
      <div className="mt-1 flex items-center gap-2">
        {hint && <span className="text-[10px] text-white/55">{hint}</span>}
        {trend && (
          <span className="inline-flex items-center gap-0.5 rounded-full border border-[#8bf0b6]/30 bg-[#8bf0b6]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#9ff2c2]">
            <TrendingUp width={8} height={8} aria-hidden />
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

function Pill({ tone, children }: { tone: "funded" | "delivered" | "done" | "dispute" | "pending"; children: React.ReactNode }) {
  const tones = {
    funded: "border-[#e0b566]/40 bg-[#e0b566]/15 text-[#f4dca6]",
    delivered: "border-[#8bf0b6]/40 bg-[#8bf0b6]/12 text-[#9ff2c2]",
    done: "border-white/15 bg-white/8 text-white/70",
    dispute: "border-[#ff9db4]/40 bg-[#ff9db4]/12 text-[#ffc2d1]",
    pending: "border-white/15 bg-white/8 text-white/60",
  } as const;
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${tones[tone]}`}>
      {children}
    </span>
  );
}

/** Histogramme en CSS : aucune librairie de graphiques. */
function Bars({ data, label }: { data: { m: string; v: number }[]; label: string }) {
  const max = Math.max(...data.map((d) => d.v));
  return (
    <div className="glass glass-edge g-round-md p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-white">{label}</p>
        <span className="text-[10px] text-white/55">6 derniers mois</span>
      </div>
      <div className="mt-4 flex gap-2" role="img" aria-label={label}>
        {data.map((d) => (
          <div key={d.m} className="flex flex-1 flex-col items-center gap-1.5">
            {/* Piste de hauteur fixe : le pourcentage a un parent de référence. */}
            <div className="relative h-24 w-full">
              <div
                className="absolute bottom-0 w-full rounded-t-md"
                style={{
                  height: `${Math.max(6, (d.v / max) * 100)}%`,
                  background: "linear-gradient(180deg, rgba(139,240,182,0.95), rgba(20,160,90,0.55))",
                  boxShadow: "0 0 18px -6px rgba(51,209,122,0.8)",
                }}
                title={`${d.m} : ${d.v.toLocaleString("fr-FR")} k FCFA`}
              />
            </div>
            <span className="text-[9px] text-white/45">{d.m}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Courbe en SVG (aire dégradée), pour l'administration. */
function Trend({ points, label }: { points: number[]; label: string }) {
  const w = 320;
  const h = 90;
  const max = Math.max(...points);
  const step = w / (points.length - 1);
  const coords = points.map((p, i) => [i * step, h - (p / max) * (h - 8) - 4] as const);
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;

  return (
    <div className="glass glass-edge g-round-md p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-white">{label}</p>
        <span className="text-[10px] text-white/55">30 jours</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 h-24 w-full" role="img" aria-label={label}>
        <defs>
          <linearGradient id="g-trend" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8bf0b6" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#8bf0b6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#g-trend)" />
        <path d={line} fill="none" stroke="#8bf0b6" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function SectionTitle({ children, action }: { children: React.ReactNode; action?: string }) {
  return (
    <div className="mt-6 flex items-center justify-between gap-3">
      <h2 className="text-sm font-bold text-white">{children}</h2>
      {action && (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-[#9ff2c2]">
          {action}
          <ChevronRight width={11} height={11} aria-hidden />
        </span>
      )}
    </div>
  );
}

/* ── Coquille : barre latérale + barre supérieure ─────────────────────────── */

function Shell({
  role,
  title,
  subtitle,
  user,
  children,
}: {
  role: DashRole;
  title: string;
  subtitle: string;
  user: { name: string; avatar: string; meta: string };
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto grid max-w-7xl gap-4 px-3 pb-16 sm:px-6 lg:grid-cols-[216px_1fr]">
      {/* Barre latérale */}
      <aside className="hidden lg:block">
        <div className="glass glass-edge glass-solid g-round-md sticky top-20 p-3">
          <div className="flex items-center gap-2 rounded-xl bg-white/6 px-2.5 py-2">
            <div className="relative h-7 w-7 overflow-hidden rounded-full ring-1 ring-white/25">
              <Image src={user.avatar} alt="" fill sizes="28px" className="object-cover" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-bold text-white">{user.name}</p>
              <p className="truncate text-[9px] text-white/55">{user.meta}</p>
            </div>
          </div>

          <nav className="mt-3 space-y-3">
            {NAV[role].map((group) => (
              <div key={group.group}>
                <p className="px-2.5 text-[9px] font-bold uppercase tracking-wider text-white/35">{group.group}</p>
                <ul className="mt-1 space-y-0.5">
                  {group.items.map((item, i) => {
                    const Icon = item.icon;
                    const current = i === 0;
                    return (
                      <li key={item.label}>
                        <span
                          className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] ${
                            current ? "bg-[#8bf0b6]/12 font-semibold text-[#9ff2c2]" : "text-white/65"
                          }`}
                        >
                          <Icon width={13} height={13} aria-hidden />
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <span className="ml-auto rounded-full bg-white/12 px-1.5 text-[9px] font-bold text-white/80">
                              {item.badge}
                            </span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* Colonne principale */}
      <div className="min-w-0">
        {/* Barre supérieure */}
        <div className="glass glass-edge g-round-md mb-4 flex items-center gap-3 p-2.5">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-bold text-white">{title}</h1>
            <p className="truncate text-[10px] text-white/55">{subtitle}</p>
          </div>
          <div className="hidden items-center gap-1.5 rounded-full border border-white/12 bg-white/6 px-2.5 py-1.5 sm:flex">
            <Search width={11} height={11} className="text-white/45" aria-hidden />
            <span className="text-[10px] text-white/45">Rechercher</span>
          </div>
          <span className="relative flex h-7 w-7 items-center justify-center rounded-full border border-white/12 bg-white/6 text-white/70">
            <Bell width={12} height={12} aria-hidden />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#8bf0b6]" aria-hidden />
          </span>
          <div className="lg:hidden">
            <div className="relative h-7 w-7 overflow-hidden rounded-full ring-1 ring-white/25">
              <Image src={user.avatar} alt="" fill sizes="28px" className="object-cover" />
            </div>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}

/* ── 1. Tableau de bord CLIENT ────────────────────────────────────────────── */

function ClientDashboard() {
  return (
    <Shell
      role="client"
      title="Bonjour Awa"
      subtitle="2 commandes en cours · 1 livraison à valider"
      user={{ name: "Awa Konaté", avatar: DEMO_PROVIDERS[0].avatar, meta: "Cliente · Abidjan" }}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Dépensé" value="465 000 FCFA" hint="7 commandes" icon={Wallet} accent />
        <Stat label="En cours" value="2" hint="dont 1 livrée" icon={Clock} />
        <Stat label="Terminées" value="5" hint="depuis mars" icon={ShieldCheck} />
        <Stat label="Économisé" value="23 000 FCFA" hint="0 % de commission" icon={Sparkles} />
      </div>

      <SectionTitle action="Tout voir">Commandes en cours</SectionTitle>
      <div className="space-y-2.5">
        {[
          { s: DEMO_SERVICES[0], status: "Livrée — à valider", tone: "delivered" as const, step: "Étape 3 sur 3", amount: "150 000 FCFA" },
          { s: DEMO_SERVICES[1], status: "En cours", tone: "funded" as const, step: "Étape 2 sur 3", amount: "320 000 FCFA" },
        ].map(({ s, status, tone, step, amount }) => (
          <div key={s.id} className="glass glass-edge glass-specular g-round-md flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
              <Image src={s.cover!} alt="" fill sizes="56px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone={tone}>{status}</Pill>
                <span className="text-[10px] text-white/50">{step}</span>
              </div>
              <p className="mt-1 line-clamp-1 text-xs font-semibold text-white">{s.title}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-white/60">
                <span className="h-3.5 w-3.5 overflow-hidden rounded-full">
                  <Image src={s.provider.avatar} alt="" width={14} height={14} className="object-cover" />
                </span>
                {s.provider.name} · {s.delivery}
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-2.5 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
              <p className="font-display text-sm font-extrabold text-white">{amount}</p>
              {tone === "delivered" ? (
                <span className="g-btn g-btn-primary g-btn-xs">Valider la livraison</span>
              ) : (
                <span className="g-btn g-btn-ghost g-btn-xs">Voir le détail</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <SectionTitle action="Tout le catalogue">Reprendre une prestation</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-3">
        {DEMO_SERVICES.slice(2, 5).map((s) => (
          <div key={s.id} className="glass glass-edge g-round-md overflow-hidden">
            <div className="relative h-20">
              <Image src={s.cover!} alt="" fill sizes="240px" className="object-cover" />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#04110b] to-transparent" />
            </div>
            <div className="p-2.5">
              <p className="line-clamp-1 text-[11px] font-semibold text-white">{s.title}</p>
              <p className="mt-0.5 text-[10px] text-white/55">{s.price}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div className="glass glass-edge g-round-md p-4">
          <p className="text-xs font-bold text-white">Messages</p>
          <ul className="mt-3 space-y-2.5">
            {DEMO_PROVIDERS.slice(0, 3).map((p, i) => (
              <li key={p.id} className="flex items-center gap-2.5">
                <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full ring-1 ring-white/20">
                  <Image src={p.avatar} alt="" fill sizes="28px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-semibold text-white">{p.name}</p>
                  <p className="truncate text-[10px] text-white/55">
                    {i === 0 ? "La maquette est prête, je vous l'envoie." : "Merci, je commence demain matin."}
                  </p>
                </div>
                <span className="text-[9px] text-white/35">{i + 1} h</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass glass-edge g-round-md p-4">
          <p className="text-xs font-bold text-white">Vos garanties</p>
          <ul className="mt-3 space-y-2 text-[11px] text-white/70">
            {[
              "Le montant reste bloqué jusqu'à votre validation.",
              "Validation automatique sous 72 h si vous ne répondez pas.",
              "Litige arbitré en français, à partir des échanges conservés.",
            ].map((g) => (
              <li key={g} className="flex items-start gap-2">
                <ShieldCheck width={12} height={12} className="mt-0.5 shrink-0 text-[#8bf0b6]" aria-hidden />
                {g}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Shell>
  );
}

/* ── 2. Tableau de bord PRESTATAIRE ───────────────────────────────────────── */

function ProviderDashboard() {
  return (
    <Shell
      role="prestataire"
      title="Vue d'ensemble"
      subtitle="Plan Pro · 1 commande à démarrer · versement Wave"
      user={{ name: "Awa Konaté", avatar: DEMO_PROVIDERS[0].avatar, meta: "Prestataire · Plan Pro" }}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Encaissé" value="1 240 000 FCFA" hint="18 missions" trend="+32 %" icon={Wallet} accent />
        <Stat label="En attente" value="285 000 FCFA" hint="2 commandes" icon={Clock} />
        <Stat label="Prestations" value="12 / 20" hint="plan Pro" icon={Sparkles} />
        <Stat label="Note" value="4,9" hint="47 avis" icon={Star} />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <Bars
          label="Encaissements"
          data={[
            { m: "Juin", v: 120 },
            { m: "Juil", v: 210 },
            { m: "Août", v: 175 },
            { m: "Sept", v: 260 },
            { m: "Oct", v: 310 },
            { m: "Nov", v: 165 },
          ]}
        />

        <div className="glass glass-edge g-round-md flex flex-col p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-white">Versement</p>
            <Pill tone="delivered">Wave</Pill>
          </div>
          <p className="mt-3 font-display text-2xl font-extrabold text-[#9ff2c2]">138 000 FCFA</p>
          <p className="text-[10px] text-white/55">disponible · frais de versement 1 %</p>
          <div className="mt-3 space-y-1.5 text-[10px] text-white/60">
            <p className="flex justify-between"><span>Commission Toomny (5 %)</span><b className="text-white">− 12 000</b></p>
            <p className="flex justify-between"><span>Versement Wave (1 %)</span><b className="text-white">− 1 380</b></p>
            <p className="flex justify-between border-t border-white/10 pt-1.5"><span>Net reçu</span><b className="text-[#9ff2c2]">124 620 FCFA</b></p>
          </div>
          <span className="g-btn g-btn-primary g-btn-sm mt-4 w-full">
            <Download width={13} height={13} aria-hidden />
            Retirer sur Wave
          </span>
        </div>
      </div>

      <SectionTitle action="Toutes les commandes">À traiter</SectionTitle>
      <div className="glass glass-edge g-round-md overflow-hidden">
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="text-[9px] uppercase tracking-wider text-white/45">
              <th className="px-3 py-2 font-semibold">Commande</th>
              <th className="hidden px-3 py-2 font-semibold sm:table-cell">Client</th>
              <th className="px-3 py-2 font-semibold">Statut</th>
              <th className="px-3 py-2 text-right font-semibold">Montant</th>
            </tr>
          </thead>
          <tbody className="text-white/70">
            {[
              { t: "Identité visuelle complète", c: "Boutique Adjoua", s: "Payée — à démarrer", tone: "funded" as const, m: "150 000" },
              { t: "Charte graphique — 3 pistes", c: "Cabinet Kéita", s: "Livrée — attente client", tone: "delivered" as const, m: "90 000" },
              { t: "Packaging 5 références", c: "Maison Daba", s: "Terminée", tone: "pending" as const, m: "240 000" },
            ].map((r) => (
              <tr key={r.t} className="border-t border-white/10">
                <td className="px-3 py-2.5 font-semibold text-white">{r.t}</td>
                <td className="hidden px-3 py-2.5 sm:table-cell">{r.c}</td>
                <td className="px-3 py-2.5"><Pill tone={r.tone}>{r.s}</Pill></td>
                <td className="px-3 py-2.5 text-right font-semibold text-white">{r.m}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="glass glass-edge g-round-md p-4">
          <div className="flex items-center gap-2">
            <Sparkles width={13} height={13} className="text-[#e0b566]" aria-hidden />
            <p className="text-xs font-bold text-white">Deux prestations sans photo</p>
          </div>
          <p className="mt-1.5 text-[10px] leading-relaxed text-white/60">
            Une carte avec photo reçoit en moyenne deux fois plus de vues. Ajoutez une image
            pour vos deux prestations en brouillon.
          </p>
          <span className="g-btn g-btn-ghost g-btn-xs mt-3">
            <Plus width={11} height={11} aria-hidden />
            Ajouter une photo
          </span>
        </div>

        <div className="glass glass-edge g-round-md p-4">
          <p className="text-xs font-bold text-white">Boost — 3 jours restants</p>
          <p className="mt-1 text-[10px] text-white/60">Votre prestation vedette apparaît en tête du catalogue.</p>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-3/4 rounded-full bg-[#8bf0b6]" />
          </div>
          <p className="mt-1.5 text-[9px] text-white/45">1 240 vues · 18 clics</p>
        </div>
      </div>
    </Shell>
  );
}

/* ── 3. Tableau de bord ADMINISTRATION ───────────────────────────────────── */

function AdminDashboard() {
  return (
    <Shell
      role="admin"
      title="Vue d'ensemble"
      subtitle="5 commandes à traiter · 7 vérifications en attente · 2 litiges"
      user={{ name: "Équipe Toomny", avatar: DEMO_PROVIDERS[3].avatar, meta: "Administration" }}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Volume d'affaires" value="4,2 M FCFA" hint="ce mois" trend="+18 %" icon={TrendingUp} accent />
        <Stat label="Commissions" value="286 000 FCFA" hint="ce mois" icon={Wallet} />
        <Stat label="Litiges ouverts" value="2" hint="1 de plus de 48 h" icon={LifeBuoy} />
        <Stat label="Vérifications" value="7" hint="en attente" icon={ShieldCheck} />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <Trend label="Commandes" points={[12, 18, 15, 24, 21, 30, 27, 34, 31, 39]} />
        <div className="glass glass-edge g-round-md p-4">
          <p className="text-xs font-bold text-white">À traiter maintenant</p>
          <ul className="mt-3 space-y-2.5 text-[11px]">
            {[
              { t: "2 litiges à arbitrer", d: "Le plus ancien date de 3 jours", tone: "dispute" as const },
              { t: "7 pièces d'identité à vérifier", d: "Côte d'Ivoire, Bénin, Sénégal", tone: "pending" as const },
              { t: "3 versements en attente", d: "Total 412 000 FCFA", tone: "funded" as const },
            ].map((a) => (
              <li key={a.t} className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/4 p-2.5">
                <span className="mt-0.5"><Pill tone={a.tone}>!</Pill></span>
                <span className="min-w-0">
                  <span className="block font-semibold text-white">{a.t}</span>
                  <span className="block text-[10px] text-white/55">{a.d}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <SectionTitle action="Toutes les commandes">Dernières commandes</SectionTitle>
      <div className="glass glass-edge g-round-md overflow-hidden">
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="text-[9px] uppercase tracking-wider text-white/45">
              <th className="px-3 py-2 font-semibold">Réf.</th>
              <th className="px-3 py-2 font-semibold">Prestation</th>
              <th className="hidden px-3 py-2 font-semibold sm:table-cell">Prestataire</th>
              <th className="px-3 py-2 font-semibold">Statut</th>
              <th className="px-3 py-2 text-right font-semibold">Montant</th>
            </tr>
          </thead>
          <tbody className="text-white/70">
            {[
              { r: "#TM-2841", t: "Identité visuelle complète", p: "Awa Konaté", s: "Payée", tone: "funded" as const, m: "150 000" },
              { r: "#TM-2840", t: "Réels — 4 par mois", p: "Fatou Diallo", s: "Livrée", tone: "delivered" as const, m: "95 000" },
              { r: "#TM-2839", t: "Site vitrine", p: "Koffi N'Guessan", s: "Terminée", tone: "pending" as const, m: "320 000" },
              { r: "#TM-2838", t: "Campagnes Meta", p: "Yann Adjovi", s: "Litige", tone: "dispute" as const, m: "180 000" },
            ].map((row) => (
              <tr key={row.r} className="border-t border-white/10">
                <td className="px-3 py-2.5 font-mono text-[10px] text-white/50">{row.r}</td>
                <td className="px-3 py-2.5 font-semibold text-white">{row.t}</td>
                <td className="hidden px-3 py-2.5 sm:table-cell">{row.p}</td>
                <td className="px-3 py-2.5"><Pill tone={row.tone}>{row.s}</Pill></td>
                <td className="px-3 py-2.5 text-right font-semibold text-white">{row.m}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}

/* ── Sélecteur de rôle + export ───────────────────────────────────────────── */

export function GlassyDashboards({ role }: { role: DashRole }) {
  return (
    <>
      {/* Sélecteur de rôle : de simples liens, donc rien à hydrater. */}
      <div className="mx-auto max-w-7xl px-3 sm:px-6">
        <div className="glass glass-edge g-round-pill inline-flex max-w-full flex-row gap-1 overflow-x-auto p-1">
          {ROLES.map((r) => {
            const active = r.key === role;
            return (
              <Link
                key={r.key}
                href={`/design-glassy/dashboards?role=${r.key}`}
                scroll={false}
                className={`flex shrink-0 items-center justify-center rounded-full px-3.5 py-2 text-xs font-semibold transition-colors sm:px-4 ${
                  active ? "bg-[#8bf0b6]/15 text-[#9ff2c2]" : "text-white/65 hover:bg-white/8 hover:text-white"
                }`}
              >
                {r.label}
              </Link>
            );
          })}
        </div>
        <p className="mt-2 mb-5 text-[11px] text-white/50">
          {ROLES.find((r) => r.key === role)?.hint}
        </p>
      </div>

      {role === "client" && <ClientDashboard />}
      {role === "prestataire" && <ProviderDashboard />}
      {role === "admin" && <AdminDashboard />}
    </>
  );
}
