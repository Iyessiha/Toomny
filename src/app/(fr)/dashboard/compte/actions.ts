"use server";

import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { deleteAccount } from "@/lib/account";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Suppression définitive du compte connecté. Il faut retaper son adresse e-mail :
 * un clic accidentel ou un formulaire détourné ne suffit pas.
 */
export async function deleteMyAccount(formData: FormData): Promise<void> {
  const user = await requireAuth();

  const typed = String(formData.get("confirmEmail") ?? "").trim().toLowerCase();
  if (!user.email || typed !== user.email.toLowerCase()) {
    redirect("/dashboard/compte?error=email");
  }

  const result = await deleteAccount(createAdminClient(), user.id);
  if (!result.ok) redirect(`/dashboard/compte?error=${result.reason}`);

  const session = await createClient();
  await session.auth.signOut();
  redirect("/?account=deleted");
}
