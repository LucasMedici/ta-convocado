import { EVALUATION_PROMPT, SYSTEM_PROMPT } from "@/app/lib/prompts";
import { openai } from "@ai-sdk/openai";
import { streamText, gateway, convertToModelMessages, generateText, UIMessage } from "ai";

export async function POST(req: Request) {
  const { messages }: {messages: UIMessage[]} = await req.json();

  const lastMessage = messages[messages.length - 1];

  const evaluation = generateText({
    model: openai("gpt-4o-mini"),
    system: EVALUATION_PROMPT,
    messages: 
    [
      {
        role: "user",
        content: lastMessage.parts
          .map((part) => (part.type === "text" ? part.text : ""))
          .join(""),
      },
    ]
  });

  const jsonEvaluation = JSON.parse(evaluation.text);


  if(!jsonEvaluation.isSafe){
    return new Response("MENSAGEM NÃO SEGURA", { status: 400 });
  }

  const result = streamText({
    model: gateway("openai/gpt-4o-mini"),
    messages: await convertToModelMessages(messages),
    system: SYSTEM_PROMPT,
    tools: {
      web_search: openai.tools.webSearch({
        searchContextSize: "low",
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
