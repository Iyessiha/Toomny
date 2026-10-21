"use server";

import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordAdminAction } from "@/lib/admin-audit";
import { PIXEL_FIELDS, parsePixelSettings } from "@/lib/pixels";
import { PIXELS_CACHE_TAG } from "@/lib/pixels-server";

export async function savePixelSettings(formData: FormData): Promise<{ error?: string; field?: string }> {
  const actor = await requireAdmin();

  const parsed = parsePixelSettings((name) => String(formData.get(name) ?? ""));
  if (!parsed.ok) {
    return { error: "invalid_field", field: PIXEL_FIELDS[parsed.field].label };
  }

  let error: { message: string } | null = null;
  try {
    const db = createAdminClient();
    ({ error } = await db
      .from("pixels_publicitaires")
      .upsert({ id: 1, ...parsed.values, updated_by: actor.id, updated_at: new Date().toISOString() }));
  } catch (err) {
    error = { message: (err as Error).message };
  }
  if (error) {
    console.error("[admin/pixels] save:", error.message);
    return { error: error.message };
  }

  await recordAdminAction(db, {
    actorId: actor.id,
    action: "pixels.update",
    targetType: "site",
    targetId: "pixels",
    details: parsed.values,
  });

  revalidateTag(PIXELS_CACHE_TAG, "max");
  return {};
}
