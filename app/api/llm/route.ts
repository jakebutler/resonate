import { NextRequest } from "next/server";
import { streamCortexChat, type ChatMessage } from "@/lib/cortex";
import { MODEL_IDS } from "@/lib/models";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages, model } = await req.json();

  if (!Array.isArray(messages)) {
    return new Response("messages must be an array", { status: 400 });
  }
  if (model !== undefined && typeof model !== "string") {
    return new Response("model must be a string", { status: 400 });
  }
  if (model !== undefined && !MODEL_IDS.has(model)) {
    return new Response(`"${model}" is not a supported model`, { status: 400 });
  }

  try {
    const stream = await streamCortexChat(messages as ChatMessage[], model);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Cortex error [model=%s]:", model ?? "default", message);
    return new Response(message, { status: 500 });
  }
}
