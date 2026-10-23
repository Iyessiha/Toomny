import "server-only";
import { callClaude } from "@/lib/ai/claude";
import { toomnyKnowledge } from "@/lib/ai/toomny-knowledge";
import { buildSupportDraftPrompt, type SupportLocale } from "@/lib/support-replies";

/**
 * Brouillon de réponse à une demande de contact. Le modèle reçoit les politiques
 * du site et l'état réel du compte du demandeur. Le texte n'est jamais envoyé
 * automatiquement : l'administrateur le relit, le modifie, puis l'envoie.
 */
export async function generateSupportDraft(input: {
  subject: string;
  body: string;
  role: string;
  locale: SupportLocale;
  readiness?: string;
}): Promise<{ text: string } | { error: string }> {
  const { system, user } = buildSupportDraftPrompt({ ...input, knowledge: toomnyKnowledge(input.locale) });
  const result = await callClaude({ system, user, maxTokens: 1000, cacheSystem: true });
  return result.ok ? { text: result.text } : { error: result.error };
}
