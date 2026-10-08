"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DOCUMENT_TYPES,
  KYC_COUNTRIES,
  KYC_MAX_BYTES,
  KYC_MIME_EXT,
  isValidAdultDob,
  kycStoragePath,
  matchesMagicBytes,
} from "@/lib/kyc";

/**
 * Soumettre une demande de vérification KYC.
 *
 * Le formulaire envoie : documentType, documentCountry, declared_first_name,
 * declared_last_name, declared_dob (AAAA-MM-JJ), front (recto), selfie.
 *
 * Tout est revalidé ici : le navigateur n'est jamais une garantie. Les fichiers
 * vont dans le bucket privé kyc-documents/<userId>/... (politique RLS : seul le
 * propriétaire du dossier y écrit). Le statut du profil n'est modifié que par la
 * clé service, après validation, car la politique RLS interdit à l'utilisateur
 * de changer son propre statut de vérification.
 */
export async function submitVerification(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };

  const documentType = String(formData.get("documentType") ?? "");
  const documentCountry = String(formData.get("documentCountry") ?? "").toUpperCase();
  const firstName = String(formData.get("declared_first_name") ?? "").trim();
  const lastName = String(formData.get("declared_last_name") ?? "").trim();
  const dob = String(formData.get("declared_dob") ?? "").trim();
  const front = formData.get("front");
  const selfie = formData.get("selfie");

  if (!firstName || !lastName || !dob || !(front instanceof File) || !(selfie instanceof File)) {
    return { error: "Tous les champs sont obligatoires." };
  }

  if (!DOCUMENT_TYPES.some((d) => d.value === documentType)) {
    return { error: "Type de document inconnu." };
  }
  if (!KYC_COUNTRIES.some((c) => c.code === documentCountry)) {
    return { error: "Pays de délivrance inconnu." };
  }
  if (firstName.length > 80 || lastName.length > 80) {
    return { error: "Nom ou prénom trop long." };
  }
  if (!isValidAdultDob(dob)) {
    return { error: "Date de naissance invalide : vous devez avoir au moins 18 ans." };
  }

  for (const file of [front, selfie]) {
    if (file.size === 0 || file.size > KYC_MAX_BYTES) {
      return { error: "Chaque fichier doit faire moins de 10 Mo." };
    }
    if (!(file.type in KYC_MIME_EXT)) {
      return { error: "Formats acceptés : JPEG, PNG, WebP, PDF." };
    }
  }

  // Une demande en cours suffit à bloquer une nouvelle soumission.
  const { data: existing } = await supabase
    .from("verifications")
    .select("id, status")
    .eq("profile_id", user.id)
    .in("status", ["pending", "manual_review"])
    .maybeSingle();

  if (existing) {
    return { error: "Vous avez déjà une demande de vérification en cours." };
  }

  // Contrôle des octets réels : un fichier renommé ou forgé est refusé.
  const frontBuf = new Uint8Array(await front.arrayBuffer());
  const selfieBuf = new Uint8Array(await selfie.arrayBuffer());
  if (!matchesMagicBytes(frontBuf, front.type) || !matchesMagicBytes(selfieBuf, selfie.type)) {
    return { error: "Le contenu du fichier ne correspond pas à son format." };
  }

  const frontPath = kycStoragePath(user.id, KYC_MIME_EXT[front.type], "front");
  const selfiePath = kycStoragePath(user.id, KYC_MIME_EXT[selfie.type], "selfie");

  const { error: frontErr } = await supabase.storage
    .from("kyc-documents")
    .upload(frontPath, frontBuf, { contentType: front.type, upsert: false });
  if (frontErr) return { error: "Le recto n'a pas pu être envoyé. Réessayez." };

  const { error: selfieErr } = await supabase.storage
    .from("kyc-documents")
    .upload(selfiePath, selfieBuf, { contentType: selfie.type, upsert: false });
  if (selfieErr) {
    await supabase.storage.from("kyc-documents").remove([frontPath]);
    return { error: "Le selfie n'a pas pu être envoyé. Réessayez." };
  }

  const { error: insertErr } = await supabase.from("verifications").insert({
    profile_id: user.id,
    document_type: documentType,
    document_country: documentCountry,
    declared_first_name: firstName,
    declared_last_name: lastName,
    declared_dob: dob,
    storage_path: JSON.stringify({ front: frontPath, selfie: selfiePath }),
    status: "pending",
  });
  if (insertErr) {
    await supabase.storage.from("kyc-documents").remove([frontPath, selfiePath]);
    return { error: "La demande n'a pas pu être enregistrée. Réessayez." };
  }

  const admin = createAdminClient();
  const { error: profileErr } = await admin
    .from("profiles")
    .update({ verification_status: "pending", updated_at: new Date().toISOString() })
    .eq("id", user.id);
  if (profileErr) {
    return { error: "La demande est enregistrée mais le statut n'a pas pu être mis à jour. Contactez le support." };
  }

  revalidatePath("/dashboard/verification");
  revalidatePath("/dashboard");
  revalidatePath("/admin/verifications");

  return { success: true };
}
