"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { consumeRateLimit } from "@/lib/rate-limit";
import { sendSupportRequestEmail } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";

const MAX_PER_DAY = 5;
const DAY_SECONDS = 24 * 60 * 60;

const MSG = {
  fr: {
    subject: "Indiquez le sujet (120 caractères max).",
    body: "Décrivez votre problème (3 000 caractères max).",
    limit: "Vous avez envoyé beaucoup de demandes aujourd'hui. Réessayez demain.",
    save: "L'envoi a échoué. Réessayez.",
  },
  en: {
    subject: "Enter a subject (120 characters max).",
    body: "Describe your issue (3,000 characters max).",
    limit: "You have sent many requests today. Please try again tomorrow.",
    save: "Sending failed. Please try again.",
  },
} as const;

/** Demande adressée à l'équipe Toomny. Limitée à 5 par jour et par utilisateur. */
export async function sendSupportRequest(formData: FormData): Promise<{ success: true } | { error: string }> {
  const user = await requireAuth();
  const m = MSG[user.preferredLocale];

  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!subject || subject.length > 120) return { error: m.subject };
  if (!body || body.length > 3000) return { error: m.body };

  const allowed = await consumeRateLimit(`support:${user.id}`, MAX_PER_DAY, DAY_SECONDS);
  if (!allowed) return { error: m.limit };

  const supabase = await createClient();
  const { error } = await supabase.from("support_requests").insert({ profile_id: user.id, subject, body });
  if (error) return { error: m.save };

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.displayName || "—";
  await sendSupportRequestEmail({
    fromEmail: user.email ?? "",
    fromName: fullName,
    role: user.role,
    subject,
    body,
  });

  revalidatePath("/dashboard/support");
  return { success: true };
}
