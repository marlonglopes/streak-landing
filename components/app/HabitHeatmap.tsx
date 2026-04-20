import { getLocale, getTranslations } from "next-intl/server";
import type { HeatmapCell } from "@/lib/stats";

type Props = {
  grid: HeatmapCell[][];
  /** Whether the habit has zero check-ins — used to show a gentler empty hint. */
  hasAnyHistory: boolean;
};

/** Narrow weekday initials (S, M, T...) in the active locale, starting Sunday. */
function getWeekdayInitials(locale: string): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: "narrow" });
  return Array.from({ length: 7 }, (_, i) =>
    fmt.format(new Date(Date.UTC(2024, 0, 7 + i))),
  );
}

function getMonthShort(locale: string, month: number): string {
  return new Intl.DateTimeFormat(locale, { month: "short" }).format(
    new Date(Date.UTC(2024, month, 1)),
  );
}

function cellClass(cell: HeatmapCell): string {
  if (cell.isFuture) return "bg-transparent";
  if (cell.isChecked) {
    return cell.isToday
      ? "bg-orange ring-2 ring-orange/40 ring-offset-1 ring-offset-cream"
      : "bg-orange";
  }
  if (!cell.isTarget) return "bg-navy/5";
  return cell.isToday
    ? "border border-orange/60 bg-white"
    : "border border-navy/10 bg-white";
}

type TitleFn = (cell: HeatmapCell) => string;

function makeCellTitle(
  t: Awaited<ReturnType<typeof getTranslations<"heatmap">>>,
): TitleFn {
  return (cell) => {
    if (cell.isFuture) return "";
    const today = cell.isToday ? "yes" : "no";
    if (cell.isChecked) return t("cellChecked", { date: cell.date, today });
    if (!cell.isTarget) return t("cellRest", { date: cell.date, today });
    return t("cellMissed", { date: cell.date, today });
  };
}

function monthLabels(grid: HeatmapCell[][], locale: string): (string | null)[] {
  const labels: (string | null)[] = [];
  let prevMonth: number | null = null;
  for (const col of grid) {
    const top = col[0];
    if (top.isFuture && !col.some((c) => !c.isFuture)) {
      labels.push(null);
      continue;
    }
    const month = Number(top.date.slice(5, 7)) - 1;
    labels.push(month !== prevMonth ? getMonthShort(locale, month) : null);
    prevMonth = month;
  }
  return labels;
}

export default async function HabitHeatmap({ grid, hasAnyHistory }: Props) {
  const t = await getTranslations("heatmap");
  const locale = await getLocale();
  const dayLabels = getWeekdayInitials(locale);
  const labels = monthLabels(grid, locale);
  const cellTitle = makeCellTitle(t);

  return (
    <div>
      <div className="flex items-start gap-2">
        <div className="flex flex-col gap-[3px] pt-4 text-[10px] text-navy/40">
          {dayLabels.map((d, i) => (
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
        <p className="mt-3 text-xs text-navy/50">{t("noHistory")}</p>
      )}

      <div className="mt-3 flex items-center gap-3 text-xs text-navy/60">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-[3px] border border-navy/10 bg-white" />
          {t("missed")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-[3px] bg-navy/5" />
          {t("rest")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-[3px] bg-orange" />
          {t("done")}
        </span>
      </div>
    </div>
  );
}
