import { Sparkles } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";

export function CommentCard({
  author,
  at,
  role,
  children,
}: {
  author: string;
  at: string;
  role?: string;
  children: React.ReactNode;
}) {
  return (
    <article className="overflow-hidden rounded-md border border-border bg-paper">
      <header className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2">
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-700 text-white">
          <Sparkles className="h-3 w-3" strokeWidth={2.25} />
        </span>
        <span className="text-[12.5px] font-semibold tracking-tight text-foreground">
          {author}
        </span>
        <span className="text-[12.5px] text-muted-foreground">
          commented{" "}
          {formatDistanceToNowStrict(new Date(at), { addSuffix: true })}
        </span>
        {role && (
          <span className="ml-1 inline-flex h-5 items-center rounded-full border border-border px-2 text-[10.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            {role}
          </span>
        )}
      </header>
      <div className="px-4 py-4 text-[13.5px] leading-relaxed text-foreground">
        {children}
      </div>
    </article>
  );
}
