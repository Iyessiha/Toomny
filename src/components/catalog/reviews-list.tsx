"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/dictionaries";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  authorName: string;
};

type Breakdown = { star: number; count: number };

const INITIAL = 6;

export function ReviewsList({
  reviews,
  avg,
  breakdown,
  maxBreakdown,
  reviewsCountLabel,
  locale,
}: {
  reviews: Review[];
  avg: number;
  breakdown: Breakdown[];
  maxBreakdown: number;
  reviewsCountLabel: string;
  locale: Locale;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? reviews : reviews.slice(0, INITIAL);
  const remaining = reviews.length - INITIAL;

  return (
    <div className="space-y-6">
      {/* Rating summary + breakdown */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex flex-wrap items-center gap-6">
          <div className="text-center">
            <p className="text-5xl font-bold">{avg.toFixed(1)}</p>
            <p className="mt-1 text-lg text-amber-400">
              {"★".repeat(Math.min(Math.round(avg), 5))}
              {"☆".repeat(Math.max(0, 5 - Math.round(avg)))}
            </p>
            <p className="mt-1 text-xs text-[var(--subtle)]">
              {reviews.length} {reviewsCountLabel}
            </p>
          </div>
          <div className="min-w-[160px] flex-1 space-y-2">
            {breakdown.map(({ star, count }) => (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-4 text-right text-[var(--subtle)]">{star}</span>
                <span className="text-amber-400">★</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--border)]">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all"
                    style={{ width: `${(count / maxBreakdown) * 100}%` }}
                  />
                </div>
                <span className="w-4 text-[var(--subtle)]">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Individual reviews */}
      <div className="divide-y divide-[var(--border)]">
        {visible.map((review) => (
          <div key={review.id} className="py-5 first:pt-0">
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-100)] text-xs font-bold text-[var(--color-brand-700)]"
              >
                {review.authorName.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">{review.authorName}</span>
                  <span className="text-xs text-amber-400">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </span>
                  {review.created_at && (
                    <span className="text-xs text-[var(--subtle)]">
                      {new Date(review.created_at).toLocaleDateString(
                        locale === "fr" ? "fr-FR" : "en-US",
                        { year: "numeric", month: "short", day: "numeric" }
                      )}
                    </span>
                  )}
                </div>
                {review.comment ? (
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--subtle)]">
                    {review.comment}
                  </p>
                ) : (
                  <p className="mt-1.5 text-sm italic text-[var(--subtle)]">
                    {locale === "en" ? "No comment." : "Pas de commentaire."}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show more / Show less */}
      {reviews.length > INITIAL && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="w-full rounded-full border border-[var(--border)] py-2.5 text-sm font-semibold transition-colors hover:border-[var(--color-brand-300)] hover:text-[var(--color-brand-600)]"
        >
          {showAll
            ? locale === "en"
              ? "Show less"
              : "Afficher moins"
            : locale === "en"
              ? `See all ${reviews.length} reviews`
              : `Voir les ${remaining} avis suivants`}
        </button>
      )}
    </div>
  );
}
