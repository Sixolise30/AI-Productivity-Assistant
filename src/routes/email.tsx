import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Copy, Loader2, Sparkles } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateEmail } from "@/lib/ai-tools.functions";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Email Generator — Nimbus" },
      { name: "description", content: "Generate professional emails with tone control and editable output." },
    ],
  }),
  component: EmailPage,
});

type Tone = "professional" | "friendly" | "concise" | "persuasive" | "apologetic";

function EmailPage() {
  const run = useServerFn(generateEmail);
  const [purpose, setPurpose] = useState("");
  const [recipient, setRecipient] = useState("");
  const [tone, setTone] = useState<Tone>("professional");
  const [keyPoints, setKeyPoints] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!purpose.trim()) {
      toast.error("Please describe the purpose of the email.");
      return;
    }
    setLoading(true);
    try {
      const res = await run({ data: { purpose, recipient, tone, keyPoints } });
      setOutput(res.text);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate email.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    toast.success("Email copied to clipboard.");
  };

  return (
    <AppShell title="Email Generator">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:py-10">
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Sparkles className="h-4 w-4 text-brand" /> Prompt
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Fill in the structured fields. Nimbus drafts a complete email.
          </p>
          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose of the email *</Label>
              <Textarea
                id="purpose"
                placeholder="e.g. Follow up with a client after our discovery call and propose next steps."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={4}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient</Label>
                <Input
                  id="recipient"
                  placeholder="e.g. Sarah, VP of Marketing"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tone">Tone</Label>
                <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
                  <SelectTrigger id="tone"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="concise">Concise</SelectItem>
                    <SelectItem value="persuasive">Persuasive</SelectItem>
                    <SelectItem value="apologetic">Apologetic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="key">Key points</Label>
              <Textarea
                id="key"
                placeholder="Bullet points or notes you'd like included."
                value={keyPoints}
                onChange={(e) => setKeyPoints(e.target.value)}
                rows={3}
              />
            </div>
            <Button onClick={handleGenerate} disabled={loading} className="w-full bg-brand text-brand-foreground hover:bg-brand-hover">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {loading ? "Drafting…" : output ? "Regenerate" : "Generate email"}
            </Button>
          </div>
        </Card>

        <Card className="flex flex-col p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Draft</h2>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              disabled={!output}
            >
              <Copy className="mr-2 h-4 w-4" /> Copy
            </Button>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Editable — refine before sending.</p>
          <Textarea
            value={output}
            onChange={(e) => setOutput(e.target.value)}
            placeholder="Your AI-drafted email will appear here…"
            className="mt-4 min-h-[420px] flex-1 font-mono text-sm leading-relaxed"
          />
        </Card>
      </div>
    </AppShell>
  );
}
