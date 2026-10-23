import "server-only";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ORPHAN_RETENTION_MS,
  attachmentStoragePath,
  type AttachmentMime,
} from "@/lib/support-attachments";

const BUCKET = "support-attachments";
/** Lien d'affichage valable une heure : le bucket est privé. */
const SIGNED_URL_SECONDS = 60 * 60;

export type AttachmentRow = {
  id: string;
  request_id: string;
  reply_id: string | null;
  storage_path: string;
  mime: string;
};

/** Stocke une image pour une demande. Le fichier n'est rattaché à un message qu'à l'envoi. */
export async function storeAttachment(
  db: SupabaseClient,
  input: { requestId: string; uploaderId: string; bytes: Uint8Array; mime: AttachmentMime },
): Promise<{ id: string } | { error: string }> {
  const id = randomUUID();
  const path = attachmentStoragePath(input.requestId, id, input.mime);

  const { error: uploadError } = await db.storage
    .from(BUCKET)
    .upload(path, input.bytes, { contentType: input.mime, upsert: false });
  if (uploadError) {
    console.error("storeAttachment upload:", uploadError.message);
    return { error: "L'envoi de l'image a échoué. Réessayez." };
  }

  const { error: insertError } = await db.from("support_attachments").insert({
    id,
    request_id: input.requestId,
    uploader_id: input.uploaderId,
    storage_path: path,
    mime: input.mime,
    bytes: input.bytes.byteLength,
  });
  if (insertError) {
    console.error("storeAttachment insert:", insertError.message);
    await db.storage.from(BUCKET).remove([path]);
    return { error: "L'envoi de l'image a échoué. Réessayez." };
  }
  return { id };
}

/** Rattache des images envoyées au message créé. Ne touche que les images non rattachées de l'auteur. */
export async function linkAttachments(
  db: SupabaseClient,
  input: { ids: string[]; requestId: string; replyId: string; uploaderId: string },
): Promise<void> {
  if (input.ids.length === 0) return;
  const { error } = await db
    .from("support_attachments")
    .update({ reply_id: input.replyId })
    .in("id", input.ids)
    .eq("request_id", input.requestId)
    .eq("uploader_id", input.uploaderId)
    .is("reply_id", null);
  if (error) console.error("linkAttachments:", error.message);
}

/** Supprime toutes les images d'une demande du stockage et de la base. Appelé à la résolution. */
export async function purgeRequestAttachments(db: SupabaseClient, requestId: string): Promise<void> {
  const { data: rows, error } = await db
    .from("support_attachments")
    .select("id, storage_path")
    .eq("request_id", requestId);
  if (error) {
    console.error("purgeRequestAttachments select:", error.message);
    return;
  }
  if (!rows || rows.length === 0) return;

  const { error: removeError } = await db.storage.from(BUCKET).remove(rows.map((r) => r.storage_path));
  if (removeError) console.error("purgeRequestAttachments storage:", removeError.message);

  const { error: deleteError } = await db.from("support_attachments").delete().eq("request_id", requestId);
  if (deleteError) console.error("purgeRequestAttachments rows:", deleteError.message);
}

/** Supprime les images envoyées mais jamais rattachées à un message, après le délai de rétention. */
export async function purgeOrphanAttachments(db: SupabaseClient, now: Date = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - ORPHAN_RETENTION_MS).toISOString();
  const { data: rows, error } = await db
    .from("support_attachments")
    .select("id, storage_path")
    .is("reply_id", null)
    .lt("created_at", cutoff);
  if (error) {
    console.error("purgeOrphanAttachments select:", error.message);
    return 0;
  }
  if (!rows || rows.length === 0) return 0;

  await db.storage.from(BUCKET).remove(rows.map((r) => r.storage_path));
  await db.from("support_attachments").delete().in("id", rows.map((r) => r.id));
  return rows.length;
}

/** Pièces jointes de plusieurs demandes, pour la messagerie. */
export async function attachmentsForRequests(db: SupabaseClient, requestIds: string[]): Promise<AttachmentRow[]> {
  if (requestIds.length === 0) return [];
  const { data, error } = await db
    .from("support_attachments")
    .select("id, request_id, reply_id, storage_path, mime")
    .in("request_id", requestIds);
  if (error) {
    console.error("attachmentsForRequests:", error.message);
    return [];
  }
  return (data ?? []) as AttachmentRow[];
}

/** Liens signés temporaires, indexés par identifiant de pièce jointe. */
export async function signedUrlsFor(db: SupabaseClient, rows: AttachmentRow[]): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  if (rows.length === 0) return urls;
  const { data, error } = await db.storage
    .from(BUCKET)
    .createSignedUrls(rows.map((r) => r.storage_path), SIGNED_URL_SECONDS);
  if (error || !data) {
    console.error("signedUrlsFor:", error?.message);
    return urls;
  }
  data.forEach((entry, index) => {
    if (entry.signedUrl) urls.set(rows[index].id, entry.signedUrl);
  });
  return urls;
}
