import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, FileText, ListTodo, Search, MessageSquare, ArrowRight, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Nimbus" },
      { name: "description", content: "Your AI workplace command center: emails, notes, tasks, research and chat." },
    ],
  }),
  component: Dashboard,
});

const tools = [
  { title: "Email Generator", desc: "Draft polished, on-brand emails in seconds.", url: "/email", icon: Mail, accent: "brand" as const },
  { title: "Notes Summarizer", desc: "Turn transcripts into takeaways, decisions, and action items.", url: "/notes", icon: FileText, accent: "red" as const },
  { title: "Task Planner", desc: "Convert plain-English goals into structured tasks with deadlines.", url: "/tasks", icon: ListTodo, accent: "brand" as const },
  { title: "Research Assistant", desc: "Get structured briefings with suggested citations.", url: "/research", icon: Search, accent: "red" as const },
  { title: "AI Chatbot", desc: "A workplace-aware conversational assistant.", url: "/chat", icon: MessageSquare, accent: "brand" as const },
];

function Dashboard() {
  return (
    <AppShell title="Dashboard">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="mb-10 flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand text-brand-foreground shadow-sm">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Good to see you. What are we shipping today?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick a tool below or start a conversation with Nimbus.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((t) => (
            <Link key={t.url} to={t.url} className="group block">
              <Card className="h-full border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div
                    className={
                      t.accent === "red"
                        ? "grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent-red/10 text-accent-red"
                        : "grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand"
                    }
                  >
                    <t.icon className="h-5 w-5" />
                  </div>
                  <h3 className="truncate text-base font-semibold text-foreground">{t.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-brand opacity-80 transition group-hover:opacity-100">
                  Open <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground">Responsible AI</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Nimbus accelerates your work but does not replace your judgment. Always review AI-generated
            content for accuracy, tone, and confidentiality before sending it externally.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
