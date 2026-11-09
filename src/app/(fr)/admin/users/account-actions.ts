"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordAdminAction } from "@/lib/admin-audit";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Envoie le lien de réinitialisation à l'adresse du compte. C'est la personne elle-même
 * qui choisit son mot de passe : l'administrateur ne le voit jamais. Journalisé.
 */
export async function sendUserPasswordReset(formData: FormData): Promise<{ success: true } | { error: string }> {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  if (!UUID_RE.test(userId)) return { error: "Utilisateur introuvable." };

  const db = createAdminClient();
  const { data } = await db.auth.admin.getUserById(userId);
  const email = data?.user?.email;
  if (!email) return { error: "Ce compte n'a pas d'adresse e-mail." };

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/reset-password`,
  });
  if (error) {
    console.error("sendUserPasswordReset:", error.message);
    return { error: "L'envoi a échoué. Réessayez dans un instant." };
  }

  await recordAdminAction(db, {
    actorId: admin.id,
    action: "account.recovery_sent",
    targetType: "user",
    targetId: userId,
  });
  return { success: true };
}

/**
 * Change l'adresse e-mail d'un compte (utile pour les comptes de test). L'adresse
 * est confirmée d'office, car c'est l'administrateur qui la fixe. Journalisé sans l'adresse.
 */
export async function changeUserEmail(formData: FormData): Promise<{ success: true } | { error: string }> {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!UUID_RE.test(userId)) return { error: "Utilisateur introuvable." };
  if (!EMAIL_RE.test(email)) return { error: "Adresse e-mail invalide." };

  const db = createAdminClient();
  const { error: authError } = await db.auth.admin.updateUserById(userId, { email, email_confirm: true });
  if (authError) {
    console.error("changeUserEmail auth:", authError.message);
    return { error: "Impossible de modifier l'adresse (peut-être déjà utilisée)." };
  }
  await db.from("profiles").update({ email }).eq("id", userId);

  await recordAdminAction(db, {
    actorId: admin.id,
    action: "account.email_change",
    targetType: "user",
    targetId: userId,
  });
  revalidatePath(`/admin/users/${userId}`);
  return { success: true };
}
