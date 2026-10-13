"use server";

import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function completeOnboarding(): Promise<{ error?: string }> {
  const user = await requireAuth();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_done: true })
    .eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return {};
}
