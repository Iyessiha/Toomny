import { toMinor } from "@/lib/money";

/** Nombre maximum de suppléments par prestation. */
export const MAX_ADDONS_PER_SERVICE = 5;

export const ADDON_MIN_XOF = 1000;
export const ADDON_MAX_XOF = 1_000_000;

export type AddonInput = { title: string; description: string; priceRaw: string; extraDays: number };

export type ValidAddon = {
  title: string;
  description: string | null;
  priceMinor: bigint;
  extraDays: number;
};

export type AddonError = "title" | "description" | "price" | "days";

/** Valide un supplément saisi par le prestataire. Pure : pas d'accès à la base. */
export function validateAddon(input: AddonInput): { ok: true; value: ValidAddon } | { ok: false; error: AddonError } {
  const title = input.title.trim();
  if (!title || title.length > 80) return { ok: false, error: "title" };

  const description = input.description.trim();
  if (description.length > 300) return { ok: false, error: "description" };

  let priceMinor: bigint;
  try {
    priceMinor = toMinor(input.priceRaw.trim(), "XOF");
  } catch {
    return { ok: false, error: "price" };
  }
  if (priceMinor < BigInt(ADDON_MIN_XOF) || priceMinor > BigInt(ADDON_MAX_XOF)) {
    return { ok: false, error: "price" };
  }

  if (!Number.isInteger(input.extraDays) || input.extraDays < 0 || input.extraDays > 60) {
    return { ok: false, error: "days" };
  }

  return {
    ok: true,
    value: { title, description: description || null, priceMinor, extraDays: input.extraDays },
  };
}

/**
 * Total et délai d'une commande : le prix de base (prestation ou forfait) plus chaque
 * supplément choisi ; les délais supplémentaires s'ajoutent.
 */
export function orderTotals(
  basePriceMinor: bigint,
  baseDeliveryDays: number,
  addons: { price_minor: bigint | number | string; extra_delivery_days: number }[],
): { priceMinor: bigint; deliveryDays: number } {
  let priceMinor = basePriceMinor;
  let deliveryDays = baseDeliveryDays;
  for (const addon of addons) {
    priceMinor += BigInt(addon.price_minor);
    deliveryDays += addon.extra_delivery_days;
  }
  return { priceMinor, deliveryDays };
}
