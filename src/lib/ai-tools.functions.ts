import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

async function runPrompt(system: string, prompt: string) {
  const { getLovableProvider, DEFAULT_MODEL } = await import("./ai-gateway.server");
  const gateway = getLovableProvider();
  try {
    const { text } = await generateText({
      model: gateway(DEFAULT_MODEL),
      system,
      prompt,
    });
    return { text };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("429")) throw new Error("Rate limit reached. Please wait a moment and try again.");
    if (msg.includes("402")) throw new Error("AI credits exhausted. Please add credits in your workspace billing settings.");
    throw new Error(msg);
  }
}

const EmailInput = z.object({
  purpose: z.string().min(1).max(2000),
  recipient: z.string().max(200).optional().default(""),
  tone: z.enum(["professional", "friendly", "concise", "persuasive", "apologetic"]).default("professional"),
  keyPoints: z.string().max(2000).optional().default(""),
});

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => EmailInput.parse(input))
  .handler(async ({ data }) => {
    const system = `You are an expert professional email writer. Produce a complete, polished email with a clear subject line. Format as:\nSubject: <subject>\n\n<body>\n\nUse a ${data.tone} tone. Be specific and avoid filler.`;
    const prompt = `Recipient context: ${data.recipient || "(unspecified)"}\nPurpose: ${data.purpose}\nKey points to include: ${data.keyPoints || "(none specified)"}`;
    return runPrompt(system, prompt);
  });

const NotesInput = z.object({
  transcript: z.string().min(20).max(50000),
});

export const summarizeNotes = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => NotesInput.parse(input))
  .handler(async ({ data }) => {
    const system = `You are an expert meeting analyst. Given a transcript or meeting notes, output Markdown with these sections:\n\n## Summary\n2-4 sentence overview.\n\n## Key Takeaways\nBullet list.\n\n## Decisions\nBullet list of explicit decisions (or "None recorded").\n\n## Action Items\nBullet list in the form: **[Owner]** — task — _due date if mentioned_.\n\nBe faithful to the source; do not invent details.`;
    return runPrompt(system, data.transcript);
  });

const TasksInput = z.object({
  description: z.string().min(5).max(5000),
});

export const planTasks = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => TasksInput.parse(input))
  .handler(async ({ data }) => {
    const system = `You are a productivity planner. Convert the user's natural-language goal into a structured plan.

Return ONLY valid JSON (no markdown fences) with this shape:
{
  "summary": "one-sentence plan summary",
  "tasks": [
    { "title": "string", "description": "string", "priority": "low|medium|high", "dueInDays": number, "estimateHours": number }
  ]
}

Infer reasonable deadlines (dueInDays from today). Break work into 3-8 concrete tasks.`;
    return runPrompt(system, data.description);
  });

const ResearchInput = z.object({
  query: z.string().min(3).max(500),
  sourceText: z.string().max(50000).optional().default(""),
});

export const researchSummary = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ResearchInput.parse(input))
  .handler(async ({ data }) => {
    const system = `You are a professional research assistant. Provide a structured Markdown briefing with these sections:\n\n## Executive Summary\n## Key Findings (bulleted)\n## Context & Background\n## Open Questions\n## Suggested Citations\n\nIn "Suggested Citations", list 3-6 reputable sources (publication, author if known, year, and a URL when reasonably certain). Clearly state when a citation is suggested for further verification rather than directly quoted.`;
    const prompt = data.sourceText
      ? `Research query: ${data.query}\n\nSource material provided by the user:\n"""\n${data.sourceText}\n"""`
      : `Research query: ${data.query}\n\nNo source material was provided; draw on general knowledge and clearly flag uncertainty.`;
    return runPrompt(system, prompt);
  });
