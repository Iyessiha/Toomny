import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCronAuthorized } from "@/lib/cron-auth";
import { runBoostReminders } from "@/lib/boost-reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Relances de boost, deux fois par semaine (voir vercel.json). Protégée comme auto-release. */
export async function GET(request: Request): Promise<Response> {
  if (!isCronAuthorized(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const result = await runBoostReminders(createAdminClient());
  return NextResponse.json({ ok: true, ...result });
}
