"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Connexion via server action.
 *
 * En faisant la connexion côté serveur, le token est posé directement
 * dans les Set-Cookie de la réponse HTTP. Le navigateur les reçoit et
 * les renvoie dès la requête suivante, ce qui évite la race condition
 * entre les cookies posés côté client (createBrowserClient) et la
 * lecture côté serveur (createServerClient).
 */
export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email et mot de passe requis." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.includes("Invalid login")) {
      return { error: "Adresse e-mail ou mot de passe incorrect." };
    }
    if (error.message.includes("Email not confirmed")) {
      return { error: "Confirmez votre e-mail avant de vous connecter." };
    }
    return { error: error.message };
  }

  // Retourner success=true plutôt que redirect() ici :
  // redirect() dans une Server Action appelée depuis un Client Component peut
  // être intercepté par le try/catch React avant que le navigateur n'ait
  // traité les Set-Cookie de la réponse. En retournant success, le client fait
  // window.location.href après que le navigateur ait stocké les cookies.
  return { success: true };
}
