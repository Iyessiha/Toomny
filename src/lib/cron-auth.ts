import { timingSafeEqual } from "node:crypto";

/**
 * Vérifie l'appel d'une tâche planifiée Vercel : `Authorization: Bearer $CRON_SECRET`.
 * En production, sans secret configuré, tout est refusé.
 */
export function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") return false;
    return true;
  }
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;
  const provided = Buffer.from(header.slice("Bearer ".length));
  const expected = Buffer.from(secret);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}
