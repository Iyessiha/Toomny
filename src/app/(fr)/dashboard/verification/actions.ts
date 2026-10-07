"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { kycStoragePath } from "@/lib/kyc";

/**
 * Soumettre une demande de vérification KYC.
 *
 * Le formulaire envoie :
 * - documentType : cni | passeport | permis | carte_sejour | attestation
 * - documentCountry : ISO alpha-2
 * - front : File (recto du document)
 * - selfie : File (photo avec le document à côté du visage)
 *
 * Les fichiers vont dans le bucket privé kyc-documents/<userId>/...
 * Une ligne est créée dans la table `verifications` avec status=pending.
 * Le profil passe aussi en verification_status=pending.
 */
export async function submitVerification(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };

  const documentType = formData.get("documentType") as string;
  const documentCountry = formData.get("documentCountry") as string;
  const front = formData.get("front") as File | null;
  const selfie = formData.get("selfie") as File | null;

  if (!documentType || !documentCountry || !front || !selfie) {
    return { error: "Tous les champs sont obligatoires." };
  }

  // Limites
  const MAX_SIZE = 10 * 1024 * 1024; // 10 Mo
  if (front.size > MAX_SIZE || selfie.size > MAX_SIZE) {
    return { error: "Chaque fichier doit faire moins de 10 Mo." };
  }

  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowed.includes(front.type) || !allowed.includes(selfie.type)) {
    return { error: "Formats acceptés : JPEG, PNG, WebP, PDF." };
  }

  // Vérifier qu'il n'y a pas déjà une demande en attente
  const { data: existing } = await supabase
    .from("verifications")
    .select("id, status")
    .eq("profile_id", user.id)
    .in("status", ["pending", "manual_review"])
    .maybeSingle();

  if (existing) {
    return { error: "Vous avez déjà une demande de vérification en cours." };
  }

  // Upload recto
  const frontPath = kycStoragePath(user.id, front.name, "front");
  const frontBuf = Buffer.from(await front.arrayBuffer());
  const { error: frontErr } = await supabase.storage
    .from("kyc-documents")
    .upload(frontPath, frontBuf, { contentType: front.type, upsert: false });
  if (frontErr) return { error: `Erreur upload recto : ${frontErr.message}` };

  // Upload selfie
  const selfiePath = kycStoragePath(user.id, selfie.name, "selfie");
  const selfieBuf = Buffer.from(await selfie.arrayBuffer());
  const { error: selfieErr } = await supabase.storage
    .from("kyc-documents")
    .upload(selfiePath, selfieBuf, { contentType: selfie.type, upsert: false });
  if (selfieErr) return { error: `Erreur upload selfie : ${selfieErr.message}` };

  // Stocker les deux chemins en JSON dans storage_path
  const storagePaths = JSON.stringify({ front: frontPath, selfie: selfiePath });

  // Créer la ligne dans verifications
  const { error: insertErr } = await supabase.from("verifications").insert({
    profile_id: user.id,
    document_type: documentType,
    document_country: documentCountry,
    storage_path: storagePaths,
    status: "pending",
  });
  if (insertErr) return { error: `Erreur enregistrement : ${insertErr.message}` };

  // Passer le profil en "pending"
  await supabase
    .from("profiles")
    .update({ verification_status: "pending", updated_at: new Date().toISOString() })
    .eq("id", user.id);

  revalidatePath("/dashboard/verification");
  revalidatePath("/dashboard");
  revalidatePath("/admin/verifications");

  return { success: true };
}
