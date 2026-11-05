import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCronAuthorized } from "@/lib/cron-auth";
import { purgeOrphanAttachments } from "@/lib/support-attachments-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Nettoyage quotidien : supprime les captures envoyées mais jamais rattachées à
 * un message. Les captures des demandes résolues sont déjà supprimées au moment
 * de la résolution (voir les actions de support).
 */
export async function GET(request: Request): Promise<Response> {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const removed = await purgeOrphanAttachments(createAdminClient());
  return NextResponse.json({ ok: true, removed });
}
