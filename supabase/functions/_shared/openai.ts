// OpenAI Direct API Helper Module
// Handles migration from Lovable AI Gateway to direct OpenAI API calls

const OPENAI_API_KEY = Deno.env.get("pivothub-openai-key");
if (!OPENAI_API_KEY) throw new Error("Missing pivothub-openai-key");

const OPENAI_BASE = "https://api.openai.com/v1";

// Allow rollback via env flag
const USE_OPENAI_DIRECT = (Deno.env.get("USE_OPENAI_DIRECT") ?? "true") === "true";

export interface ChatInput {
  model: string;                 // e.g. "gpt-5", "gpt-5-mini", "gpt-4o"
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  maxOutputTokens?: number;      // Responses API naming
  temperature?: number;          // Optional, may be ignored by some models
  responseFormat?: { type: "json_object" | "text" };
}

export interface ChatResponse {
  text: string;
  raw: any;
  requestId?: string;
}

/**
 * Call OpenAI Responses API for text generation
 * Handles Chat Completions fallback for legacy support
 */
export async function chat(input: ChatInput): Promise<ChatResponse> {
  if (!USE_OPENAI_DIRECT) {
    // Fallback to Lovable AI Gateway (temporary during transition)
    return await chatLegacy(input);
  }

  // Convert messages to Responses API format
  const formattedInput = input.messages.map(msg => ({
    role: msg.role,
    content: [{ type: "text", text: msg.content }]
  }));

  const body: any = {
    model: input.model,
    input: formattedInput,
    max_output_tokens: input.maxOutputTokens ?? 2000,
  };

  // Temperature is optional, can include but may be ignored
  if (input.temperature !== undefined) {
    body.temperature = input.temperature;
  }

  // JSON response format
  if (input.responseFormat?.type === "json_object") {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(`${OPENAI_BASE}/responses`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  const requestId = res.headers.get("openai-request-id") || undefined;

  if (!res.ok) {
    if (res.status === 401) throw new Error("Invalid OpenAI API key.");
    if (res.status === 402) throw new Error("OpenAI API payment required. Please check your OpenAI account.");
    if (res.status === 429) throw new Error("OpenAI rate limit exceeded. Please try again later.");
    console.error("OpenAI API error:", res.status, text, { requestId });
    throw new Error(`OpenAI API error: ${res.status}`);
  }

  const data = JSON.parse(text);
  
  // Responses API: output[0].content[0].text
  const output = data.output?.[0]?.content?.[0]?.text ?? "";
  
  return { text: output, raw: data, requestId };
}

/**
 * Legacy fallback to Lovable AI Gateway (for rollback)
 */
async function chatLegacy(input: ChatInput): Promise<ChatResponse> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("Missing LOVABLE_API_KEY for legacy fallback");

  const body: any = {
    model: `openai/${input.model}`,  // Add prefix for gateway
    messages: input.messages,
    max_completion_tokens: input.maxOutputTokens ?? 2000,
  };

  if (input.responseFormat) {
    body.response_format = input.responseFormat;
  }

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error("Lovable AI error:", res.status, text);
    throw new Error(`Lovable AI error: ${res.status}`);
  }

  const data = JSON.parse(text);
  const output = data.choices?.[0]?.message?.content ?? "";
  
  return { text: output, raw: data };
}

/**
 * Generate images using OpenAI Images API
 */
export async function generateImage(
  prompt: string, 
  size: "512x512" | "1024x1024" | "1536x1024" | "1024x1536" = "1024x1024"
): Promise<string> {
  const res = await fetch(`${OPENAI_BASE}/images/generations`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size,
      response_format: "b64_json",
    }),
  });

  const text = await res.text();
  const requestId = res.headers.get("openai-request-id") || undefined;

  if (!res.ok) {
    if (res.status === 401) throw new Error("Invalid OpenAI API key.");
    if (res.status === 402) throw new Error("OpenAI API payment required.");
    if (res.status === 429) throw new Error("OpenAI rate limit exceeded.");
    console.error("OpenAI Images error:", res.status, text, { requestId });
    throw new Error(`OpenAI Images error: ${res.status}`);
  }

  const data = JSON.parse(text);
  const b64 = data.data?.[0]?.b64_json as string;
  
  if (!b64) {
    throw new Error("No image data in response");
  }
  
  return `data:image/png;base64,${b64}`;
}

/**
 * Content moderation (uses OpenAI Moderation API)
 */
export async function moderateContent(text: string): Promise<{ flagged: boolean; categories?: string[] }> {
  const res = await fetch("https://api.openai.com/v1/moderations", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input: text }),
  });

  if (!res.ok) {
    console.error("Moderation API error:", res.status);
    return { flagged: false }; // Fail open
  }

  const data = await res.json();
  const result = data.results?.[0];
  
  if (!result) return { flagged: false };

  const flagged = result.flagged;
  const categories = flagged 
    ? Object.keys(result.categories).filter(k => result.categories[k])
    : [];

  return { flagged, categories };
}
