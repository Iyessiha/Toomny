"use server";

import { getServicesByIds } from "@/lib/catalog";
import type { ServiceCard } from "@/lib/catalog";
import { UUID_RE } from "@/lib/orders";

export async function fetchWishlistServices(ids: string[]): Promise<ServiceCard[]> {
  const safe = ids.filter((id) => UUID_RE.test(id)).slice(0, 100);
  return getServicesByIds(safe);
}
