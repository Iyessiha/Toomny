"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordAdminAction } from "@/lib/admin-audit";

/** Marque une demande de contact comme traitée. Action journalisée. */
export async function closeSupportRequest(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("requestId") ?? "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return;

  const db = createAdminClient();
  const { error } = await db
    .from("support_requests")
    .update({ status: "closed", closed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    console.error("closeSupportRequest:", error.message);
    return;
  }

  await recordAdminAction(db, {
    actorId: admin.id,
    action: "support.close",
    targetType: "support",
    targetId: id,
  });
  revalidatePath("/admin/support");
}
