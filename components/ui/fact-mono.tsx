import { cn } from "@/lib/utils";

export function FactMono({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("mono text-[12.5px] text-foreground/80", className)}>
      {children}
    </span>
  );
}
