import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { buildSupportDraftPrompt, type SupportLocale } from "@/lib/support-replies";

/** Modèle par défaut du projet pour les tâches Claude. */
export const SUPPORT_DRAFT_MODEL = "claude-opus-5-5";

/**
 * Brouillon de réponse à une demande de contact. Le texte n'est jamais envoyé
 * automatiquement : l'administrateur le relit, le modifie, puis l'envoie.
 * `fallbacks: "default"` retente la requête sur un modèle de repli si le
 * modèle principal refuse (garde-fous côté serveur).
 */
export async function generateSupportDraft(input: {
  subject: string;
  body: string;
  role: string;
  locale: SupportLocale;
}): Promise<{ text: string } | { error: string }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { error: "L'assistant IA n'est pas configuré (clé ANTHROPIC_API_KEY absente)." };
  }

  const { system, user } = buildSupportDraftPrompt(input);
  const client = new Anthropic();

  try {
    const response = await client.beta.messages.create({
      model: SUPPORT_DRAFT_MODEL,
      max_tokens: 2000,
      system,
      messages: [{ role: "user", content: user }],
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    });

    if (response.stop_reason === "refusal") {
      return { error: "Le modèle a refusé de rédiger cette réponse. Rédigez-la manuellement." };
    }

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();
    if (!text) return { error: "Le brouillon généré est vide. Réessayez." };
    return { text };
  } catch (err) {
    console.error("[ai:support-draft]", err instanceof Error ? err.message : err);
    return { error: "La génération du brouillon a échoué. Réessayez ou rédigez la réponse." };
  }
}
