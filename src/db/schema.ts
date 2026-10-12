import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  integer,
  smallint,
  bigint,
  boolean,
  date,
  jsonb,
  numeric,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Toomny — schéma
//
// Trois règles non négociables, issues de l'étude de marché :
//
// 1. MULTI-DEVISES DÈS LE DÉPART. Tout montant est un entier dans la plus
//    petite unité de la devise (`*_minor`), jamais un flottant. Le XOF n'a
//    pas de subdivision : 1 FCFA = 1 unité mineure. L'USD en a 2.
//    L'interface n'expose que le XOF en phase 1, la base est déjà prête.
//
// 2. NOUS NE DÉTENONS JAMAIS LES FONDS. Le séquestre est porté par un
//    partenaire agréé BCEAO. `escrow_holds` ne fait que référencer la
//    rétention chez ce partenaire. Aucune colonne ne représente un solde
//    détenu par Toomny.
//
// 3. JOURNAL IMMUABLE. `ledger_entries` est en ajout seul. Il conditionne
//    l'attestation de revenus et l'avance sur mission, les deux produits
//    financiers qui porteront la marge réelle.
// ---------------------------------------------------------------------------

// --- Énumérations -----------------------------------------------------------

export const localeEnum = pgEnum("locale", ["fr", "en"]);

export const userRoleEnum = pgEnum("user_role", ["client", "provider", "both", "admin"]);

export const verificationStatusEnum = pgEnum("verification_status", [
  "unverified",
  "pending",
  "verified",
  "rejected",
  "manual_review", // recours humain : les pièces africaines passent mal en automatique
]);

export const serviceStatusEnum = pgEnum("service_status", ["draft", "active", "paused", "removed"]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending_payment", // commande créée, client n'a pas encore payé
  "funded", // fonds retenus chez le partenaire agréé
  "in_progress", // prestataire a démarré
  "delivered", // livré, en attente de validation client
  "completed", // validé, fonds libérés
  "disputed", // litige ouvert
  "cancelled", // annulé avant financement
  "refunded", // fonds rendus au client
]);

export const escrowStatusEnum = pgEnum("escrow_status", [
  "requested",
  "held", // retenu chez le partenaire
  "released", // libéré vers le prestataire
  "refunded", // rendu au client
  "failed",
]);

export const payoutStatusEnum = pgEnum("payout_status", [
  "queued",
  "processing",
  "paid",
  "failed",
]);

export const payoutChannelEnum = pgEnum("payout_channel", [
  "wave", // 0 % à la réception : canal par défaut
  "orange_money",
  "mtn_momo",
  "moov_money",
  "bank_transfer",
]);

export const disputeStatusEnum = pgEnum("dispute_status", [
  "open",
  "awaiting_provider",
  "awaiting_client",
  "resolved_client",
  "resolved_provider",
  "resolved_split",
]);

export const ledgerDirectionEnum = pgEnum("ledger_direction", ["credit", "debit"]);

export const ledgerKindEnum = pgEnum("ledger_kind", [
  "order_funded",
  "commission",
  "aggregator_fee",
  "payout",
  "refund",
  "adjustment",
]);

// --- Identité et profils ----------------------------------------------------

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").unique().notNull(),
    phone: text("phone"), // le numéro mobile money est l'identifiant réel ici
    // Les mots de passe restent chez Supabase Auth : aucun hash ici.
    displayName: text("display_name"),
    firstName: text("first_name"),
    lastName: text("last_name"),
    city: text("city"),
    role: userRoleEnum("role").default("client").notNull(),
    countryCode: text("country_code").notNull(), // ISO 3166-1 alpha-2 : CI, SN, BF...
    preferredLocale: localeEnum("preferred_locale").default("fr").notNull(),
    preferredCurrency: text("preferred_currency").default("XOF").notNull(),
    verificationStatus: verificationStatusEnum("verification_status").default("unverified").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("profiles_country_idx").on(t.countryCode), index("profiles_role_idx").on(t.role)],
);

export const providerProfiles = pgTable("provider_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id")
    .notNull()
    .unique()
    .references(() => profiles.id, { onDelete: "cascade" }),
  headline: text("headline"),
  bio: text("bio"),
  contentLocale: localeEnum("content_locale").default("fr").notNull(), // pour filtrer/traduire à l'ouverture anglophone
  city: text("city"),
  // Canal de versement. Wave est le défaut : gratuit à la réception.
  payoutChannel: payoutChannelEnum("payout_channel"),
  payoutMsisdn: text("payout_msisdn"), // numéro mobile money du prestataire
  payoutVerifiedAt: timestamp("payout_verified_at", { withTimezone: true }),
  // Vitrine (0014, 0019) : avatar, compétences, langues et liens publics.
  avatarUrl: text("avatar_url"),
  skills: text("skills"), // tags séparés par des virgules
  spokenLanguages: text("spoken_languages"), // ex : "fr,en,wo"
  websiteUrl: text("website_url"),
  linkedinUrl: text("linkedin_url"),
  twitterUrl: text("twitter_url"),
  ratingAvg: numeric("rating_avg", { precision: 3, scale: 2 }),
  ratingCount: integer("rating_count").default(0).notNull(),
  completedOrders: integer("completed_orders").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Vérification d'identité — conçue pour les pièces locales, avec recours humain.
export const verifications = pgTable("verifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  documentType: text("document_type").notNull(), // cni, passeport, permis, attestation
  documentCountry: text("document_country").notNull(),
  declaredFirstName: text("declared_first_name"),
  declaredLastName: text("declared_last_name"),
  declaredDob: date("declared_dob"),
  storagePath: text("storage_path").notNull(), // bucket Supabase, jamais en base
  status: verificationStatusEnum("status").default("pending").notNull(),
  rejectionReason: text("rejection_reason"),
  reviewedBy: uuid("reviewed_by").references(() => profiles.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// --- Catalogue --------------------------------------------------------------

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").unique().notNull(),
  nameFr: text("name_fr").notNull(),
  nameEn: text("name_en").notNull(),
  position: integer("position").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const services = pgTable(
  "services",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    contentLocale: localeEnum("content_locale").default("fr").notNull(),
    priceMinor: bigint("price_minor", { mode: "bigint" }).notNull(),
    currency: text("currency").default("XOF").notNull(),
    deliveryDays: integer("delivery_days").notNull(),
    status: serviceStatusEnum("status").default("draft").notNull(),
    coverPath: text("cover_path"),
    // Présentation (0011, 0016, 0017) : couverture, galerie (4 max) et tags.
    coverUrl: text("cover_url"),
    galleryUrls: text("gallery_urls").array().default([]).notNull(),
    tags: text("tags").array().default([]).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("services_category_idx").on(t.categoryId),
    index("services_provider_idx").on(t.providerId),
    index("services_status_idx").on(t.status),
  ],
);

// Forfaits Basic (1) / Standard (2) / Premium (3) d'une prestation (0018).
// Lecture publique (prix affichés) ; écriture par la clé service uniquement.
export const servicePackages = pgTable(
  "service_packages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    tier: smallint("tier").notNull(), // 1, 2 ou 3 (CHECK en base)
    name: text("name").notNull(),
    description: text("description"),
    priceMinor: bigint("price_minor", { mode: "bigint" }).notNull(),
    currency: text("currency").default("XOF").notNull(),
    deliveryDays: smallint("delivery_days").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("service_packages_service_tier_idx").on(t.serviceId, t.tier)],
);

// --- Commandes et flux financiers -------------------------------------------

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reference: text("reference").unique().notNull(), // référence lisible, communiquée aux deux parties
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "restrict" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    status: orderStatusEnum("status").default("pending_payment").notNull(),

    // Montants figés à la commande — ne jamais recalculer depuis le service,
    // dont le prix peut changer après coup.
    amountMinor: bigint("amount_minor", { mode: "bigint" }).notNull(),
    commissionMinor: bigint("commission_minor", { mode: "bigint" }).notNull(),
    providerNetMinor: bigint("provider_net_minor", { mode: "bigint" }).notNull(),
    currency: text("currency").notNull(),
    commissionRateBps: integer("commission_rate_bps").notNull(), // 1000 bps = 10 %

    requirements: text("requirements"),
    // Forfait choisi, le cas échéant (0018). Les montants restent figés
    // ci-dessus : on ne recalcule jamais depuis le forfait.
    packageId: uuid("package_id").references(() => servicePackages.id, { onDelete: "set null" }),
    dueAt: timestamp("due_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("orders_client_idx").on(t.clientId),
    index("orders_provider_idx").on(t.providerId),
    index("orders_status_idx").on(t.status),
  ],
);

// Rétention de fonds — chez le PARTENAIRE AGRÉÉ, pas chez nous.
// Cette table n'est qu'un miroir local de l'état côté partenaire.
export const escrowHolds = pgTable(
  "escrow_holds",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "restrict" }),
    partner: text("partner").notNull(), // cinetpay | paydunya | eme_xxx
    partnerHoldRef: text("partner_hold_ref").notNull(), // identifiant de la rétention chez le partenaire
    status: escrowStatusEnum("status").default("requested").notNull(),
    amountMinor: bigint("amount_minor", { mode: "bigint" }).notNull(),
    currency: text("currency").notNull(),
    heldAt: timestamp("held_at", { withTimezone: true }),
    releasedAt: timestamp("released_at", { withTimezone: true }),
    refundedAt: timestamp("refunded_at", { withTimezone: true }),
    failureReason: text("failure_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("escrow_partner_ref_idx").on(t.partner, t.partnerHoldRef),
    index("escrow_order_idx").on(t.orderId),
  ],
);

// Versement mobile money au prestataire, via GeniusPay.
export const payouts = pgTable(
  "payouts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "restrict" }),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    channel: payoutChannelEnum("channel").notNull(),
    msisdn: text("msisdn").notNull(),
    amountMinor: bigint("amount_minor", { mode: "bigint" }).notNull(),
    currency: text("currency").notNull(),
    status: payoutStatusEnum("status").default("queued").notNull(),
    providerRef: text("provider_ref"), // référence côté GeniusPay / agrégateur
    attempts: integer("attempts").default(0).notNull(),
    failureReason: text("failure_reason"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("payouts_order_idx").on(t.orderId), index("payouts_status_idx").on(t.status)],
);

// Journal comptable — AJOUT SEUL. Jamais d'UPDATE ni de DELETE.
// Une correction se fait par une écriture inverse de type `adjustment`.
export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "restrict" }),
    profileId: uuid("profile_id").references(() => profiles.id, { onDelete: "restrict" }),
    kind: ledgerKindEnum("kind").notNull(),
    direction: ledgerDirectionEnum("direction").notNull(),
    amountMinor: bigint("amount_minor", { mode: "bigint" }).notNull(),
    currency: text("currency").notNull(),
    // Taux figé au moment de l'opération : indispensable à l'ouverture multi-devises.
    fxRateToXof: numeric("fx_rate_to_xof", { precision: 18, scale: 8 }),
    externalRef: text("external_ref"),
    metadata: jsonb("metadata"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("ledger_order_idx").on(t.orderId),
    index("ledger_profile_idx").on(t.profileId),
    index("ledger_occurred_idx").on(t.occurredAt),
  ],
);

// Taux de change historisés — la conversion ne se recalcule jamais à la volée.
export const fxRates = pgTable(
  "fx_rates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    baseCurrency: text("base_currency").notNull(),
    quoteCurrency: text("quote_currency").notNull(),
    rate: numeric("rate", { precision: 18, scale: 8 }).notNull(),
    source: text("source").notNull(),
    effectiveAt: timestamp("effective_at", { withTimezone: true }).notNull(),
  },
  (t) => [uniqueIndex("fx_pair_effective_idx").on(t.baseCurrency, t.quoteCurrency, t.effectiveAt)],
);

// --- Échange, litige, réputation --------------------------------------------

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    body: text("body").notNull(),
    attachmentPath: text("attachment_path"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("messages_order_idx").on(t.orderId)],
);

// Demandes de contact avant commande, acheteur → prestataire (0015).
// Pas de FK drizzle vers auth.users : les deux côtés sont des id Auth.
export const inquiries = pgTable(
  "inquiries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fromId: uuid("from_id").notNull(),
    toId: uuid("to_id").notNull(),
    serviceId: uuid("service_id").references(() => services.id, { onDelete: "set null" }),
    message: text("message").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("inquiries_to_idx").on(t.toId), index("inquiries_from_idx").on(t.fromId)],
);

// Notifications in-app : type + paramètres JSON rendus en FR/EN à la lecture (0021).
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recipientId: uuid("recipient_id").notNull(),
    type: text("type").notNull(),
    params: jsonb("params").$type<Record<string, string>>().notNull().default({}),
    link: text("link").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("notifications_recipient_idx").on(t.recipientId, t.createdAt)],
);

export const disputes = pgTable("disputes", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .unique()
    .references(() => orders.id, { onDelete: "restrict" }),
  openedBy: uuid("opened_by")
    .notNull()
    .references(() => profiles.id, { onDelete: "restrict" }),
  reason: text("reason").notNull(),
  status: disputeStatusEnum("status").default("open").notNull(),
  // Arbitrage humain au lancement : acceptable et rassurant à faible volume.
  resolvedBy: uuid("resolved_by").references(() => profiles.id, { onDelete: "set null" }),
  resolution: text("resolution"),
  clientShareBps: integer("client_share_bps"), // répartition en cas de résolution partagée
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .unique()
      .references(() => orders.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    targetId: uuid("target_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    rating: integer("rating").notNull(), // 1 à 5
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("reviews_target_idx").on(t.targetId)],
);
