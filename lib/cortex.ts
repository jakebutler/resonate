export const CORTEX_BASE_URL = process.env.CORTEX_BASE_URL || "https://cortex.corvolabs.com";

if (!process.env.CORTEX_API_KEY && !process.env.OPENAI_API_KEY) {
  throw new Error("Missing required environment variable: CORTEX_API_KEY or OPENAI_API_KEY");
}

// Prefer Cortex when available; fall back to OpenAI directly only when no Cortex key is set
const USE_OPENAI = !process.env.CORTEX_API_KEY && !!process.env.OPENAI_API_KEY;
const API_KEY = USE_OPENAI ? process.env.OPENAI_API_KEY! : process.env.CORTEX_API_KEY!;
const BASE_URL = USE_OPENAI ? "https://api.openai.com" : CORTEX_BASE_URL;

export const LINKEDIN_SYSTEM_PROMPT = `You are an expert LinkedIn content writer for Corvo Labs, an AI consulting agency.
Your role is to help craft compelling, professional LinkedIn posts that:
- Sound authentic and conversational, not corporate or generic
- Share genuine insights about AI, consulting, and technology
- Drive engagement through thought leadership and practical value
- Are appropriately concise (aim for 150-300 words unless asked otherwise)
- Use paragraph breaks rather than excessive bullet points
- End with a clear call to action or thought-provoking question when appropriate
- Maintain a confident but approachable tone

When given an idea or draft, transform it into a polished LinkedIn post.
If the user references a blog post, include a natural mention of it and encourage readers to check it out.
Always stay within LinkedIn's 3,000 character limit.`;

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function streamCortexChat(
  messages: ChatMessage[],
  model?: string
): Promise<ReadableStream> {
  const resolvedModel = model ?? (USE_OPENAI ? "gpt-4o" : "claude-sonnet-4.6");

  const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: resolvedModel,
      stream: true,
      messages: [
        { role: "system", content: LINKEDIN_SYSTEM_PROMPT },
        ...messages,
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`LLM API error: ${response.status} ${text}`);
  }

  return response.body!;
}
