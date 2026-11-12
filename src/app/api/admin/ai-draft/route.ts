import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchProviderContext, createDraftStream } from "@/lib/ai-support";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest): Promise<Response> {
  // Auth — vérifie que l'appelant est un admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const db = createAdminClient();
  const { data: profile } = await db
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    return Response.json({ error: "Réservé aux administrateurs" }, { status: 403 });
  }

  // Paramètres
  let threadId: string;
  try {
    const body = (await request.json()) as { threadId?: string };
    if (!body.threadId || !UUID_RE.test(body.threadId)) throw new Error("threadId invalide");
    threadId = body.threadId;
  } catch {
    return Response.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  // Récupération du contexte
  const ctx = await fetchProviderContext(threadId);
  if (!ctx) {
    return Response.json({ error: "Thread introuvable" }, { status: 404 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY non configurée" }, { status: 500 });
  }

  // Stream SSE
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = createDraftStream(ctx);

        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta" &&
            chunk.delta.text
          ) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`),
            );
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur interne";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
