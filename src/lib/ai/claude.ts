import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Modèle unique du projet pour les tâches d'assistance. Haiku 5.5 : le plus
 * économique de la gamme, suffisant pour rédiger et structurer du texte court.
 * Haiku 5.5 n'a pas de repli serveur sur refus : un refus est renvoyé tel quel.
 */
export const CLAUDE_MODEL = "claude-haiku-5-5";

export type ClaudeResult = { ok: true; text: string } | { ok: false; error: string };

/**
 * Un appel sans réflexion ni effort élevé : coût minimal. Si `schema` est
 * fourni, la sortie est contrainte à ce schéma JSON (structured outputs).
 */
export async function callClaude(opts: {
  system: string;
  user: string;
  maxTokens: number;
  schema?: Record<string, unknown>;
}): Promise<ClaudeResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, error: "L'assistant IA n'est pas configuré. Contactez l'équipe Toomny." };
  }

  const client = new Anthropic();
  try {
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: opts.maxTokens,
      system: opts.system,
      messages: [{ role: "user", content: opts.user }],
      thinking: { type: "disabled" },
      output_config: {
        effort: "low",
        ...(opts.schema ? { format: { type: "json_schema", schema: opts.schema } } : {}),
      },
    });

    if (response.stop_reason === "refusal") {
      return { ok: false, error: "La demande a été refusée. Reformulez-la." };
    }
    if (response.stop_reason === "max_tokens") {
      return { ok: false, error: "La réponse est trop longue. Raccourcissez votre texte et réessayez." };
    }

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();
    if (!text) return { ok: false, error: "La génération est vide. Réessayez." };
    return { ok: true, text };
  } catch (err) {
    console.error("[ai:claude]", err instanceof Error ? err.message : err);
    return { ok: false, error: "La génération a échoué. Réessayez dans un instant." };
  }
}
