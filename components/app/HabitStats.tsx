import { Flame, Trophy, CalendarDays, CalendarRange } from "lucide-react";
import { getTranslations } from "next-intl/server";

type Props = {
  current: number;
  longest: number;
  weeklyRate: number | null;
  monthlyRate: number | null;
};

function formatRate(rate: number | null): string {
  if (rate === null) return "—";
  return `${Math.round(rate * 100)}%`;
}

function Card({
  icon,
  label,
  value,
  sublabel,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={
        accent
          ? "rounded-card bg-orange/10 p-4 ring-1 ring-orange/20"
          : "rounded-card border border-navy/5 bg-white p-4 shadow-soft"
      }
    >
      <div
        className={`flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide ${
          accent ? "text-orange-dark" : "text-navy/50"
        }`}
      >
        {icon}
        {label}
      </div>
      <div
        className={`mt-1 font-display text-3xl font-bold ${
          accent ? "text-orange-dark" : "text-navy"
        }`}
      >
        {value}
      </div>
      {sublabel && (
        <div className="mt-0.5 text-xs text-navy/50">{sublabel}</div>
      )}
    </div>
  );
}

export default async function HabitStats({
  current,
  longest,
  weeklyRate,
  monthlyRate,
}: Props) {
  const t = await getTranslations("habitStats");
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Card
        icon={<Flame className="h-3.5 w-3.5" strokeWidth={2.5} />}
        label={t("current")}
        value={`${current}`}
        sublabel={t("days", { count: current })}
        accent={current > 0}
      />
      <Card
        icon={<Trophy className="h-3.5 w-3.5" strokeWidth={2.5} />}
        label={t("longest")}
        value={`${longest}`}
        sublabel={t("days", { count: longest })}
      />
      <Card
        icon={<CalendarDays className="h-3.5 w-3.5" strokeWidth={2.5} />}
        label={t("weeklyRate")}
        value={formatRate(weeklyRate)}
        sublabel={t("lastWeek")}
      />
      <Card
        icon={<CalendarRange className="h-3.5 w-3.5" strokeWidth={2.5} />}
        label={t("monthlyRate")}
        value={formatRate(monthlyRate)}
        sublabel={t("lastMonth")}
      />
    </div>
  );
}
