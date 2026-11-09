"use client";

import Link from "next/link";
import { useRef, type PointerEvent } from "react";

export type TierPlan = {
  name: string;
  price: string;
  priceNote: string;
  commission: string;
  badge: string | null;
  features: string[];
  cta: string;
  href: string;
};

export type TierCopy = {
  step: string;
  tagline: string;
  feeLine: string;
};

function TierCard({
  plan,
  copy,
  level,
  index,
  levelWord,
}: {
  plan: TierPlan;
  copy: TierCopy;
  level: number;
  index: number;
  levelWord: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isFree = plan.price === "Gratuit" || plan.price === "Free";
  const isTop = index === 3;

  // Inclinaison vers le pointeur, uniquement sur les écrans à souris et assez larges.
  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const card = cardRef.current;
    if (!card || !window.matchMedia("(hover: hover) and (min-width: 901px)").matches) return;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    card.style.setProperty("--ry", `${((px - 0.5) * 18).toFixed(2)}deg`);
    card.style.setProperty("--rx", `${((0.5 - py) * 14).toFixed(2)}deg`);
    card.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
    card.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
  }

  function onPointerLeave() {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
  }

  return (
    <div className={`tier-slot tier-${index + 1}`}>
      <article
        ref={cardRef}
        className="tier-card"
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        <div className="tier-glare" aria-hidden />
        {isTop && <div className="tier-sheen" aria-hidden />}
        {plan.badge && <span className="tier-badge">{plan.badge}</span>}
        <div className="tier-layer">
          <span className="tier-no">{`${levelWord} ${level}`}</span>
          <p className="tier-plan">{plan.name}</p>
          <p className="tier-tag">{copy.tagline}</p>
          <div className={`tier-price${isFree ? " is-free" : ""}`}>
            {plan.price}
            {plan.priceNote && <small>{plan.priceNote}</small>}
          </div>
          <hr className="tier-rule" />
          <ul className="tier-feat">
            {plan.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <p className="tier-fee">{copy.feeLine}</p>
          <Link href={plan.href} className="tier-cta">
            {plan.cta}
          </Link>
        </div>
      </article>
    </div>
  );
}

export function TierStaircase({
  plans,
  tiers,
  levelWord,
}: {
  plans: TierPlan[];
  tiers: TierCopy[];
  levelWord: string;
}) {
  return (
    <div className="tier-panel">
      <nav className="tier-rail" aria-label={levelWord}>
        {plans.map((plan, i) => (
          <div key={plan.name} className={`tier-step tier-${i + 1}`}>
            <b>{tiers[i].step}</b>
            {`${levelWord} ${i + 1} · ${plan.name}`}
          </div>
        ))}
      </nav>
      <div className="tier-scene">
        {plans.map((plan, i) => (
          <TierCard
            key={plan.name}
            plan={plan}
            copy={tiers[i]}
            level={i + 1}
            index={i}
            levelWord={levelWord}
          />
        ))}
      </div>
    </div>
  );
}
