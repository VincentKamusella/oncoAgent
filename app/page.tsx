import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { WorkspaceSidebar } from "@/components/home/workspace-sidebar";
import { VaultCard } from "@/components/home/vault-card";
import { getAllPatients, prsForPatient } from "@/lib/data";

export default async function HomePage() {
  const patients = await getAllPatients();
  const patientCards = await Promise.all(
    patients.map(async (p) => {
      const prs = await prsForPatient(p.id);
      const open = prs.filter(
        (pr) => pr.status === "open" || pr.status === "needs-review"
      ).length;
      const conflict = prs.filter((pr) => pr.status === "conflict").length;
      return { patient: p, factsCount: p.facts.length, openPRs: open, conflictPRs: conflict };
    })
  );

  return (
    <div className="bg-aurora-strong flex h-full w-full gap-2.5 overflow-hidden p-2.5">
      <WorkspaceSidebar active="vaults" />

      <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-[var(--shadow-soft)]">
        <header className="relative z-20 flex items-center justify-between gap-4 border-b border-border bg-background/60 px-8 py-4 backdrop-blur">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search patients, records, PRs…"
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

        <section className="flex-1 overflow-y-auto px-8 pt-10 pb-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="mono text-[11px] uppercase tracking-[0.16em] text-violet-600">
                Workspace
              </span>
              <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-foreground">
                Patient vaults
              </h1>
              <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted-foreground">
                Each vault holds a patient&apos;s structured context base — records,
                treatment plan, imaging, and the history of every change. Agents work
                inside; you stay in the loop.
              </p>
            </div>
            <Link
              href="/patients/new"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-violet-500 px-3.5 text-[13px] font-medium text-white shadow-[var(--shadow-soft)] transition-colors hover:bg-violet-600"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New patient</span>
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {patientCards.map((c) => (
              <VaultCard
                key={c.patient.id}
                patient={c.patient}
                factsCount={c.factsCount}
                openPRs={c.openPRs}
                conflictPRs={c.conflictPRs}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
