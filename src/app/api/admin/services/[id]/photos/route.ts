import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { imageMimeFromBytes } from "@/lib/request-security";
import { recordAdminAction } from "@/lib/admin-audit";

const MAX_BYTES = 3 * 1024 * 1024;
const GALLERY_MAX = 4;
const BUCKET = "service-covers";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Modification des photos d'une prestation par l'admin.
 * action = "cover" (remplace la couverture) | "gallery-add" | "gallery-remove" (par url).
 * Les envois passent par le client admin (service role) et se rangent dans le dossier du prestataire.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "invalid_id" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const db = createAdminClient();
  const { data: me } = await db.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { data: service } = await db
    .from("services")
    .select("id, provider_id, cover_url, gallery_urls")
    .eq("id", id)
    .maybeSingle();
  if (!service) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const form = await request.formData();
  const action = String(form.get("action") ?? "");
  const gallery = (service.gallery_urls ?? []) as string[];

  let update: { cover_url?: string; gallery_urls?: string[] };
  let result: Record<string, unknown>;

  if (action === "cover" || action === "gallery-add") {
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "missing_file" }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "too_large" }, { status: 400 });
    if (action === "gallery-add" && gallery.length >= GALLERY_MAX) {
      return NextResponse.json({ error: "gallery_full" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const mime = imageMimeFromBytes(new Uint8Array(buffer));
    if (!mime) return NextResponse.json({ error: "bad_type" }, { status: 400 });

    const ext = mime === "image/jpeg" ? "jpg" : mime.split("/")[1];
    const path = `${service.provider_id}/${randomUUID()}.${ext}`;
    const { error: uploadError } = await db.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: mime, upsert: false });
    if (uploadError) {
      console.error("[admin/services/photos] upload:", uploadError.message);
      return NextResponse.json({ error: "upload_failed" }, { status: 500 });
    }
    const url = db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

    if (action === "cover") {
      update = { cover_url: url };
      result = { coverUrl: url };
    } else {
      update = { gallery_urls: [...gallery, url] };
      result = { galleryUrls: update.gallery_urls };
    }
  } else if (action === "gallery-remove") {
    const url = String(form.get("url") ?? "");
    if (!gallery.includes(url)) return NextResponse.json({ error: "not_in_gallery" }, { status: 400 });
    update = { gallery_urls: gallery.filter((u) => u !== url) };
    result = { galleryUrls: update.gallery_urls };
  } else {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }

  const { error } = await db
    .from("services")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    console.error("[admin/services/photos] update:", error.message);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  await recordAdminAction(db, {
    actorId: user.id,
    action: "service.photos",
    targetType: "service",
    targetId: id,
    details: { action },
  });

  revalidatePath(`/admin/services/${id}`);
  revalidatePath(`/services/${id}`);
  revalidatePath("/services");
  return NextResponse.json({ ok: true, ...result });
}
