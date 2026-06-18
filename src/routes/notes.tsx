import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Copy, FileText, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { summarizeNotes } from "@/lib/ai-tools.functions";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "Meeting Notes Summarizer — Nimbus" },
      { name: "description", content: "Summarize meeting transcripts into takeaways, decisions, and action items." },
    ],
  }),
  component: NotesPage,
});

function NotesPage() {
  const run = useServerFn(summarizeNotes);
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRun = async () => {
    if (transcript.trim().length < 20) {
      toast.error("Paste a longer transcript (at least 20 characters).");
      return;
    }
    setLoading(true);
    try {
      const res = await run({ data: { transcript } });
      setSummary(res.text);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to summarize.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(summary);
    toast.success("Summary copied.");
  };

  return (
    <AppShell title="Meeting Notes Summarizer">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:py-10">
        <Card className="flex flex-col p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-4 w-4 text-brand" /> Transcript
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Paste your meeting transcript or raw notes.</p>
          <Textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Speaker 1: Welcome everyone…&#10;Speaker 2: Thanks. Let's start with the roadmap…"
            className="mt-4 min-h-[420px] flex-1 text-sm"
          />
          <Button onClick={handleRun} disabled={loading} className="mt-4 bg-brand text-brand-foreground hover:bg-brand-hover">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
            {loading ? "Summarizing…" : summary ? "Resummarize" : "Summarize meeting"}
          </Button>
        </Card>

        <Card className="flex flex-col p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Summary</h2>
            <Button size="sm" variant="outline" onClick={copy} disabled={!summary}>
              <Copy className="mr-2 h-4 w-4" /> Copy
            </Button>
          </div>
          <div className="prose-chat mt-4 min-h-[420px] flex-1 overflow-auto rounded-md border border-border bg-background p-4 text-sm">
            {summary ? (
              <ReactMarkdown>{summary}</ReactMarkdown>
            ) : (
              <p className="text-muted-foreground">Your structured summary will appear here.</p>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
