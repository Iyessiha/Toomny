import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { consumeRateLimit } from "@/lib/rate-limit";
import { imageMimeFromBytes } from "@/lib/request-security";

const MAX_BYTES = 2 * 1024 * 1024;
const UPLOAD_MAX = 10;
const UPLOAD_WINDOW = 3600;

export async function POST(request: Request): Promise<Response> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const allowed = await consumeRateLimit(`upload:avatar:${user.id}`, UPLOAD_MAX, UPLOAD_WINDOW);
  if (!allowed) return NextResponse.json({ error: "Trop d'envois. Réessayez dans une heure." }, { status: 429 });

  let file: File;
  try {
    const form = await request.formData();
    const f = form.get("file");
    if (!(f instanceof File)) throw new Error("missing file");
    file = f;
  } catch {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Fichier trop volumineux (2 Mo max)" }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const detectedMime = imageMimeFromBytes(new Uint8Array(buffer));
  if (!detectedMime) {
    return NextResponse.json({ error: "Type non autorisé (jpeg, png, webp)" }, { status: 400 });
  }

  const ext = detectedMime === "image/jpeg" ? "jpg" : detectedMime.split("/")[1];
  const path = `${user.id}/${randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, buffer, { contentType: detectedMime, upsert: false });

  if (error) {
    console.error("[profile/avatar] upload:", error.message);
    return NextResponse.json({ error: "Erreur lors de l'envoi" }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
