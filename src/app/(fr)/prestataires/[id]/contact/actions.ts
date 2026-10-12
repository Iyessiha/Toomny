"use server";

import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCatalogTexts } from "@/i18n/catalog";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/notifications";
import { actorName } from "@/lib/names";

export async function sendDirectInquiry(providerId: string, formData: FormData) {
  const user = await requireAuth();
  const t = getCatalogTexts(user.preferredLocale);

  const message = String(formData.get("message") ?? "").trim();
  if (message.length < 10) return { error: t.contactErrorShort };
  if (message.length > 1000) return { error: t.contactErrorLong };

  if (providerId === user.id) return { error: t.contactErrorFailed };

  const supabase = await createClient();

  // Vérifier que le destinataire existe bien comme prestataire
  const { data: provider } = await supabase
    .from("provider_directory")
    .select("id")
    .eq("id", providerId)
    .maybeSingle();

  if (!provider) return { error: t.contactErrorFailed };

  const { error } = await supabase.from("inquiries").insert({
    from_id: user.id,
    to_id: providerId,
    service_id: null,
    message,
  });

  if (error) return { error: t.contactErrorFailed };

  await notify(createAdminClient(), {
    recipientId: providerId,
    type: "inquiry_received",
    params: { from: await actorName(user.id, user.preferredLocale) },
    link: "/demandes",
  });

  return { success: true };
}
