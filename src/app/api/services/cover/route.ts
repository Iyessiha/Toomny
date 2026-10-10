import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 3 * 1024 * 1024;

export async function POST(request: Request): Promise<Response> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let file: File;
  try {
    const form = await request.formData();
    const f = form.get("file");
    if (!(f instanceof File)) throw new Error("missing file");
    file = f;
  } catch {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Type non autorisé (jpeg, png, webp uniquement)" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Fichier trop volumineux (3 Mo max)" }, { status: 400 });
  }

  const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
  const path = `${user.id}/${randomUUID()}.${ext}`;

  const buffer = await file.arrayBuffer();
  const { error } = await supabase.storage
    .from("service-covers")
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (error) {
    console.error("[services/cover] upload:", error.message);
    return NextResponse.json({ error: "Erreur lors de l'envoi" }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("service-covers").getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
