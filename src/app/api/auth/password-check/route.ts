import { NextResponse } from "next/server";
import { isLeakedPassword } from "@/lib/password-leak";
import { consumeRateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request-security";

const MAX_PER_HOUR = 30;
const HOUR_SECONDS = 60 * 60;

/** Dit si un mot de passe figure dans une fuite connue. Limité par IP : l'API externe n'est pas à brûler. */
export async function POST(request: Request): Promise<Response> {
  const allowed = await consumeRateLimit(`pwcheck:ip:${clientIp(request)}`, MAX_PER_HOUR, HOUR_SECONDS);
  if (!allowed) return NextResponse.json({ error: "Trop de tentatives." }, { status: 429 });

  const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
  const password = typeof body?.password === "string" ? body.password : "";
  if (password.length < 8 || password.length > 72) {
    return NextResponse.json({ error: "Mot de passe invalide." }, { status: 400 });
  }
  return NextResponse.json({ leaked: await isLeakedPassword(password) });
}
