import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";

export type ProviderContext = {
  threadId: string;
  conversation: Array<{ role: "provider" | "admin"; body: string; at: string }>;
  provider: {
    name: string | null;
    email: string | null;
    phone: string | null;
    city: string | null;
    country: string | null;
    locale: string;
    verificationStatus: string;
    memberSince: string;
  };
  providerProfile: {
    plan: string;
    planExpiresAt: string | null;
    ratingAvg: string | null;
    ratingCount: number;
    completedOrders: number;
    payoutChannel: string | null;
    payoutVerified: boolean;
    headline: string | null;
    bio: string | null;
  } | null;
  recentOrders: Array<{
    reference: string;
    status: string;
    amountMinor: number;
    currency: string;
    createdAt: string;
    dueAt: string | null;
    deliveredAt: string | null;
    completedAt: string | null;
  }>;
  recentPayouts: Array<{
    amountMinor: number;
    currency: string;
    channel: string;
    status: string;
    failureReason: string | null;
    paidAt: string | null;
    createdAt: string;
  }>;
  services: Array<{ title: string; status: string; priceMinor: number; currency: string }>;
  verifications: Array<{
    documentType: string;
    status: string;
    rejectionReason: string | null;
    createdAt: string;
  }>;
  openDisputes: number;
};

/** Récupère toutes les données Supabase relatives au prestataire du thread. */
export async function fetchProviderContext(threadId: string): Promise<ProviderContext | null> {
  const db = createAdminClient();

  // Thread + conversation
  const { data: thread } = await db
    .from("support_threads")
    .select("id, provider_id")
    .eq("id", threadId)
    .maybeSingle();

  if (!thread) return null;

  const providerId = thread.provider_id;

  const [
    messagesRes,
    profileRes,
    providerProfileRes,
    ordersRes,
    payoutsRes,
    servicesRes,
    verificationsRes,
    disputesRes,
  ] = await Promise.all([
    db
      .from("support_messages")
      .select("body, sender_id, created_at")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true }),
    db
      .from("profiles")
      .select("display_name, first_name, last_name, email, phone, city, country_code, preferred_locale, verification_status, created_at")
      .eq("id", providerId)
      .maybeSingle(),
    db
      .from("provider_profiles")
      .select("plan, plan_expires_at, rating_avg, rating_count, completed_orders, payout_channel, payout_verified_at, headline, bio")
      .eq("profile_id", providerId)
      .maybeSingle(),
    db
      .from("orders")
      .select("reference, status, amount_minor, currency, created_at, due_at, delivered_at, completed_at")
      .eq("provider_id", providerId)
      .order("created_at", { ascending: false })
      .limit(10),
    db
      .from("payouts")
      .select("amount_minor, currency, channel, status, failure_reason, paid_at, created_at")
      .eq("provider_id", providerId)
      .order("created_at", { ascending: false })
      .limit(5),
    db
      .from("services")
      .select("title, status, price_minor, currency")
      .eq("provider_id", providerId)
      .order("created_at", { ascending: false }),
    db
      .from("verifications")
      .select("document_type, status, rejection_reason, created_at")
      .eq("profile_id", providerId)
      .order("created_at", { ascending: false }),
    db
      .from("disputes")
      .select("id, status")
      .eq("opened_by", providerId)
      .in("status", ["open", "awaiting_provider", "awaiting_client"]),
  ]);

  const p = profileRes.data;
  const pp = providerProfileRes.data;
  const msgs = messagesRes.data ?? [];

  const conversation = msgs.map((m) => ({
    role: (m.sender_id === providerId ? "provider" : "admin") as "provider" | "admin",
    body: m.body,
    at: m.created_at,
  }));

  return {
    threadId,
    conversation,
    provider: {
      name: p?.display_name ?? [p?.first_name, p?.last_name].filter(Boolean).join(" ") ?? null,
      email: p?.email ?? null,
      phone: p?.phone ?? null,
      city: p?.city ?? null,
      country: p?.country_code ?? null,
      locale: p?.preferred_locale ?? "fr",
      verificationStatus: p?.verification_status ?? "unverified",
      memberSince: p?.created_at ?? "",
    },
    providerProfile: pp
      ? {
          plan: pp.plan,
          planExpiresAt: pp.plan_expires_at,
          ratingAvg: pp.rating_avg,
          ratingCount: pp.rating_count ?? 0,
          completedOrders: pp.completed_orders ?? 0,
          payoutChannel: pp.payout_channel,
          payoutVerified: !!pp.payout_verified_at,
          headline: pp.headline,
          bio: pp.bio,
        }
      : null,
    recentOrders: (ordersRes.data ?? []).map((o) => ({
      reference: o.reference,
      status: o.status,
      amountMinor: Number(o.amount_minor),
      currency: o.currency,
      createdAt: o.created_at,
      dueAt: o.due_at,
      deliveredAt: o.delivered_at,
      completedAt: o.completed_at,
    })),
    recentPayouts: (payoutsRes.data ?? []).map((p) => ({
      amountMinor: Number(p.amount_minor),
      currency: p.currency,
      channel: p.channel,
      status: p.status,
      failureReason: p.failure_reason,
      paidAt: p.paid_at,
      createdAt: p.created_at,
    })),
    services: (servicesRes.data ?? []).map((s) => ({
      title: s.title,
      status: s.status,
      priceMinor: Number(s.price_minor),
      currency: s.currency,
    })),
    verifications: (verificationsRes.data ?? []).map((v) => ({
      documentType: v.document_type,
      status: v.status,
      rejectionReason: v.rejection_reason,
      createdAt: v.created_at,
    })),
    openDisputes: (disputesRes.data ?? []).length,
  };
}

function formatContext(ctx: ProviderContext): string {
  const lines: string[] = [];

  // Profil
  lines.push("=== PROFIL PRESTATAIRE ===");
  lines.push(`Nom : ${ctx.provider.name ?? "inconnu"}`);
  if (ctx.provider.phone) lines.push(`Téléphone : ${ctx.provider.phone}`);
  lines.push(`Pays : ${ctx.provider.country ?? "?"}  Ville : ${ctx.provider.city ?? "?"}`);
  lines.push(`Membre depuis : ${ctx.provider.memberSince}`);
  lines.push(`Vérification identité : ${ctx.provider.verificationStatus}`);
  lines.push(`Langue préférée : ${ctx.provider.locale}`);

  if (ctx.providerProfile) {
    lines.push("");
    lines.push("=== PROFIL PRESTATAIRE (détails) ===");
    lines.push(`Plan : ${ctx.providerProfile.plan}${ctx.providerProfile.planExpiresAt ? ` (expire ${ctx.providerProfile.planExpiresAt})` : ""}`);
    lines.push(`Note moyenne : ${ctx.providerProfile.ratingAvg ?? "aucune"} (${ctx.providerProfile.ratingCount} évals)`);
    lines.push(`Commandes terminées : ${ctx.providerProfile.completedOrders}`);
    lines.push(`Canal de versement : ${ctx.providerProfile.payoutChannel ?? "non configuré"} — vérifié : ${ctx.providerProfile.payoutVerified ? "oui" : "non"}`);
    if (ctx.providerProfile.headline) lines.push(`Titre : ${ctx.providerProfile.headline}`);
  }

  // Commandes récentes
  lines.push("");
  lines.push(`=== COMMANDES RÉCENTES (${ctx.recentOrders.length}) ===`);
  if (ctx.recentOrders.length === 0) {
    lines.push("Aucune commande.");
  } else {
    for (const o of ctx.recentOrders) {
      lines.push(
        `• [${o.reference}] statut=${o.status} montant=${o.amountMinor} ${o.currency} créée=${o.createdAt}` +
          (o.dueAt ? ` délai=${o.dueAt}` : "") +
          (o.deliveredAt ? ` livré=${o.deliveredAt}` : "") +
          (o.completedAt ? ` terminé=${o.completedAt}` : ""),
      );
    }
  }

  // Versements récents
  lines.push("");
  lines.push(`=== VERSEMENTS RÉCENTS (${ctx.recentPayouts.length}) ===`);
  if (ctx.recentPayouts.length === 0) {
    lines.push("Aucun versement.");
  } else {
    for (const p of ctx.recentPayouts) {
      lines.push(
        `• ${p.amountMinor} ${p.currency} via ${p.channel} — statut=${p.status}` +
          (p.failureReason ? ` ÉCHEC="${p.failureReason}"` : "") +
          (p.paidAt ? ` payé=${p.paidAt}` : ""),
      );
    }
  }

  // Services
  lines.push("");
  lines.push(`=== SERVICES (${ctx.services.length}) ===`);
  for (const s of ctx.services) {
    lines.push(`• "${s.title}" — statut=${s.status} prix=${s.priceMinor} ${s.currency}`);
  }
  if (ctx.services.length === 0) lines.push("Aucun service.");

  // Vérifications
  lines.push("");
  lines.push(`=== VÉRIFICATIONS IDENTITÉ (${ctx.verifications.length}) ===`);
  for (const v of ctx.verifications) {
    lines.push(
      `• ${v.documentType} — statut=${v.status}` +
        (v.rejectionReason ? ` motif_rejet="${v.rejectionReason}"` : ""),
    );
  }
  if (ctx.verifications.length === 0) lines.push("Aucune vérification soumise.");

  // Litiges
  lines.push("");
  lines.push(`=== LITIGES OUVERTS : ${ctx.openDisputes} ===`);

  // Conversation
  lines.push("");
  lines.push("=== CONVERSATION SUPPORT ===");
  for (const m of ctx.conversation) {
    lines.push(`[${m.role.toUpperCase()} — ${m.at}]`);
    lines.push(m.body);
    lines.push("");
  }

  return lines.join("\n");
}

const SYSTEM_PROMPT = `Tu es un assistant de support pour Toomny, une marketplace de talents en Afrique de l'Ouest (UEMOA). Tu aides les administrateurs à rédiger des réponses aux messages des prestataires.

RÈGLES CRITIQUES :
1. Détecte la langue du DERNIER message du prestataire et réponds UNIQUEMENT dans cette langue (français si fr, anglais si en, etc.)
2. Appuie-toi UNIQUEMENT sur les données fournies — ne suppose rien de ce qui n'est pas dans le contexte
3. Sois empathique, professionnel et concis
4. Si tu identifies un problème précis (versement échoué, vérification rejetée, commande bloquée, etc.), explique clairement la situation et propose une action concrète
5. Ne mentionne jamais d'identifiants internes (UUID, refs techniques), de montants en unités mineures brutes, ni de détails de base de données
6. Si le problème n'est pas identifiable avec les données disponibles, dis-le clairement et demande des précisions
7. La réponse est un BROUILLON prêt à être envoyé par l'admin — rédige directement le message, sans introduction ni commentaire méta
8. Les montants en XOF n'ont pas de subdivision (1 unité = 1 FCFA)`;

/** Crée un stream Anthropic pour générer un brouillon de réponse admin. */
export function createDraftStream(ctx: ProviderContext) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const contextText = formatContext(ctx);

  return client.messages.stream({
    model: "claude-opus-5-5",
    max_tokens: 1024,
    thinking: { type: "adaptive" },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Voici toutes les données disponibles sur ce prestataire et la conversation support en cours.\n\nAnalyse le contexte en profondeur et rédige un brouillon de réponse pour l'admin.\n\n${contextText}`,
      },
    ],
  });
}
