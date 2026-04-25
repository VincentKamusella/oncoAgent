import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkspaceSidebar } from "@/components/home/workspace-sidebar";
import { VaultCard } from "@/components/home/vault-card";
import { AgentsTable } from "@/components/home/agents-table";
import { SourcesTable } from "@/components/home/sources-table";
import { FloatingOverlay } from "@/components/home/floating-overlay";
import { patients } from "@/lib/mock-data/patients";
import { prsForPatient } from "@/lib/mock-data/prs";
import { activeAgents, dataSources } from "@/lib/mock-data/sources";

export default function HomePage() {
  return (
    <div className="bg-aurora-strong flex min-h-screen w-full">
      <WorkspaceSidebar active="vaults" />

      <main className="relative flex-1 overflow-hidden">
        <header className="relative z-20 flex items-center justify-between gap-4 border-b border-border bg-background/60 px-8 py-4 backdrop-blur">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search patients, facts, PRs…"
              className="h-9 rounded-lg border-border bg-card pl-8 text-[13px] shadow-none placeholder:text-muted-foreground/70 focus-visible:ring-violet-200"
            />
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 mono text-[10px] text-muted-foreground sm:inline">
              ⌘K
            </kbd>
          </div>
          <span className="hidden mono text-[11px] uppercase tracking-wider text-muted-foreground sm:inline">
            {new Date().toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </span>
        </header>

        <div className="relative">
          <FloatingOverlay>
            <AgentsTable agents={activeAgents} patients={patients} />
            <SourcesTable sources={dataSources} />
          </FloatingOverlay>

          <section className="px-8 pt-10 pb-16 xl:pr-[480px]">
            <div className="flex items-end justify-between gap-4">
              <div>
                <span className="mono text-[11px] uppercase tracking-[0.16em] text-violet-600">
                  Workspace
                </span>
                <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-foreground">
                  Patient vaults
                </h1>
                <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted-foreground">
                  Each vault holds a patient&apos;s structured context base — facts,
                  treatment plan, imaging, and the history of every change. Agents work
                  inside; you stay in the loop.
                </p>
              </div>
              <Button className="h-9 gap-1.5 rounded-lg bg-violet-500 px-3.5 text-[13px] font-medium hover:bg-violet-600">
                <Plus className="h-3.5 w-3.5" />
                <span>New patient</span>
              </Button>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {patients.map((p) => {
                const prs = prsForPatient(p.id);
                const open = prs.filter(
                  (pr) => pr.status === "open" || pr.status === "needs-review"
                ).length;
                const conflict = prs.filter((pr) => pr.status === "conflict").length;
                return (
                  <VaultCard
                    key={p.id}
                    patient={p}
                    factsCount={p.facts.length}
                    openPRs={open}
                    conflictPRs={conflict}
                  />
                );
              })}
            </div>

            <p className="mt-10 max-w-xl text-[12px] text-muted-foreground/80">
              Showing {patients.length} active vaults · {dataSources.filter((d) => d.status === "active").length} of {dataSources.length} data sources connected
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
