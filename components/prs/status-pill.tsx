import type { PRStatus } from "@/lib/types";
import {
  PR_STATUS_COLOR,
  PR_STATUS_ICON,
  PR_STATUS_LABEL,
} from "./pr-status";

export function StatusPill({
  status,
  size = "md",
}: {
  status: PRStatus;
  size?: "sm" | "md";
}) {
  const Icon = PR_STATUS_ICON[status];
  const padding = size === "sm" ? "h-5 px-2" : "h-7 px-3";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";
  const textSize = size === "sm" ? "text-[11px]" : "text-[12.5px]";
  return (
    <span
      className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-full font-medium tracking-tight text-white ${padding} ${textSize}`}
      style={{ backgroundColor: PR_STATUS_COLOR[status] }}
    >
      <Icon className={iconSize} />
      {PR_STATUS_LABEL[status]}
    </span>
  );
}
