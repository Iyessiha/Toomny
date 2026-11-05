import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCronAuthorized } from "@/lib/cron-auth";
import { purgeExpiredSupportText } from "@/lib/support-retention-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Efface le texte des demandes résolues depuis plus de 90 jours. Planifiée chaque jour (vercel.json). */
export async function GET(request: Request): Promise<Response> {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const purged = await purgeExpiredSupportText(createAdminClient());
  return NextResponse.json({ ok: true, purged });
}
