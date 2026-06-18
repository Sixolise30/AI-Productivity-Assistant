import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { getLovableProvider, DEFAULT_MODEL } from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `You are Nimbus, an AI workplace productivity assistant. You help professionals draft emails, summarize meetings, plan tasks, research topics, and answer workplace questions.

Guidelines:
- Be concise, structured, and pragmatic.
- Use Markdown formatting (headings, lists, bold) when it improves clarity.
- When asked for plans or summaries, return structured output.
- Remind the user that AI output should be reviewed before professional use only when directly relevant.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { messages: UIMessage[] };
          const gateway = getLovableProvider();
          const result = streamText({
            model: gateway(DEFAULT_MODEL),
            system: SYSTEM_PROMPT,
            messages: await convertToModelMessages(body.messages ?? []),
          });
          return result.toUIMessageStreamResponse();
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          let status = 500;
          let userMsg = "Something went wrong while contacting the AI.";
          if (msg.includes("429")) {
            status = 429;
            userMsg = "Rate limit reached. Please wait a moment and try again.";
          } else if (msg.includes("402")) {
            status = 402;
            userMsg = "AI credits exhausted. Add credits in workspace billing.";
          }
          return new Response(JSON.stringify({ error: userMsg }), {
            status,
            headers: { "content-type": "application/json" },
          });
        }
      },
    },
  },
});
