import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Copy, Loader2, Search } from "lucide-react";
import ReactMarkdown from "react-markdown";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { researchSummary } from "@/lib/ai-tools.functions";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "AI Research Assistant — Nimbus" },
      { name: "description", content: "Get structured research briefings with suggested citations." },
    ],
  }),
  component: ResearchPage,
});

function ResearchPage() {
  const run = useServerFn(researchSummary);
  const [query, setQuery] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRun = async () => {
    if (query.trim().length < 3) {
      toast.error("Enter a research question.");
      return;
    }
    setLoading(true);
    try {
      const res = await run({ data: { query, sourceText } });
      setResult(res.text);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to run research.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell title="AI Research Assistant">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-5 lg:py-10">
        <Card className="p-5 lg:col-span-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Search className="h-4 w-4 text-brand" /> Research query
          </h2>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="q">Question *</Label>
              <Input
                id="q"
                placeholder="e.g. What are best practices for B2B onboarding emails?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="src">Source material (optional)</Label>
              <Textarea
                id="src"
                placeholder="Paste an article, report, or web page text to ground the response."
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                rows={10}
              />
            </div>
            <Button onClick={handleRun} disabled={loading} className="w-full bg-brand text-brand-foreground hover:bg-brand-hover">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              {loading ? "Researching…" : result ? "Re-run research" : "Research"}
            </Button>
            <p className="text-[11px] leading-snug text-muted-foreground">
              Suggested citations are starting points — verify each source before professional use.
            </p>
          </div>
        </Card>

        <Card className="flex flex-col p-5 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Briefing</h2>
            <Button
              size="sm"
              variant="outline"
              disabled={!result}
              onClick={async () => {
                await navigator.clipboard.writeText(result);
                toast.success("Briefing copied.");
              }}
            >
              <Copy className="mr-2 h-4 w-4" /> Copy
            </Button>
          </div>
          <div className="prose-chat mt-4 min-h-[460px] flex-1 overflow-auto rounded-md border border-border bg-background p-4 text-sm">
            {result ? <ReactMarkdown>{result}</ReactMarkdown> : <p className="text-muted-foreground">Your research briefing will appear here.</p>}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
