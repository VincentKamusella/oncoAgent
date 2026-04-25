import { format } from "date-fns";
import {
  FileText,
  ScrollText,
  Table as TableIcon,
  Image as ImageIcon,
} from "lucide-react";
import type { Attachment, AttachmentKind } from "@/lib/types";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<AttachmentKind, string> = {
  image: "Image",
  pdf: "PDF",
  table: "Table",
  report: "Report",
};

const KIND_ICON: Record<AttachmentKind, React.ReactNode> = {
  image: <ImageIcon className="h-3.5 w-3.5" />,
  pdf: <FileText className="h-3.5 w-3.5" />,
  table: <TableIcon className="h-3.5 w-3.5" />,
  report: <ScrollText className="h-3.5 w-3.5" />,
};

const KIND_TONE: Record<AttachmentKind, string> = {
  image: "text-violet-600",
  pdf: "text-rose-600",
  table: "text-sky-600",
  report: "text-amber-700",
};

export function FileRow({ attachment }: { attachment: Attachment }) {
  return (
    <div className="grid grid-cols-[1fr_84px_140px_72px] items-center gap-4 px-4 py-2 text-[12.5px] hover:bg-muted/40">
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className={cn(
            "grid h-7 w-7 flex-shrink-0 place-items-center rounded-md bg-muted/60",
            KIND_TONE[attachment.kind]
          )}
        >
          {KIND_ICON[attachment.kind]}
        </span>
        <span className="truncate font-medium text-foreground">
          {attachment.name}
        </span>
      </div>
      <span className="mono text-[11px] uppercase tracking-wider text-muted-foreground">
        {KIND_LABEL[attachment.kind]}
      </span>
      <span className="truncate text-[12px] text-muted-foreground">
        {attachment.source ?? "—"}
      </span>
      <span className="mono text-[11px] tabular-nums text-muted-foreground/80">
        {format(new Date(attachment.date), "MMM d")}
      </span>
    </div>
  );
}
