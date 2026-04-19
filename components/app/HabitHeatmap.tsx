import type { HeatmapCell } from "@/lib/stats";

type Props = {
  grid: HeatmapCell[][];
  /** Whether the habit has zero check-ins — used to show a gentler empty hint. */
  hasAnyHistory: boolean;
};

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function cellClass(cell: HeatmapCell): string {
  if (cell.isFuture) return "bg-transparent";
  if (cell.isChecked) {
    return cell.isToday
      ? "bg-orange ring-2 ring-orange/40 ring-offset-1 ring-offset-cream"
      : "bg-orange";
  }
  if (!cell.isTarget) return "bg-navy/5";
  // Target day, not checked.
  return cell.isToday
    ? "border border-orange/60 bg-white"
    : "border border-navy/10 bg-white";
}

function cellTitle(cell: HeatmapCell): string {
  if (cell.isFuture) return "";
  const suffix = cell.isToday ? " (today)" : "";
  if (cell.isChecked) return `${cell.date}${suffix} — ✓ checked in`;
  if (!cell.isTarget) return `${cell.date}${suffix} — rest day`;
  return `${cell.date}${suffix} — missed`;
}

function monthLabels(grid: HeatmapCell[][]): (string | null)[] {
  // A month label appears on the first column whose top cell starts a new month.
  const labels: (string | null)[] = [];
  let prevMonth: number | null = null;
  for (const col of grid) {
    const top = col[0];
    if (top.isFuture && !col.some((c) => !c.isFuture)) {
      labels.push(null);
      continue;
    }
    const month = Number(top.date.slice(5, 7)) - 1;
    labels.push(month !== prevMonth ? MONTHS[month] : null);
    prevMonth = month;
  }
  return labels;
}

export default function HabitHeatmap({ grid, hasAnyHistory }: Props) {
  const labels = monthLabels(grid);

  return (
    <div>
      <div className="flex items-start gap-2">
        {/* Day-of-week labels on the left. */}
        <div className="flex flex-col gap-[3px] pt-4 text-[10px] text-navy/40">
          {DAY_LABELS.map((d, i) => (
            <span
              key={i}
              className="flex h-3 items-center leading-none"
              aria-hidden
            >
              {i % 2 === 1 ? d : ""}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1 overflow-x-auto pb-1">
          {/* Month labels above the grid. */}
          <div
            className="flex gap-[3px] pb-1 text-[10px] text-navy/50"
            aria-hidden
          >
            {labels.map((l, i) => (
              <span key={i} className="w-3 shrink-0">
                {l ?? ""}
              </span>
            ))}
          </div>
          <div className="flex gap-[3px]">
            {grid.map((col, ci) => (
              <div key={ci} className="flex flex-col gap-[3px]">
                {col.map((cell) => (
                  <div
                    key={cell.date}
                    title={cellTitle(cell)}
                    aria-label={cellTitle(cell) || undefined}
                    className={`h-3 w-3 rounded-[3px] ${cellClass(cell)}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {!hasAnyHistory && (
        <p className="mt-3 text-xs text-navy/50">
          No check-ins yet. Each square fills when you check in.
        </p>
      )}

      <div className="mt-3 flex items-center gap-3 text-xs text-navy/60">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-[3px] border border-navy/10 bg-white" />
          missed
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-[3px] bg-navy/5" />
          rest
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-[3px] bg-orange" />
          done
        </span>
      </div>
    </div>
  );
}
