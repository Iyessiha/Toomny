"use server";

import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCatalogTexts } from "@/i18n/catalog";

export async function sendInquiry(serviceId: string, formData: FormData) {
  const user = await requireAuth();
  const t = getCatalogTexts(user.preferredLocale);

  const message = String(formData.get("message") ?? "").trim();
  if (message.length < 10) return { error: t.contactErrorShort };
  if (message.length > 1000) return { error: t.contactErrorLong };

  const supabase = await createClient();

  const { data: service } = await supabase
    .from("services")
    .select("provider_id, status")
    .eq("id", serviceId)
    .maybeSingle();

  if (!service || service.status !== "active") return { error: t.contactErrorFailed };
  if (service.provider_id === user.id) return { error: t.contactErrorFailed };

  const { error } = await supabase.from("inquiries").insert({
    from_id: user.id,
    to_id: service.provider_id,
    service_id: serviceId,
    message,
  });

  if (error) return { error: t.contactErrorFailed };

  return { success: true };
}
