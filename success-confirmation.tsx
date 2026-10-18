"use client";

import { useEffect } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import type { Locale } from "@/i18n/dictionaries";

type Props = {
  orderId: string;
  reference: string;
  amount: number | string;
  currency: string;
  serviceName: string;
  locale: Locale;
};

export function SuccessConfirmation({
  orderId,
  reference,
  amount,
  currency,
  serviceName,
  locale,
}: Props) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const w = window as unknown as {
        gtag?: (...args: unknown[]) => void;
        dataLayer?: unknown[];
      };

      if (typeof w.gtag === "function") {
        const divisor = currency === "XOF" ? 1 : 100;
        const amountInCurrency = Number(amount) / divisor;

        w.gtag("event", "purchase", {
          transaction_id: orderId,
          affiliation: "toomny_marketplace",
          value: amountInCurrency,
          currency: currency,
          items: [
            {
              item_id: orderId,
              item_name: serviceName,
              price: amountInCurrency,
              quantity: 1,
              currency: currency,
            },
          ],
        });

        console.info("[conversion] purchase event envoyé à Google Ads", {
          transaction_id: orderId,
          value: amountInCurrency,
          currency: currency,
        });
      }
    }
  }, [orderId, reference, amount, currency, serviceName]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-green-400 rounded-full animate-pulse opacity-50" />
            <svg
              className="w-20 h-20 text-green-500 relative"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Paiement confirmé !
        </h1>

        <p className="text-gray-600 text-lg mb-8">
          Votre commande a été payée avec succès.
        </p>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 mb-8 border border-blue-100">
          <div className="text-left space-y-4">
            <div>
              <p className="text-sm text-gray-600 uppercase tracking-wide">
                Référence
              </p>
              <p className="text-lg font-mono font-bold text-gray-900">
                {reference}
              </p>
            </div>

            <div className="border-t border-blue-200 pt-4">
              <p className="text-sm text-gray-600 uppercase tracking-wide">
                Service
              </p>
              <p className="text-base font-medium text-gray-900 line-clamp-2">
                {serviceName}
              </p>
            </div>

            <div className="border-t border-blue-200 pt-4">
              <p className="text-sm text-gray-600 uppercase tracking-wide">
                Montant payé
              </p>
              <p className="text-2xl font-bold text-green-600">
                {formatMoney(BigInt(amount), currency, locale)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <p className="text-sm text-blue-900">
            ℹ️ Un email de confirmation a été envoyé à votre adresse. Vous pouvez suivre l'avancement de votre commande dans votre tableau de bord.
          </p>
        </div>

        <Link
          href={`/orders/${orderId}`}
          className="w-full inline-block bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          Voir ma commande →
        </Link>

        <Link
          href="/orders"
          className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium text-sm"
        >
          Retour à mes commandes
        </Link>
      </div>
    </div>
  );
}
