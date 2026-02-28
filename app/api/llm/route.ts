import { NextRequest } from "next/server";
import { streamCortexChat, type ChatMessage } from "@/lib/cortex";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages, model } = await req.json();

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
    console.error("Cortex error:", err);
    return new Response("LLM error", { status: 500 });
  }
}
