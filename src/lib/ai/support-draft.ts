import "server-only";
import { callClaude } from "@/lib/ai/claude";
import { buildSupportDraftPrompt, type SupportLocale } from "@/lib/support-replies";

/**
 * Brouillon de réponse à une demande de contact. Le texte n'est jamais envoyé
 * automatiquement : l'administrateur le relit, le modifie, puis l'envoie.
 */
export async function generateSupportDraft(input: {
  subject: string;
  body: string;
  role: string;
  locale: SupportLocale;
}): Promise<{ text: string } | { error: string }> {
  const { system, user } = buildSupportDraftPrompt(input);
  const result = await callClaude({ system, user, maxTokens: 1000 });
  return result.ok ? { text: result.text } : { error: result.error };
}
