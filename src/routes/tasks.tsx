import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CalendarPlus, Check, Download, ListTodo, Loader2, Plus, Trash2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { planTasks } from "@/lib/ai-tools.functions";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "AI Task Planner — Nimbus" },
      { name: "description", content: "Turn natural-language goals into structured tasks with deadlines." },
    ],
  }),
  component: TasksPage,
});

type Task = {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  dueInDays: number;
  estimateHours: number;
  done: boolean;
};

type AIResponse = {
  summary: string;
  tasks: Omit<Task, "id" | "done">[];
};

const STORAGE_KEY = "nimbus.tasks.v1";

function parseAI(raw: string): AIResponse | null {
  try {
    const cleaned = raw.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
    return JSON.parse(cleaned) as AIResponse;
  } catch {
    return null;
  }
}

function dueDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function priorityClass(p: Task["priority"]) {
  if (p === "high") return "bg-accent-red/10 text-accent-red border-accent-red/20";
  if (p === "medium") return "bg-brand/10 text-brand border-brand/20";
  return "bg-muted text-muted-foreground border-border";
}

function downloadICS(tasks: Task[]) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Nimbus//Tasks//EN",
  ];
  for (const t of tasks) {
    const d = dueDate(t.dueInDays);
    const stamp = d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const date = d.toISOString().split("T")[0].replace(/-/g, "");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${t.id}@nimbus`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${date}`,
      `SUMMARY:${t.title.replace(/\n/g, " ")}`,
      `DESCRIPTION:${(t.description + ` [priority: ${t.priority}, est ${t.estimateHours}h]`).replace(/\n/g, " ")}`,
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "nimbus-tasks.ics";
  a.click();
  URL.revokeObjectURL(url);
}

function TasksPage() {
  const run = useServerFn(planTasks);
  const [goal, setGoal] = useState("");
  const [summary, setSummary] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { summary: string; tasks: Task[] };
        setSummary(parsed.summary ?? "");
        setTasks(parsed.tasks ?? []);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ summary, tasks }));
  }, [summary, tasks]);

  const handlePlan = async () => {
    if (goal.trim().length < 5) {
      toast.error("Describe your goal in a bit more detail.");
      return;
    }
    setLoading(true);
    try {
      const res = await run({ data: { description: goal } });
      const parsed = parseAI(res.text);
      if (!parsed) {
        toast.error("Couldn't parse the plan. Try rephrasing your goal.");
        return;
      }
      setSummary(parsed.summary);
      const withIds: Task[] = parsed.tasks.map((t) => ({
        ...t,
        id: crypto.randomUUID(),
        done: false,
      }));
      setTasks(withIds);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to plan tasks.");
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id: string) =>
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const remove = (id: string) => setTasks((ts) => ts.filter((t) => t.id !== id));
  const addBlank = () =>
    setTasks((ts) => [
      ...ts,
      {
        id: crypto.randomUUID(),
        title: "New task",
        description: "",
        priority: "medium",
        dueInDays: 3,
        estimateHours: 1,
        done: false,
      },
    ]);
  const updateTitle = (id: string, title: string) =>
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, title } : t)));

  return (
    <AppShell title="AI Task Planner">
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:py-10">
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <ListTodo className="h-4 w-4 text-brand" /> Describe your goal
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Plain English works best. e.g. "Launch our Q3 newsletter campaign over the next two weeks."
          </p>
          <Textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="What do you want to accomplish?"
            rows={3}
            className="mt-4"
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={handlePlan} disabled={loading} className="bg-brand text-brand-foreground hover:bg-brand-hover">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ListTodo className="mr-2 h-4 w-4" />}
              {loading ? "Planning…" : "Plan it"}
            </Button>
            {tasks.length > 0 && (
              <Button variant="outline" onClick={() => downloadICS(tasks)}>
                <Download className="mr-2 h-4 w-4" /> Export .ics
              </Button>
            )}
            {tasks.length > 0 && (
              <Button variant="outline" onClick={addBlank}>
                <Plus className="mr-2 h-4 w-4" /> Add task
              </Button>
            )}
          </div>
          {summary && (
            <div className="mt-4 rounded-md border border-brand/20 bg-brand/5 p-3 text-sm text-foreground">
              <span className="font-medium text-brand">Plan: </span>
              {summary}
            </div>
          )}
        </Card>

        {tasks.length > 0 && (
          <div className="grid gap-3">
            {tasks.map((t) => {
              const due = dueDate(t.dueInDays);
              return (
                <Card key={t.id} className={`flex items-start gap-3 p-4 transition ${t.done ? "opacity-60" : ""}`}>
                  <Checkbox
                    checked={t.done}
                    onCheckedChange={() => toggle(t.id)}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        value={t.title}
                        onChange={(e) => updateTitle(t.id, e.target.value)}
                        className={`min-w-0 flex-1 bg-transparent text-base font-medium text-foreground focus:outline-none ${t.done ? "line-through" : ""}`}
                      />
                      <Badge variant="outline" className={priorityClass(t.priority)}>{t.priority}</Badge>
                      <Badge variant="outline" className="border-border text-muted-foreground">
                        <CalendarPlus className="mr-1 h-3 w-3" /> {formatDate(due)}
                      </Badge>
                      <Badge variant="outline" className="border-border text-muted-foreground">
                        {t.estimateHours}h
                      </Badge>
                    </div>
                    {t.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove(t.id)} className="text-muted-foreground hover:text-accent-red">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </Card>
              );
            })}
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Check className="h-3 w-3" /> Tasks save automatically in this browser.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
