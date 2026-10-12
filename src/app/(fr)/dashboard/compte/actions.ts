"use server";

import { redirect } from "next/navigation";
import { getCurrentUser, requireAuth } from "@/lib/auth";
import { deleteAccount } from "@/lib/account";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getAccountTexts } from "@/i18n/account";

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

/** Changement d'adresse e-mail. Supabase envoie un lien de confirmation. */
export async function changeEmail(formData: FormData) {
  const user = await requireAuth();
  const t = getAccountTexts(user.preferredLocale).errors;

  const newEmail = String(formData.get("newEmail") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return { error: t.emailInvalid };
  if (newEmail === (user.email ?? "").toLowerCase()) return { error: t.emailSame };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email: newEmail });
  if (error) return { error: t.emailFailed };

  return { success: true };
}

/** Changement de mot de passe avec vérification du mot de passe actuel. */
export async function changePassword(formData: FormData) {
  const user = await requireAuth();
  const t = getAccountTexts(user.preferredLocale).errors;

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < 8) return { error: t.passwordTooShort };
  if (newPassword !== confirmPassword) return { error: t.passwordMismatch };

  const supabase = await createClient();

  // Vérifier le mot de passe actuel via re-auth
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email ?? "",
    password: currentPassword,
  });
  if (signInError) return { error: t.passwordWrong };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: t.passwordFailed };

  return { success: true };
}

/**
 * Mémorise la langue choisie dans le sélecteur du header. No-op silencieux
 * pour les visiteurs déconnectés (le cookie suffit) ; la RLS `profiles_update_own`
 * autorise chacun à modifier sa propre langue.
 */
export async function setPreferredLocale(locale: "fr" | "en"): Promise<{ success: true }> {
  if (locale !== "fr" && locale !== "en") return { success: true };
  const user = await getCurrentUser();
  if (!user) return { success: true };
  const supabase = await createClient();
  await supabase.from("profiles").update({ preferred_locale: locale }).eq("id", user.id);
  return { success: true };
}
