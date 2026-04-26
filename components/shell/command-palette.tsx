"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LayoutGrid,
  Activity,
  GitPullRequest,
  CalendarDays,
  Video,
  FolderOpen,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { patients } from "@/lib/mock-data/patients";
import { pullRequests } from "@/lib/mock-data/prs";

const SECTIONS = [
  { key: "", label: "Overview", icon: <LayoutGrid /> },
  { key: "/plan", label: "Treatment plan", icon: <Activity /> },
  { key: "/prs", label: "Pull requests", icon: <GitPullRequest /> },
  { key: "/followup", label: "Followup", icon: <CalendarDays /> },
  { key: "/meetings", label: "Meetings", icon: <Video /> },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="top-[18%] max-w-[640px] translate-y-0 overflow-hidden rounded-xl p-0 sm:max-w-[640px]"
      >
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <DialogDescription className="sr-only">
          Jump to a patient, section, or pull request.
        </DialogDescription>
        <Command className="rounded-xl">
          <CommandInput placeholder="Jump to a patient, section, or pull request…" />
          <CommandList className="max-h-[420px]">
            <CommandEmpty>No results.</CommandEmpty>

            <CommandGroup heading="Workspace">
              <CommandItem onSelect={() => go("/")}>
                <FolderOpen className="text-violet-500" />
                <span>Patient vaults</span>
                <CommandShortcut>Home</CommandShortcut>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Patients">
              {patients.map((p) => (
                <CommandItem
                  key={p.id}
                  keywords={[p.name, p.cancerType, p.diagnosis, p.mrn]}
                  onSelect={() => go(`/patients/${p.id}`)}
                >
                  <Stethoscope className="text-rose-500" />
                  <span>{p.name}</span>
                  <span className="ml-2 text-[11.5px] text-muted-foreground">
                    {p.cancerLabel}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Sections">
              {patients.flatMap((p) =>
                SECTIONS.map((s) => (
                  <CommandItem
                    key={`${p.id}${s.key}`}
                    keywords={[p.name, s.label]}
                    onSelect={() => go(`/patients/${p.id}${s.key}`)}
                  >
                    <span className="text-muted-foreground">{s.icon}</span>
                    <span>
                      {p.name.split(" ")[0]} · {s.label}
                    </span>
                  </CommandItem>
                ))
              )}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Pull requests">
              {pullRequests.slice(0, 8).map((pr) => (
                <CommandItem
                  key={pr.id}
                  keywords={[pr.title, pr.summary, pr.id]}
                  onSelect={() => go(`/patients/${pr.patientId}/prs/${pr.id}`)}
                >
                  <GitPullRequest className="text-violet-500" />
                  <span className="truncate">{pr.title}</span>
                  <span className="ml-auto mono text-[10.5px] text-muted-foreground">
                    {pr.id}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Agent">
              <CommandItem onSelect={() => setOpen(false)}>
                <Sparkles className="text-violet-500" />
                <span>Ask the agent…</span>
                <CommandShortcut>⌘ /</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
