import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Loader2, MessageSquare, RotateCcw, Send, Sparkles, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Chatbot — Nimbus" },
      { name: "description", content: "A workplace-aware conversational assistant for quick queries." },
    ],
  }),
  component: ChatPage,
});

const STORAGE_KEY = "nimbus.chat.v1";

const SUGGESTIONS = [
  "Help me prepare for a 1:1 with my manager.",
  "Rewrite this Slack message to sound more diplomatic.",
  "What are some KPIs I can track for a product launch?",
  "Draft a polite reminder for a payment that's two weeks overdue.",
];

function loadInitial(): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UIMessage[]) : [];
  } catch {
    return [];
  }
}

function ChatPage() {
  const [epoch, setEpoch] = useState(0);
  const reset = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setEpoch((e) => e + 1);
  };
  return (
    <AppShell title="AI Chatbot">
      <ChatSurface key={epoch} onReset={reset} />
    </AppShell>
  );
}

function ChatSurface({ onReset }: { onReset: () => void }) {
  const [initial] = useState<UIMessage[]>(() => loadInitial());
  const { messages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    messages: initial,
    onError: (e) => toast.error(e.message || "Chat error."),
  });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* ignore */
    }
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [status]);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || status === "streaming" || status === "submitted") return;
    sendMessage({ text });
    setInput("");
  };

  const handleSuggestion = (text: string) => {
    if (status === "streaming" || status === "submitted") return;
    sendMessage({ text });
  };

  const busy = status === "streaming" || status === "submitted";
  const showEmpty = messages.length === 0;

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] w-full max-w-4xl flex-col px-4 py-4 sm:px-6">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MessageSquare className="h-4 w-4 text-brand" />
          <span>Workplace-aware conversational assistant.</span>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={onReset}>
            <RotateCcw className="mr-2 h-3.5 w-3.5" /> New conversation
          </Button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto rounded-xl border border-border bg-card p-4 sm:p-6">
        {showEmpty ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand text-brand-foreground shadow-sm">
              <Sparkles className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-foreground">How can I help today?</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Ask Nimbus anything about your workday — drafting, planning, summarizing, or strategy.
            </p>
            <div className="mt-6 grid w-full max-w-xl gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestion(s)}
                  className="rounded-lg border border-border bg-background p-3 text-left text-sm text-foreground transition hover:border-brand hover:bg-brand/5"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {status === "submitted" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-brand" />
                Nimbus is thinking…
              </div>
            )}
          </div>
        )}
      </div>

      <form onSubmit={submit} className="mt-3 flex items-end gap-2 rounded-xl border border-border bg-card p-2 focus-within:border-brand">
        <Textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message Nimbus…"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          className="min-h-[44px] max-h-40 flex-1 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
        {busy ? (
          <Button type="button" onClick={() => stop()} variant="outline" size="icon" className="shrink-0">
            <Loader2 className="h-4 w-4 animate-spin" />
          </Button>
        ) : (
          <Button type="submit" size="icon" className="shrink-0 bg-brand text-brand-foreground hover:bg-brand-hover" disabled={!input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        )}
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const text = message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");

  if (isUser) {
    return (
      <div className="flex justify-end gap-3">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-brand px-4 py-2.5 text-sm text-brand-foreground shadow-sm whitespace-pre-wrap">
          {text}
        </div>
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
          <User className="h-4 w-4" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-brand-foreground">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="prose-chat min-w-0 flex-1 text-sm text-foreground">
        {text ? <ReactMarkdown>{text}</ReactMarkdown> : <span className="text-muted-foreground">…</span>}
      </div>
    </div>
  );
}
