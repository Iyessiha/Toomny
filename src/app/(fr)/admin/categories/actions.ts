"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UUID_RE = /^[0-9a-f-]{36}$/i;

export async function createCategory(formData: FormData): Promise<{ error?: string }> {
  await requireAdmin();

  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const name_fr = String(formData.get("name_fr") ?? "").trim();
  const name_en = String(formData.get("name_en") ?? "").trim();
  const positionRaw = Number(formData.get("position"));
  const position = isNaN(positionRaw) ? 99 : positionRaw;

  if (!SLUG_RE.test(slug)) return { error: "invalid_slug" };
  if (!name_fr || !name_en) return { error: "name_required" };

  const db = createAdminClient();
  const { error } = await db
    .from("categories")
    .insert({ slug, name_fr, name_en, position, is_active: true });

  if (error) return { error: error.message };

  revalidatePath("/admin/categories");
  revalidatePath("/services");
  return {};
}

export async function updateCategory(formData: FormData): Promise<{ error?: string }> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!UUID_RE.test(id)) return { error: "invalid id" };

  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const name_fr = String(formData.get("name_fr") ?? "").trim();
  const name_en = String(formData.get("name_en") ?? "").trim();
  const positionRaw = Number(formData.get("position"));

  if (!SLUG_RE.test(slug)) return { error: "invalid_slug" };
  if (!name_fr || !name_en) return { error: "name_required" };

  const update: Record<string, unknown> = { slug, name_fr, name_en };
  if (!isNaN(positionRaw)) update.position = positionRaw;

  const db = createAdminClient();
  const { error } = await db.from("categories").update(update).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/categories");
  revalidatePath("/services");
  return {};
}

export async function toggleCategoryActive(id: string, is_active: boolean): Promise<{ error?: string }> {
  await requireAdmin();
  if (!UUID_RE.test(id)) return { error: "invalid id" };

  const db = createAdminClient();
  const { error } = await db.from("categories").update({ is_active }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/categories");
  revalidatePath("/services");
  return {};
}

export async function deleteCategory(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  if (!UUID_RE.test(id)) return { error: "invalid id" };

  const db = createAdminClient();
  const { count } = await db
    .from("services")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);

  if ((count ?? 0) > 0) return { error: "category_not_empty" };

  const { error } = await db.from("categories").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/categories");
  revalidatePath("/services");
  return {};
}
