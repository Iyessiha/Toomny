import Image from "next/image";
import Link from "next/link";
import { categoryMeta } from "@/lib/categories";
import { getLanding } from "@/content/landing";
import { Logo } from "@/components/ui/logo";
import { headers } from "next/headers";
import type { Locale } from "@/i18n/dictionaries";
import type { ServiceCard as ServiceCardData } from "@/lib/catalog";
import { GlassyEffects } from "./glassy-effects";
import { GlassyShell } from "./glassy-shell";
import { GlassServiceCard, GlassProviderCard } from "./glassy-cards";
import { Testimonials, TradeSections } from "./glassy-trades";
import { CATEGORY_COVER, DEMO_PROVIDERS } from "./glassy-demo";

const BRAND_MARK = (
  <svg viewBox="0 0 120 120" fill="none" aria-hidden>
    <circle cx="43" cy="22" r="11.5" fill="currentColor" />
    <circle cx="77" cy="22" r="11.5" fill="currentColor" />
    <g fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="butt">
      <path d="M74 50C62 34 32 37 29 58C26 79 47 87 54 100" />
      <path d="M46 50C58 34 88 37 91 58C94 79 73 87 66 100" />
    </g>
  </svg>
);

const PAYMENT_METHODS = [
  { name: "Wave", src: "/payment/wave.svg" },
  { name: "Orange Money", src: "/payment/orange_money.svg" },
  { name: "MTN MoMo", src: "/payment/mtn.svg" },
  { name: "Moov Money", src: "/payment/moov.svg" },
  { name: "Carte bancaire", src: "/payment/card.svg" },
];

const LABELS = {
  fr: {
    badge: "Proposition de design",
    badgeBack: "← Design actuel",
    heroKicker: "Aurora Glass — piste 2",
    heroLine1: "La confiance,",
    heroLine2: "en transparence",
    heroLead:
      "Verre dépoli, lumière d'aurore, émeraude de la charte. Le paiement conservé se voit au lieu de se promettre : chaque carte laisse passer le fond.",
    primary: "Trouver un prestataire",
    secondary: "Comment ça marche",
    search: "Que recherchez-vous ?",
    searchBtn: "Rechercher",
    rails: "Paiements et versements par",
    stats: [
      { k: "0 %", v: "commission côté client" },
      { k: "3 %", v: "commission minimale prestataire" },
      { k: "72 h", v: "validation automatique" },
    ],
    categoriesKicker: "Catégories",
    categoriesTitle: "Huit métiers, une même exigence",
    categoriesLead: "Le catalogue s'ouvre métier par métier, pour que chaque catégorie soit réellement fournie.",
    categoriesAll: "Tout le catalogue",
    servicesKicker: "Sélection",
    servicesTitle: "Prestations en lumière",
    servicesLead: "",
    servicesAll: "Voir le catalogue",
    servicesEmpty: "Le catalogue s'ouvre au fur et à mesure des vérifications.",
    providerStrip: "Prestataires en vedette",
    trades: {
      p01: {
        kicker: "Design graphique",
        title: "Un logo, ce n'est pas un dessin joli",
        lead: "C'est ce que vos clients verront sur un sac, une facture, un camion. Nos designers livrent des fichiers prêts pour l'imprimeur du coin, pas un PDF qui plante.",
        cta: "Voir les prestations de design",
      },
      p02: {
        kicker: "Développement web",
        title: "Un site qui rapporte, pas un site qui existe",
        lead: "Des développeurs qui livrent un site mesuré sur un réseau lent, testé sur un vrai téléphone, et qui vous expliquent comment le mettre à jour.",
        cta: "Voir les prestations web",
      },
      p03: {
        kicker: "Marketing & communauté",
        title: "Arrêtez de payer des vues",
        lead: "Campagnes Meta et TikTok, calendrier éditorial, contenus : vous suivez les commandes et les messages reçus, sur un tableau de bord que vous comprenez.",
        cta: "Voir les prestations marketing",
      },
      p04: {
        kicker: "Image & vidéo",
        title: "La photo qui fait sortir le produit du lot",
        lead: "Réels, photos produit, films publicitaires : tournés ici, avec un téléphone ou en studio, et montés pour vendre en trois secondes sur un fil d'actualité.",
        cta: "Voir les prestations vidéo",
      },
      testimonials: {
        kicker: "Témoignages",
        title: "Ils ont commandé, ils racontent",
        lead: "Avis laissés après une commande terminée uniquement. Aucun avis acheté, aucun avis retiré parce qu'il déplaisait.",
      },
    },
    testimonials: [
      { name: "Boutique Adjoua", role: "Cliente · Abidjan", avatar: "/images/glassy/avatars/adjoua-kouassi.jpg", body: "J'ai eu mon identité visuelle en cinq jours, fichiers prêts pour l'imprimeur du quartier. Le paiement bloqué m'a rassurée : je ne payais qu'une fois la maquette validée." },
      { name: "Cabinet Kéita", role: "Client · Bouaké", avatar: "/images/glassy/avatars/brahim-coulibaly.jpg", body: "Le site vitrine tourne depuis six mois sans que j'y touche. Le prestataire a compris qu'on n'a pas la fibre partout et a allégé les pages." },
      { name: "Fatou D.", role: "Prestataire · Dakar", avatar: "/images/glassy/avatars/fatou-diallo.jpg", body: "Je suis payée sur Wave dès la validation, sans société à l'étranger ni frais de change. C'est la première plateforme où je garde ce que je facture." },
      { name: "Maison Daba", role: "Cliente · Abidjan", avatar: "/images/glassy/avatars/estelle-nkodo.jpg", body: "Trois prestataires, trois commandes, aucune mauvaise surprise. La commission côté client est à zéro, et c'est écrit avant de payer." },
    ],
    providersKicker: "Prestataires",
    providersTitle: "Des visages, pas des profils anonymes",
    providersLead: "Identité vérifiée, avis laissés après commande, présence en ligne quand ils sont disponibles.",
    providersAll: "Tous les prestataires",
    dashboardsCta: "Voir les tableaux de bord",
    dashboardsKicker: "Espaces connectés",
    dashboardsTitle: "Le même verre, une fois connecté",
    dashboardsLead:
      "La vitrine tient sa promesse jusqu'aux tableaux de bord : client, prestataire, administration. Trois rôles, une seule coquille.",
    dashboardRoles: [
      { key: "client", label: "Client", hint: "Commandes, validation, garanties" },
      { key: "prestataire", label: "Prestataire", hint: "Encaissements, versements, boost" },
      { key: "admin", label: "Administration", hint: "Litiges, vérifications, volume" },
    ],
    howKicker: "Fonctionnement",
    howTitle: "Trois étapes, zéro mauvaise surprise",
    steps: [
      { n: "01", title: "Choisissez", body: "Prix et délai affichés sur chaque prestation. Pas de cahier des charges." },
      { n: "02", title: "Payez, fonds conservés", body: "Mobile money ou carte. Le montant reste bloqué jusqu'à validation." },
      { n: "03", title: "Validez", body: "Livraison conforme ou litige arbitré en français. Le versement part à la validation." },
    ],
    securityKicker: "Sécurité",
    securityTitle: "L'argent ne passe pas par nous",
    securityLead:
      "Ni le client ni le prestataire n'a besoin de faire confiance à l'autre : c'est la structure du paiement qui tient lieu de garantie.",
    guarantees: [
      { title: "Fonds chez un partenaire agréé", body: "Toomny déclenche la libération, ne touche jamais au dépôt." },
      { title: "Identité vérifiée", body: "Pièce d'identité contrôlée avant publication, pensée pour les pièces locales." },
      { title: "Litige arbitré par un humain", body: "À partir des échanges et livrables conservés sur la plateforme." },
      { title: "Validation automatique à 72 h", body: "Un client inactif ne bloque pas le revenu d'un prestataire." },
    ],
    pricingKicker: "Tarifs",
    pricingTeaserTitle: "0 % côté client, de 3 % à 10 % côté prestataire",
    pricingTeaserLead: "Le détail complet — plans, exemple chiffré, comparatif Fiverr et Upwork — vit sur sa propre page. Ici, on vous montre surtout le travail.",
    pricingTeaserCta: "Voir les tarifs",
    pricingTitle: "Quatre paliers, aucun engagement",
    pricingLead: "Aucune commission côté client. Côté prestataire, la part Toomny baisse à mesure que vous montez.",
    perMonth: "par mois",
    commission: "commission",
    compareTitle: "Ce que les plateformes mondiales prennent vraiment",
    compareCols: ["Prestataire", "Fiverr", "Upwork", "Toomny"],
    ctaTitle: "Travailler ensemble, grandir ensemble",
    ctaLead: "Rejoignez Toomny, que vous cherchiez un prestataire de confiance ou que vous vouliez enfin être payé correctement.",
    ctaPrimary: "Trouver un prestataire",
    ctaSecondary: "Proposer mes services",
    faqTitle: "Questions fréquentes",
    legal: "Proposition de refonte · ne remplace pas la page d'accueil en production",
    popular: "Populaire",
  },
  en: {
    badge: "Design proposal",
    badgeBack: "← Current design",
    heroKicker: "Aurora Glass — option 2",
    heroLine1: "Trust,",
    heroLine2: "made transparent",
    heroLead:
      "Frosted glass, aurora light, the charte's emerald. Held payments become visible instead of promised: every card lets the background through.",
    primary: "Find a provider",
    secondary: "How it works",
    search: "What are you looking for?",
    searchBtn: "Search",
    rails: "Payments and payouts via",
    stats: [
      { k: "0%", v: "buyer commission" },
      { k: "3%", v: "minimum provider commission" },
      { k: "72 h", v: "automatic approval" },
    ],
    categoriesKicker: "Categories",
    categoriesTitle: "Eight trades, one standard",
    categoriesLead: "The catalogue opens one trade at a time, so every category is genuinely staffed.",
    categoriesAll: "Full catalogue",
    servicesKicker: "Selection",
    servicesTitle: "Services in the light",
    servicesLead: "Services highlighted by their providers.",
    servicesAll: "Browse catalogue",
    servicesEmpty: "The catalogue opens as verifications complete.",
    providerStrip: "Featured providers",
    trades: {
      p01: {
        kicker: "Graphic design",
        title: "A logo is not a pretty drawing",
        lead: "It is what your customers see on a bag, an invoice, a truck. Our designers deliver files ready for the local printer, not a PDF that crashes.",
        cta: "See design services",
      },
      p02: {
        kicker: "Web development",
        title: "A site that earns, not just a site that exists",
        lead: "Developers who ship a site measured on a slow network, tested on a real phone, and who teach you how to update it.",
        cta: "See web services",
      },
      p03: {
        kicker: "Marketing & community",
        title: "Stop paying for views",
        lead: "Meta and TikTok campaigns, content calendar, posts: you follow the orders and messages you get, on a dashboard you understand.",
        cta: "See marketing services",
      },
      p04: {
        kicker: "Image & video",
        title: "The photo that makes a product stand out",
        lead: "Reels, product photos, ad films: shot here, on a phone or in a studio, cut to sell in three seconds on a feed.",
        cta: "See video services",
      },
      testimonials: {
        kicker: "Testimonials",
        title: "They ordered, they tell it",
        lead: "Reviews only left after a completed order. None bought, none removed for being unflattering.",
      },
    },
    testimonials: [
      { name: "Boutique Adjoua", role: "Client · Abidjan", avatar: "/images/glassy/avatars/adjoua-kouassi.jpg", body: "I had my brand identity in five days, files ready for the local printer. The held payment reassured me: I only paid once the artwork was approved." },
      { name: "Cabinet Kéita", role: "Client · Bouaké", avatar: "/images/glassy/avatars/brahim-coulibaly.jpg", body: "The site has been running for six months untouched. The provider understood we do not have fast broadband everywhere and kept pages light." },
      { name: "Fatou D.", role: "Provider · Dakar", avatar: "/images/glassy/avatars/fatou-diallo.jpg", body: "I get paid to Wave as soon as the client approves, with no foreign company and no conversion fees. First platform where I keep what I charge." },
      { name: "Maison Daba", role: "Client · Abidjan", avatar: "/images/glassy/avatars/estelle-nkodo.jpg", body: "Three providers, three orders, no nasty surprises. Buyer commission is zero, and that is stated before you pay." },
    ],
    providersKicker: "Providers",
    providersTitle: "Faces, not anonymous profiles",
    providersLead: "Verified identity, reviews left after an order, online presence when available.",
    providersAll: "All providers",
    dashboardsCta: "See the dashboards",
    dashboardsKicker: "Connected spaces",
    dashboardsTitle: "The same glass, once you're signed in",
    dashboardsLead:
      "The promise holds all the way into the dashboards: client, provider, administration. Three roles, one shell.",
    dashboardRoles: [
      { key: "client", label: "Client", hint: "Orders, approval, guarantees" },
      { key: "prestataire", label: "Provider", hint: "Earnings, payouts, boost" },
      { key: "admin", label: "Administration", hint: "Disputes, verifications, volume" },
    ],
    howKicker: "How it works",
    howTitle: "Three steps, zero nasty surprises",
    steps: [
      { n: "01", title: "Pick", body: "Price and delivery time on every service. No brief to write." },
      { n: "02", title: "Pay, funds held", body: "Mobile money or card. The amount stays locked until approval." },
      { n: "03", title: "Approve", body: "On-spec delivery or a local dispute. Payout is released on approval." },
    ],
    securityKicker: "Security",
    securityTitle: "Money never passes through us",
    securityLead:
      "Neither side has to trust the other: the structure of the payment is the guarantee.",
    guarantees: [
      { title: "Funds at a licensed partner", body: "Toomny triggers release, never touches the deposit." },
      { title: "Verified identity", body: "ID checked before publishing, designed for local documents." },
      { title: "Human dispute review", body: "Based on the exchanges and deliverables kept on the platform." },
      { title: "Auto-approval at 72 h", body: "An inactive client does not block a provider's income." },
    ],
    pricingKicker: "Pricing",
    pricingTeaserTitle: "0% for buyers, 3% to 10% for providers",
    pricingTeaserLead: "The full detail — plans, a worked example, the Fiverr and Upwork comparison — lives on its own page. Here, we mostly show you the work.",
    pricingTeaserCta: "See pricing",
    pricingTitle: "Four tiers, no commitment",
    pricingLead: "No buyer commission. On the provider side, Toomny's share drops as you climb.",
    perMonth: "per month",
    commission: "commission",
    compareTitle: "What global platforms actually take",
    compareCols: ["Provider", "Fiverr", "Upwork", "Toomny"],
    ctaTitle: "Work together, grow together",
    ctaLead: "Join Toomny, whether you need a provider you can trust or you want to finally be paid properly.",
    ctaPrimary: "Find a provider",
    ctaSecondary: "Offer my services",
    faqTitle: "Frequently asked questions",
    legal: "Redesign proposal · does not replace the production home page",
    popular: "Popular",
  },
} as const;

export async function GlassyLanding({ locale }: { locale: Locale }) {
  const t = LABELS[locale];
  const landing = getLanding(locale);
  // Maquette : les cartes viennent d'un jeu de démonstration, pour que la
  // vitrine reste peuplée même sans base. Le catalogue réel reprend la main
  // dès qu'il y a des prestations (voir la note en fin de page).
  const providers = DEMO_PROVIDERS.slice(0, 4);

  const plans = landing.pricing.plans;

  return (
    <GlassyShell>
      <GlassyEffects />

      {/* Bandeau de contexte : on n'oublie pas qu'il s'agit d'une proposition. */}
      <div className="border-b border-white/10 bg-black/25 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-[11px] sm:px-6">
          <span className="font-semibold uppercase tracking-[0.18em] text-[#8bf0b6]">{t.badge}</span>
          <Link href="/" className="text-white/65 underline-offset-4 hover:text-white hover:underline">
            {t.badgeBack}
          </Link>
        </div>
      </div>

      {/* ── En-tête ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#04110b]/55 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/design-glassy" className="flex items-center text-white" aria-label="Toomny">
            <Logo size={28} />
          </Link>

          <nav className="hidden items-center gap-1 text-sm lg:flex">
            {landing.nav.links.map((l) => {
              // La rubrique « Tarifs » mène à la page dédiée de la maquette.
              const href = l.href === "/tarifs" ? "/design-glassy/tarifs" : l.href;
              return (
                <Link
                  key={l.href}
                  href={href}
                  className="rounded-full px-3.5 py-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {l.label}
                </Link>
              );
            })}
            <span className="mx-1 h-5 w-px bg-white/15" aria-hidden />
            <Link
              href={locale === "en" ? "/design-glassy" : "/en/design-glassy"}
              className="rounded-full px-3 py-2 text-xs font-bold uppercase tracking-wide text-white/70 hover:text-white"
              title={locale === "en" ? "Passer en français" : "Switch to English"}
            >
              {locale === "en" ? "FR" : "EN"}
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/auth"
              className="hidden rounded-full px-4 py-2 text-sm font-medium text-white/75 transition-colors hover:text-white sm:block"
            >
              {landing.nav.login}
            </Link>

            {/* Menu mobile : <details> natif, donc aucun JavaScript requis. */}
            <details className="g-menu lg:hidden">
              <summary
                aria-label={landing.nav.menu}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/8 text-white/80"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="M3 7h18M3 12h18M3 17h18" />
                </svg>
              </summary>
              <div className="g-menu-panel absolute right-3 top-[3.75rem] w-56 p-2">
                <ul className="text-sm">
                  {landing.nav.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href === "/tarifs" ? "/design-glassy/tarifs" : l.href}
                        className="block rounded-xl px-3 py-2.5 text-white/75 hover:bg-white/10 hover:text-white"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                  <li className="mt-1 border-t border-white/10 pt-1">
                    <Link
                      href="/auth"
                      className="block rounded-xl px-3 py-2.5 text-white/75 hover:bg-white/10 hover:text-white"
                    >
                      {landing.nav.login}
                    </Link>
                  </li>
                </ul>
              </div>
            </details>
            <Link href="/auth" className="g-btn g-btn-primary g-btn-sm">
              {landing.nav.signup}
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <section className="mx-auto grid max-w-6xl gap-12 px-4 pb-14 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[1.06fr_0.94fr] lg:items-center lg:gap-10">
          <div>
            <span className="g-eyebrow" data-g-reveal>
              <span className="h-1.5 w-1.5 rounded-full bg-[#8bf0b6]" aria-hidden />
              {t.heroKicker}
            </span>

            <h1 className="g-display mt-6 text-[2.4rem] font-extrabold sm:text-[3.2rem] lg:text-[3.7rem]" data-g-reveal>
              <span className="block text-white">{t.heroLine1}</span>
              <span className="g-gradient-text block">{t.heroLine2}</span>
            </h1>

            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-white/70" data-g-reveal>
              {t.heroLead}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3" data-g-reveal>
              <Link href="/services" className="g-btn g-btn-primary">
                {t.primary}
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link href="/comment-ca-marche" className="g-btn g-btn-ghost">
                {t.secondary}
              </Link>
            </div>

            <form
              method="GET"
              action="/services"
              data-g-reveal
              className="g-search glass glass-edge g-round-pill mt-8 flex w-full max-w-lg overflow-hidden p-1.5"
            >
              <input
                type="search"
                name="q"
                placeholder={t.search}
                aria-label={t.search}
                className="min-w-0 flex-1 bg-transparent px-4 text-sm text-white outline-none"
              />
              <button type="submit" className="g-btn g-btn-primary g-btn-sm shrink-0">
                {t.searchBtn}
              </button>
            </form>

            <div className="mt-7 flex flex-wrap items-center gap-3" data-g-reveal>
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/60">{t.rails}</span>
              {PAYMENT_METHODS.map((m) => (
                // eslint-disable-next-line @next/next/no-img-element -- SVG locaux 30px : next/image ne les optimise pas.
                <img
                  key={m.name}
                  src={m.src}
                  alt={m.name}
                  title={m.name}
                  width={30}
                  height={30}
                  className="rounded-full ring-1 ring-white/25 transition-transform duration-200 hover:scale-110"
                />
              ))}
            </div>
          </div>

          {/* Carte « verre » du hero : un vrai service, en volume. */}
          <div className="relative mx-auto w-full max-w-md lg:mx-0" data-g-reveal>
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-8 rounded-full opacity-60"
              style={{ background: "radial-gradient(circle, rgba(51,209,122,0.22), transparent 65%)" }}
            />

            <div className="glass glass-edge glass-solid g-round-lg relative p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="g-eyebrow g-accent-soft">
                  <span className="g-pulse h-1.5 w-1.5 rounded-full bg-[#8bf0b6]" aria-hidden />
                  {landing.visual.escrowBadge}
                </span>
                <span className="text-[11px] text-white/60">{landing.visual.step}</span>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-white/25">
                  <Image src={DEMO_PROVIDERS[0].avatar} alt="" fill sizes="44px" className="object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{DEMO_PROVIDERS[0].name}</p>
                  <p className="truncate text-[11px] text-white/70">
                    {landing.visual.serviceTitle} · Abidjan
                  </p>
                </div>
                <span className="ml-auto rounded-full border border-[#8bf0b6]/35 bg-[#8bf0b6]/12 px-2 py-0.5 text-[10px] font-bold text-[#9ff2c2]">
                  ✓ KYC
                </span>
              </div>

              <hr className="g-hairline my-4" />

              <dl className="space-y-3 text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-white/70">{landing.visual.amount}</dt>
                  <dd className="font-display font-bold text-white">{landing.visual.amountValue}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-white/70">{landing.visual.commission}</dt>
                  <dd className="font-display font-bold text-[#e0b566]">− {landing.visual.commissionValue}</dd>
                </div>
              </dl>

              <div className="mt-4 flex items-baseline justify-between gap-3 rounded-2xl border border-[#8bf0b6]/25 bg-[#8bf0b6]/10 px-4 py-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#9ff2c2]">
                  {landing.visual.net}
                </span>
                <span className="font-display text-lg font-extrabold text-white">{landing.visual.netValue}</span>
              </div>

              <div className="mt-4 flex items-center gap-2 text-[11px] text-white/65">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#8bf0b6]" aria-hidden />
                {landing.visual.payoutMeta}
              </div>
            </div>

            <div className="glass glass-edge g-float absolute -bottom-6 -left-4 hidden rounded-2xl px-4 py-3 sm:block">
              <p className="text-[10px] uppercase tracking-wider text-white/60">{landing.visual.verified}</p>
              <p className="mt-0.5 text-sm font-bold text-white">
                47 {locale === "en" ? "reviews" : "avis"} · 4.9 ★
              </p>
            </div>
          </div>
        </section>

        {/* ── Chiffres clés ──────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6">
          <dl className="glass glass-edge g-round-sm grid grid-cols-1 divide-y divide-white/10 overflow-hidden sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {t.stats.map((s) => (
              <div key={s.v} className="px-5 py-4" data-g-reveal>
                <dt className="sr-only">{s.v}</dt>
                <dd>
                  <span className="font-display text-2xl font-extrabold text-white">{s.k}</span>
                  <span className="ml-2 text-xs text-white/70">{s.v}</span>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── Catégories ─────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="flex flex-wrap items-end justify-between gap-4" data-g-reveal>
            <div>
              <span className="g-eyebrow">{t.categoriesKicker}</span>
              <h2 className="g-display mt-4 text-2xl font-extrabold text-white sm:text-3xl">
                {t.categoriesTitle}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/60">{t.categoriesLead}</p>
            </div>
            <Link
              href="/services"
              className="text-sm font-semibold text-[#9ff2c2] underline-offset-4 hover:underline"
            >
              {t.categoriesAll} →
            </Link>
          </div>

          <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {landing.categories.items.map((c) => {
              const meta = categoryMeta(c.slug);
              const Icon = meta?.icon;
              return (
                <li key={c.slug} data-g-reveal>
                  <Link
                    href={`/services?categorie=${c.slug}`}
                    className="glass glass-edge glass-specular glass-interactive g-round-md group flex h-full items-start gap-3 overflow-hidden p-4"
                  >
                    <span className="g-chip relative h-11 w-11 shrink-0 overflow-hidden !rounded-xl text-[#9ff2c2]">
                      {CATEGORY_COVER[c.slug] && (
                        <>
                          <Image
                            src={CATEGORY_COVER[c.slug]}
                            alt=""
                            fill
                            sizes="44px"
                            className="object-cover opacity-80"
                          />
                          <span
                            aria-hidden
                            className="absolute inset-0"
                            style={{ background: "linear-gradient(160deg, rgba(4,17,11,0.25), rgba(4,17,11,0.8))" }}
                          />
                        </>
                      )}
                      {Icon ? <Icon className="relative h-4 w-4" /> : null}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold leading-snug text-white">{c.name}</span>
                      <span className="mt-1 block text-xs leading-snug text-white/70">{c.items}</span>
                    </span>
                    <span
                      aria-hidden
                      className="ml-auto shrink-0 text-white/60 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-[#9ff2c2]"
                    >
                      →
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* ── Prestataires ───────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-24">
          <div className="flex flex-wrap items-end justify-between gap-4" data-g-reveal>
            <div>
              <span className="g-eyebrow">{t.providersKicker}</span>
              <h2 className="g-display mt-4 text-2xl font-extrabold text-white sm:text-3xl">{t.providersTitle}</h2>
              <p className="mt-2 max-w-xl text-sm text-white/60">{t.providersLead}</p>
            </div>
            <Link href="/design-glassy/prestataires" className="text-sm font-semibold text-[#9ff2c2] underline-offset-4 hover:underline">
              {t.providersAll} →
            </Link>
          </div>

          <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {providers.map((p) => (
              <li key={p.id} data-g-reveal>
                <GlassProviderCard provider={p} />
              </li>
            ))}
          </ul>
        </section>

        {/* ── Métiers : texte + mosaïque de portraits + cartes ──────────── */}
        <TradeSections labels={t.trades} />

        {/* ── Témoignages ────────────────────────────────────────────────── */}
        <Testimonials labels={t.trades.testimonials} items={[...t.testimonials]} />

        {/* ── Fonctionnement ─────────────────────────────────────────────── */}
        <section id="fonctionnement" className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-24">
          <div data-g-reveal>
            <span className="g-eyebrow">{t.howKicker}</span>
            <h2 className="g-display mt-4 text-2xl font-extrabold text-white sm:text-3xl">{t.howTitle}</h2>
          </div>

          <ol className="relative mt-8 grid gap-4 md:grid-cols-3">
            {t.steps.map((s) => (
              <li key={s.n} className="glass glass-edge glass-specular p-5" data-g-reveal>
                <div className="flex items-center justify-between">
                  <span className="font-display text-3xl font-extrabold text-white/20">{s.n}</span>
                  <span className="h-2 w-2 rounded-full bg-[#8bf0b6]" aria-hidden />
                </div>
                <h3 className="mt-4 text-base font-bold text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Sécurité ───────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-24">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div data-g-reveal className="lg:sticky lg:top-24">
              <span className="g-eyebrow">{t.securityKicker}</span>
              <h2 className="g-display mt-4 text-2xl font-extrabold text-white sm:text-3xl">{t.securityTitle}</h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/60">{t.securityLead}</p>
              <div className="mt-6 flex items-center gap-3">
                <span className="g-chip h-12 w-12 text-[#e0b566]">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </span>
                <p className="text-xs leading-snug text-white/65">
                  {locale === "en"
                    ? "Funds held by a licensed partner, released on your approval."
                    : "Fonds conservés chez un partenaire agréé, libérés sur votre validation."}
                </p>
              </div>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2">
              {t.guarantees.map((g) => (
                <li key={g.title} className="glass glass-edge glass-specular glass-interactive p-5" data-g-reveal>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#8bf0b6]/40 bg-[#8bf0b6]/12 text-xs font-bold text-[#9ff2c2]">
                    ✓
                  </span>
                  <h3 className="mt-3 text-sm font-bold text-white">{g.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-white/60">{g.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── FAQ ────────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6 sm:pb-24">
          <h2 className="g-display text-2xl font-extrabold text-white sm:text-3xl" data-g-reveal>
            {t.faqTitle}
          </h2>
          <div className="mt-6 space-y-2">
            {landing.faq.items.slice(0, 6).map((item) => (
              <details key={item.q} className="g-faq glass glass-edge group px-5 py-4" data-g-reveal>
                <summary className="flex items-center justify-between gap-4 text-sm font-semibold text-white">
                  {item.q}
                  <span className="g-faq-plus shrink-0 text-[#8bf0b6]" aria-hidden>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 max-w-[62ch] text-xs leading-relaxed text-white/60">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ── Renvoi tarifs : la landing vend, la page tarifs chiffre ────── */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
          <div className="glass glass-edge g-round-lg flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6" data-g-reveal>
            <div className="min-w-0">
              <span className="g-eyebrow">{t.pricingKicker}</span>
              <h2 className="g-display mt-3 text-xl font-extrabold text-white sm:text-2xl">
                {t.pricingTeaserTitle}
              </h2>
              <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-white/65 sm:text-sm">
                {t.pricingTeaserLead}
              </p>
            </div>
            <Link href="/design-glassy/tarifs" className="g-btn g-btn-primary g-btn-sm shrink-0">
              {t.pricingTeaserCta}
            </Link>
          </div>
        </section>

        {/* ── Renvoi vers les maquettes de tableaux de bord ──────────────── */}
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-24">
          <div className="glass glass-edge glass-solid g-round-xl relative overflow-hidden p-6 sm:p-8" data-g-reveal>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{ background: "radial-gradient(60% 80% at 100% 0%, rgba(51,209,122,0.3), transparent 70%)" }}
            />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1">
                <span className="g-eyebrow">{t.dashboardsKicker}</span>
                <h2 className="g-display mt-4 text-xl font-extrabold text-white sm:text-2xl">
                  {t.dashboardsTitle}
                </h2>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/65">{t.dashboardsLead}</p>
              </div>
              <ul className="grid flex-1 gap-2 sm:grid-cols-3 lg:max-w-md">
                {t.dashboardRoles.map((r) => (
                  <li key={r.label}>
                    <Link
                      href={`/design-glassy/dashboards?role=${r.key}`}
                      className="glass glass-edge glass-specular glass-interactive g-round-sm flex h-full flex-col justify-between gap-2 p-3"
                    >
                      <span className="text-xs font-bold text-white">{r.label}</span>
                      <span className="text-[10px] leading-snug text-white/60">{r.hint}</span>
                      <span aria-hidden className="text-[#9ff2c2]">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── Appel final ────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-24">
          <div className="glass glass-edge glass-solid g-round-xl relative overflow-hidden px-6 py-14 text-center sm:px-14 sm:py-20" data-g-reveal>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-45"
              style={{
                background:
                  "radial-gradient(60% 70% at 50% 0%, rgba(51,209,122,0.35), transparent 70%), radial-gradient(50% 60% at 100% 100%, rgba(210,154,56,0.25), transparent 70%)",
              }}
            />
            <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 text-white/[0.05]">
              {BRAND_MARK}
            </div>
            <div className="relative">
              <h2 className="g-display mx-auto max-w-2xl text-2xl font-extrabold text-white sm:text-4xl">
                {t.ctaTitle}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">
                {t.ctaLead}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/services" className="g-btn g-btn-primary">
                  {t.ctaPrimary}
                </Link>
                <Link href="/auth?role=provider" className="g-btn g-btn-ghost">
                  {t.ctaSecondary}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Pied de page ─────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
            <div>
              <span className="inline-flex text-white">
                <Logo size={26} />
              </span>
              <p className="mt-3 max-w-xs text-xs leading-relaxed text-white/65">{landing.footer.blurb}</p>
              <p className="mt-3 text-xs font-semibold text-[#9ff2c2]">{landing.footer.tagline}</p>
            </div>
            {landing.footer.columns.slice(0, 3).map((col) => (
              <div key={col.title}>
                <p className="text-xs font-bold uppercase tracking-wider text-white/80">{col.title}</p>
                <ul className="mt-3 space-y-2 text-xs">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <Link href={href} className="text-white/65 transition-colors hover:text-white">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-[11px] text-white/60">
            <p>© {new Date().getFullYear()} Toomny</p>
            <p>{t.legal}</p>
          </div>
        </div>
      </footer>
    </GlassyShell>
  );
}
