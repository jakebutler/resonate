export const CORTEX_BASE_URL = process.env.CORTEX_BASE_URL || "https://cortex.corvolabs.com";

if (!process.env.CORTEX_API_KEY) {
  throw new Error("Missing required environment variable: CORTEX_API_KEY");
}
export const CORTEX_API_KEY = process.env.CORTEX_API_KEY;

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
  model = "claude-3-5-sonnet"
): Promise<ReadableStream> {
  const response = await fetch(`${CORTEX_BASE_URL}/v1/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CORTEX_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      stream: true,
      instructions: LINKEDIN_SYSTEM_PROMPT,
      input: messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`Cortex API error: ${response.status}`);
  }

  return response.body!;
}
