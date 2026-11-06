import Image from "next/image";
import Link from "next/link";
import { Star, MapPin, Clock, ShieldCheck, Sparkles, ArrowRight, Heart } from "lucide-react";
import type { DemoProvider, DemoService } from "./glassy-demo";

/* ────────────────────────────────────────────────────────────────────────────
   Cartes de la maquette « Aurora Glass ».

   Trois formats, tous en verre :
     · GlassServiceCard   — grille du catalogue (photo + prix + délai)
     · GlassListCard      — résultat de recherche (photo à gauche, texte à droite)
     · GlassProviderCard  — prestataire (portrait, note, compétences)

   Règles communes : un seul `backdrop-filter` par carte, l'arête lumineuse
   (.glass-edge) et le reflet au survol (.glass-specular) viennent de glassy.css.
   Le texte n'est jamais posé directement sur la photo sans voile.
   ──────────────────────────────────────────────────────────────────────────── */

function Stars({ value, size = 11 }: { value: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          width={size}
          height={size}
          className={i < Math.round(value) ? "text-[#e0b566]" : "text-white/20"}
          fill="currentColor"
          strokeWidth={0}
        />
      ))}
    </span>
  );
}

/** Pastille « prestataire vérifié ». */
function VerifiedChip() {
  return (
    <span
      title="Identité vérifiée"
      className="inline-flex items-center gap-1 rounded-full border border-[#8bf0b6]/35 bg-[#8bf0b6]/12 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#9ff2c2]"
    >
      <ShieldCheck width={9} height={9} aria-hidden />
      KYC
    </span>
  );
}

/* ── 1. Carte catalogue ───────────────────────────────────────────────────── */

export function GlassServiceCard({
  service,
  compact = false,
}: {
  service: DemoService;
  compact?: boolean;
}) {
  return (
    <Link
      href={`/design-glassy/services/${service.id}`}
      className="glass glass-edge glass-specular glass-interactive g-round-md group flex h-full flex-col overflow-hidden"
    >
      <div className="relative h-36 w-full overflow-hidden">
        {service.cover ? (
          <Image
            src={service.cover}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
          />
        ) : (
          <div className="h-full w-full bg-white/5" />
        )}
        {/* Voile : garantit la lisibilité du titre même sur une photo claire. */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(4,17,11,0.15) 0%, rgba(4,17,11,0.55) 55%, rgba(4,17,11,0.92) 100%)" }}
        />

        <span className="absolute left-3 top-3 rounded-full border border-white/25 bg-black/35 px-2.5 py-0.5 text-[10px] font-semibold text-white/90 backdrop-blur-md">
          {service.category}
        </span>
        {service.boosted && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-[#e0b566]/45 bg-[#e0b566]/20 px-2 py-0.5 text-[10px] font-bold text-[#f4dca6] backdrop-blur-md">
            <Sparkles width={9} height={9} aria-hidden />
            Vedette
          </span>
        )}

        {!compact && (
          <p className="absolute bottom-3 left-3 right-3 line-clamp-2 text-sm font-semibold leading-snug text-white">
            {service.title}
          </p>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-3.5">
        <div className="flex items-center gap-2">
          <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full ring-1 ring-white/25">
            <Image src={service.provider.avatar} alt="" fill sizes="24px" className="object-cover" />
          </div>
          <span className="min-w-0 truncate text-xs font-semibold text-white/85">
            {service.provider.name}
          </span>
          <span className="shrink-0 text-[10px]" aria-hidden>
            {service.provider.flag}
          </span>
          <span className="ml-auto shrink-0">
            <VerifiedChip />
          </span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2">
          <div>
            <p className="text-[9px] uppercase tracking-wider text-white/55">À partir de</p>
            <p className="font-display text-sm font-extrabold text-white">{service.price}</p>
          </div>
          <span className="flex shrink-0 items-center gap-1 text-[10px] text-white/65">
            <Clock width={10} height={10} aria-hidden />
            {service.delivery}
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ── 2. Carte de résultat de recherche (horizontale) ──────────────────────── */

export function GlassListCard({ service }: { service: DemoService }) {
  return (
    <Link
      href={`/design-glassy/services/${service.id}`}
      className="glass glass-edge glass-specular glass-interactive g-round-md group flex overflow-hidden"
    >
      <div className="relative w-28 shrink-0 sm:w-40">
        {service.cover && (
          <Image src={service.cover} alt="" fill sizes="160px" className="object-cover" />
        )}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-transparent to-[#04110b]/70" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2 p-3.5 sm:flex-row sm:items-center sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-[#9ff2c2]">
              {service.category}
            </span>
            {service.boosted && <Sparkles width={10} height={10} className="text-[#e0b566]" aria-hidden />}
          </div>
          <p className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-white">
            {service.title}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-white/65">
            <div className="relative h-4 w-4 shrink-0 overflow-hidden rounded-full ring-1 ring-white/20">
              <Image src={service.provider.avatar} alt="" fill sizes="16px" className="object-cover" />
            </div>
            <span className="truncate">{service.provider.name}</span>
            <Stars value={service.provider.rating} size={9} />
            <span className="text-white/50">{service.provider.rating}</span>
            <span className="hidden text-white/40 sm:inline">({service.provider.reviews})</span>
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-3 border-t border-white/10 pt-2 sm:w-28 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
          <p className="font-display text-base font-extrabold text-white">{service.price}</p>
          <p className="flex items-center gap-1 text-[10px] text-white/60">
            <Clock width={10} height={10} aria-hidden />
            {service.delivery}
          </p>
        </div>
      </div>
    </Link>
  );
}

/* ── 3. Carte prestataire ─────────────────────────────────────────────────── */

export function GlassProviderCard({ provider }: { provider: DemoProvider }) {
  return (
    <Link
      href={`/design-glassy/prestataires/${provider.id}`}
      className="glass glass-edge glass-specular glass-interactive g-round-md group relative flex flex-col items-center overflow-hidden p-5 text-center"
    >
      {provider.online && (
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-[#8bf0b6]/30 bg-[#8bf0b6]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#9ff2c2]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#8bf0b6]" aria-hidden />
          En ligne
        </span>
      )}
      {/* Maquette : le favori est décoratif, la vraie carte catalogue a son
          bouton client (voir src/components/catalog/wishlist-button.tsx). */}
      <span aria-hidden className="absolute right-3 top-3 text-white/35">
        <Heart width={15} height={15} />
      </span>

      <div className="relative mt-3 h-16 w-16 overflow-hidden rounded-full ring-2 ring-white/20">
        <Image src={provider.avatar} alt="" fill sizes="64px" className="object-cover" />
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-sm font-bold text-white">
        {provider.name}
        <ShieldCheck width={12} height={12} className="text-[#8bf0b6]" aria-hidden />
      </p>
      <p className="mt-0.5 line-clamp-1 text-[11px] text-white/65">{provider.headline}</p>

      <p className="mt-1.5 flex items-center gap-1 text-[10px] text-white/55">
        <MapPin width={9} height={9} aria-hidden />
        {provider.country}
      </p>

      <div className="mt-2.5 flex items-center gap-1.5">
        <Stars value={provider.rating} />
        <span className="text-[11px] font-semibold text-white">{provider.rating}</span>
        <span className="text-[10px] text-white/50">({provider.reviews})</span>
      </div>

      <ul className="mt-3 flex flex-wrap justify-center gap-1">
        {provider.skills.map((s) => (
          <li
            key={s}
            className="rounded-full border border-white/12 bg-white/6 px-2 py-0.5 text-[10px] text-white/70"
          >
            {s}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex w-full items-center justify-between gap-2 border-t border-white/10 pt-3 text-[10px] text-white/55">
        <span>
          <b className="text-white">{provider.completed}</b> commandes
        </span>
        <span className="flex items-center gap-1 font-semibold text-[#9ff2c2]">
          Voir le profil
          <ArrowRight width={11} height={11} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
