import { type ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/sonner";

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur">
            <SidebarTrigger className="text-muted-foreground hover:text-brand" />
            <div className="h-5 w-px bg-border" />
            <h1 className="truncate text-sm font-semibold text-foreground">{title}</h1>
          </header>
          <main className="flex-1 min-w-0">{children}</main>
          <footer className="border-t border-border bg-card/50 px-4 py-3 text-center text-[11px] text-muted-foreground">
            AI-generated content should be reviewed before use in professional settings.
          </footer>
        </div>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}
