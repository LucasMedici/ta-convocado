import { EVALUATION_PROMPT, SYSTEM_PROMPT } from "@/app/lib/prompts";
import { openai } from "@ai-sdk/openai";
import { streamText, gateway, convertToModelMessages, generateText, UIMessage } from "ai";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 12;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function getClientId(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

function checkRateLimit(clientId: string) {
  const now = Date.now();
  const entry = rateLimitStore.get(clientId);

  if (!entry || now >= entry.resetAt) {
    rateLimitStore.set(clientId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  rateLimitStore.set(clientId, entry);
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, resetAt: entry.resetAt };
}

export async function POST(req: Request) {
  const clientId = getClientId(req);
  const limit = checkRateLimit(clientId);
  if (!limit.allowed) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((limit.resetAt - Date.now()) / 1000),
    );
    return new Response("RATE_LIMITED", {
      status: 429,
      headers: {
        "Retry-After": retryAfterSeconds.toString(),
      },
    });
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

  const lastMessage = messages[messages.length - 1];

  const evaluation = await generateText({
    model: gateway("openai/gpt-4o-mini"),
    system: EVALUATION_PROMPT,
    messages: [
      {
        role: "user",
        content: lastMessage.parts
          .map((part) => (part.type === "text" ? part.text : ""))
          .join(""),
      },
    ],
  });

  const jsonEvaluation = JSON.parse(evaluation.text);

  console.log("Avaliação de segurança:", jsonEvaluation);


  if (!jsonEvaluation.is_safe) {
    return new Response("MENSAGEM NÃO SEGURA", { status: 400 });
  }

  const result = streamText({
    model: openai("gpt-4o-mini"),
    messages: await convertToModelMessages(messages),
    system: SYSTEM_PROMPT,
    tools: {
      webSearch: openai.tools.webSearch({
        searchContextSize: 'low'
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
