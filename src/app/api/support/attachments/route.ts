import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { consumeRateLimit } from "@/lib/rate-limit";
import { imageMimeFromBytes } from "@/lib/request-security";
import { storeAttachment } from "@/lib/support-attachments-server";
import {
  ALLOWED_ATTACHMENT_MIME,
  ATTACHMENTS_PER_MESSAGE,
  validateAttachment,
  type AttachmentMime,
} from "@/lib/support-attachments";
import { UUID_RE } from "@/lib/orders";

const UPLOADS_PER_HOUR = 60;
const HOUR_SECONDS = 60 * 60;

/**
 * Envoi d'une capture d'écran pour une demande. L'image reste en attente jusqu'à
 * l'envoi du message qui la contient. Admin : toute demande ouverte. Demandeur :
 * uniquement les siennes. Le type est vérifié sur les octets, pas sur le nom.
 */
export async function POST(request: Request): Promise<Response> {
  const user = await getCurrentUser();
  if (!user || !user.emailConfirmed) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const allowed = await consumeRateLimit(`support:upload:${user.id}`, UPLOADS_PER_HOUR, HOUR_SECONDS);
  if (!allowed) return NextResponse.json({ error: "Trop d'envois. Réessayez plus tard." }, { status: 429 });

  let requestId = "";
  let file: File | null = null;
  try {
    const form = await request.formData();
    requestId = String(form.get("requestId") ?? "");
    const f = form.get("file");
    file = f instanceof File ? f : null;
  } catch {
    return NextResponse.json({ error: "Envoi invalide." }, { status: 400 });
  }
  if (!UUID_RE.test(requestId) || !file) {
    return NextResponse.json({ error: "Image manquante." }, { status: 400 });
  }

  const declared = validateAttachment({ bytes: file.size, mime: file.type || null });
  if ("error" in declared) return NextResponse.json({ error: declared.error }, { status: 400 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = imageMimeFromBytes(bytes);
  if (!detected || !(ALLOWED_ATTACHMENT_MIME as readonly string[]).includes(detected)) {
    return NextResponse.json({ error: "Format non accepté. Envoyez une image PNG, JPEG ou WebP." }, { status: 400 });
  }

  const db = createAdminClient();
  const { data: req } = await db
    .from("support_requests")
    .select("id, profile_id, status")
    .eq("id", requestId)
    .maybeSingle();
  if (!req || (user.role !== "admin" && req.profile_id !== user.id)) {
    return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
  }
  if (req.status === "closed") {
    return NextResponse.json({ error: "Cette demande est clôturée." }, { status: 409 });
  }

  const { count } = await db
    .from("support_attachments")
    .select("id", { count: "exact", head: true })
    .eq("request_id", requestId)
    .eq("uploader_id", user.id)
    .is("reply_id", null);
  if ((count ?? 0) >= ATTACHMENTS_PER_MESSAGE) {
    return NextResponse.json(
      { error: `Maximum ${ATTACHMENTS_PER_MESSAGE} images par message.` },
      { status: 400 },
    );
  }

  const stored = await storeAttachment(db, {
    requestId,
    uploaderId: user.id,
    bytes,
    mime: detected as AttachmentMime,
  });
  if ("error" in stored) return NextResponse.json({ error: stored.error }, { status: 500 });
  return NextResponse.json({ id: stored.id });
}
