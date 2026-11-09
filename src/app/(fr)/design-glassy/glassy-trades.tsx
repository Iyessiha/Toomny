import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Quote, Star } from "lucide-react";
import { avatarOf, type DemoProvider } from "./glassy-demo";

/* ────────────────────────────────────────────────────────────────────────────
   Sections « métier » de la maquette.

   Composition reprise de la référence (ComeUp) : un bloc de texte à gauche,
   une mosaïque de portraits à droite, puis deux ou trois cartes de prestations
   en dessous. La mosaïque donne le visage des gens derrière chaque métier,
   ce qu'aucune illustration abstraite ne fait.

   La mosaïque est en CSS pur (positions + rotation légère), sans librairie
   de mise en page. Elle est masquée sous 1024 px : sur mobile, les cartes
   suffisent et la page reste légère.
   ──────────────────────────────────────────────────────────────────────────── */

/** Positions de la mosaïque : trois portraits, en grand, légèrement inclinés. */
const MOSAIC = [
  { top: "1%", left: "14%", size: 132, rotate: -6, z: 2 },
  { top: "30%", left: "52%", size: 116, rotate: 6, z: 1 },
  { top: "46%", left: "2%", size: 122, rotate: -3, z: 3 },
];

export function PortraitMosaic({
  ids,
  label,
}: {
  ids: string[];
  label: string;
}) {
  return (
    <div
      className="relative hidden h-[330px] w-full min-w-[300px] max-w-[380px] shrink-0 lg:block"
      aria-label={label}
      role="img"
    >
      {/* Halo derrière la mosaïque : détache les portraits du fond. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(60% 60% at 50% 45%, rgba(51,209,122,0.22), transparent 70%)" }}
      />
      {MOSAIC.slice(0, 3).map((pos, i) => (
        <div
          key={`${ids[i] ?? i}-${i}`}
          className="absolute overflow-hidden rounded-2xl ring-1 ring-white/25"
          style={{
            top: pos.top,
            left: pos.left,
            width: pos.size,
            height: pos.size,
            zIndex: pos.z,
            transform: `rotate(${pos.rotate}deg)`,
            boxShadow: "0 18px 40px -18px rgba(0,0,0,0.9)",
          }}
        >
          <Image
            src={avatarOf(ids[i] ?? ids[0])}
            alt=""
            fill
            sizes="96px"
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}

type Row = { kicker: string; title: string; lead: string; cta: string };

export type TradesLabels = {
  p01: Row;
  p02: Row;
  p03: Row;
  p04: Row;
  testimonials: { kicker: string; title: string; lead: string };
};

/** Libellés des cartes : « À partir de », « 5 jours ». */
const CARD_LABELS = { from: "À partir de", days: "livré en" } as const;

type Card = {
  title: string;
  price: string;
  delivery: string;
  cover: string;
  face: string;
  slug: string;
  /** Cadrage de la couverture. */
  pos: string;
};

const CARDS: Record<string, Card[]> = {
  p01: [
    { title: "Identité visuelle complète", price: "150 000 FCFA", delivery: "5 jours", cover: "/images/glassy/design-graphique.jpg", face: "nadia", slug: "identite-visuelle", pos: "50% 35%" },
    { title: "Logo + charte graphique", price: "85 000 FCFA", delivery: "3 jours", cover: "/images/glassy/covers/design-logo.jpg", face: "awa", slug: "logo-charte", pos: "50% 50%" },
    { title: "Packaging, 5 références", price: "240 000 FCFA", delivery: "7 jours", cover: "/images/glassy/covers/design-packaging.jpg", face: "nadia", slug: "packaging", pos: "50% 50%" },
  ],
  p02: [
    { title: "Site vitrine responsive", price: "180 000 FCFA", delivery: "10 jours", cover: "/images/glassy/developpement-web.jpg", face: "koffi", slug: "site-vitrine", pos: "50% 45%" },
    { title: "Boutique en ligne complète", price: "320 000 FCFA", delivery: "15 jours", cover: "/images/glassy/covers/web-ecommerce.jpg", face: "koffi", slug: "boutique-en-ligne", pos: "50% 50%" },
    { title: "Application mobile", price: "450 000 FCFA", delivery: "25 jours", cover: "/images/glassy/covers/web-app.jpg", face: "ibrahima", slug: "application-mobile", pos: "50% 50%" },
  ],
  p03: [
    { title: "Calendrier éditorial, 4 mois", price: "120 000 FCFA", delivery: "30 jours", cover: "/images/glassy/covers/social-calendar.jpg", face: "mariam", slug: "calendrier-editorial", pos: "50% 50%" },
    { title: "Publicités Meta & TikTok", price: "180 000 FCFA", delivery: "30 jours", cover: "/images/glassy/covers/ads-analytics.jpg", face: "yann", slug: "publicites-meta", pos: "50% 50%" },
    { title: "Pack de 8 visuels animés", price: "95 000 FCFA", delivery: "6 jours", cover: "/images/glassy/community-management.jpg", face: "adjoua", slug: "visuels-animes", pos: "45% 45%" },
  ],
  p04: [
    { title: "Montage de 4 réels", price: "80 000 FCFA", delivery: "5 jours", cover: "/images/glassy/covers/video-reels.jpg", face: "fatou", slug: "montage-reels", pos: "50% 50%" },
    { title: "Pack de 10 photos produit", price: "60 000 FCFA", delivery: "4 jours", cover: "/images/glassy/covers/photo-product.jpg", face: "seydou", slug: "photos-produit", pos: "50% 50%" },
    { title: "Film publicitaire 30 s", price: "210 000 FCFA", delivery: "12 jours", cover: "/images/glassy/montage-video.jpg", face: "fatou", slug: "film-publicitaire", pos: "60% 40%" },
  ],
};

function TradeCard({ card, from }: { card: Card; from: string }) {
  return (
    <Link
      href={`/design-glassy/services/${card.slug}`}
      className="glass glass-edge glass-specular glass-interactive g-round-sm group flex min-w-0 flex-1 flex-col overflow-hidden"
    >
      {/* Couverture au format 16:10, identique pour toutes les cartes : les
          titres s'alignent d'une carte à l'autre, la grille reste droite. */}
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <Image
          src={card.cover}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, 240px"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          style={{ objectPosition: card.pos }}
        />
        <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(4,17,11,0.05), rgba(4,17,11,0.8))" }} />
        <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/45 px-1.5 py-0.5 text-[9px] font-semibold text-white/90 backdrop-blur-md">
          <span className="relative h-3.5 w-3.5 overflow-hidden rounded-full ring-1 ring-white/30">
            <Image src={avatarOf(card.face)} alt="" fill sizes="14px" className="object-cover" />
          </span>
          {from} {card.price}
        </span>
      </div>

      {/* Hauteur de texte fixe (deux lignes de titre) : toutes les cartes
          d'une même rangée font exactement la même hauteur. */}
      <div className="flex flex-1 flex-col justify-between gap-1 p-2.5">
        <p className="line-clamp-2 min-h-[2.2em] text-[11px] font-semibold leading-snug text-white">
          {card.title}
        </p>
        <p className="text-[9px] text-white/60">
          {CARD_LABELS.days} {card.delivery}
        </p>
      </div>
    </Link>
  );
}

function TradeRow({
  labels,
  ids,
  cards,
}: {
  labels: Row;
  ids: string[];
  cards: Card[];
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
      <div className="glass glass-edge g-round-lg overflow-hidden p-5 sm:p-7" data-g-reveal>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-8">
          <div className="min-w-0 flex-1">
            <span className="g-eyebrow">{labels.kicker}</span>
            <h2 className="g-display mt-3 text-xl font-extrabold text-white sm:text-2xl">{labels.title}</h2>
            <p className="mt-2 max-w-md text-xs leading-relaxed text-white/65 sm:text-sm">{labels.lead}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#9ff2c2]">
              {labels.cta}
              <ArrowRight width={12} height={12} aria-hidden />
            </span>
          </div>
          <PortraitMosaic ids={ids} label={labels.title} />
        </div>

        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
          {cards.map((c) => (
            <TradeCard key={c.title} card={c} from={CARD_LABELS.from} />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Témoignages : quatre cartes en verre, note et métier. */
export function Testimonials({
  labels,
  items,
}: {
  labels: TradesLabels["testimonials"];
  items: { name: string; role: string; body: string; avatar: string }[];
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
      <div className="flex flex-wrap items-end justify-between gap-4" data-g-reveal>
        <div>
          <span className="g-eyebrow">{labels.kicker}</span>
          <h2 className="g-display mt-3 text-xl font-extrabold text-white sm:text-2xl">{labels.title}</h2>
          <p className="mt-2 max-w-xl text-xs leading-relaxed text-white/65 sm:text-sm">{labels.lead}</p>
        </div>
      </div>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((t) => (
          <li key={t.name} className="glass glass-edge glass-specular g-round-md flex flex-col p-4" data-g-reveal>
            <Quote width={14} height={14} className="text-[#8bf0b6]/60" aria-hidden />
            <p className="mt-2 flex-1 text-[11px] leading-relaxed text-white/75">{t.body}</p>
            <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-2.5">
              <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full ring-1 ring-white/25">
                <Image src={t.avatar} alt="" fill sizes="28px" className="object-cover" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[11px] font-bold text-white">{t.name}</span>
                <span className="block truncate text-[9px] text-white/55">{t.role}</span>
              </span>
              <span className="ml-auto flex items-center gap-0.5" aria-label="5 étoiles sur 5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} width={8} height={8} className="text-[#e0b566]" fill="currentColor" strokeWidth={0} />
                ))}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TradeSections({ labels }: { labels: TradesLabels }) {
  return (
    <>
      <TradeRow labels={labels.p01} ids={["nadia", "awa", "seydou"]} cards={CARDS.p01} />
      <TradeRow labels={labels.p02} ids={["koffi", "ibrahima", "brahim"]} cards={CARDS.p02} />
      <TradeRow labels={labels.p03} ids={["mariam", "yann", "adjoua"]} cards={CARDS.p03} />
      <TradeRow labels={labels.p04} ids={["fatou", "seydou", "estelle"]} cards={CARDS.p04} />
    </>
  );
}

/** Rangée de prestataires « en vedette » pour la fin de page. */
export function ProviderStrip({ providers, label }: { providers: DemoProvider[]; label: string }) {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">{label}</p>
      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
        {providers.map((p) => (
          <li key={p.id}>
            <div className="glass glass-edge glass-specular g-round-sm flex flex-col items-center p-3 text-center">
              <span className="relative h-11 w-11 overflow-hidden rounded-full ring-1 ring-white/25">
                <Image src={p.avatar} alt="" fill sizes="44px" className="object-cover" />
              </span>
              <span className="mt-2 block w-full truncate text-[10px] font-bold text-white">{p.name}</span>
              <span className="mt-0.5 flex items-center gap-1 text-[9px] text-white/55">
                <Star width={8} height={8} className="text-[#e0b566]" fill="currentColor" strokeWidth={0} aria-hidden />
                {p.rating}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
