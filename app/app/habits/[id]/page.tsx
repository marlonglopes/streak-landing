import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Settings } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { dayOfWeek, todayInTimezone } from "@/lib/dates";
import { computeStreaks } from "@/lib/streaks";
import {
  buildHeatmap,
  monthlyCompletionRate,
  weeklyCompletionRate,
} from "@/lib/stats";
import CheckInButton from "@/components/app/CheckInButton";
import HabitHeatmap from "@/components/app/HabitHeatmap";
import HabitStats from "@/components/app/HabitStats";

const HEATMAP_WEEKS = 26;

/** Short weekday labels in the active locale, starting Sunday. */
function getWeekdayShort(locale: string): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: "short" });
  return Array.from({ length: 7 }, (_, i) =>
    fmt.format(new Date(Date.UTC(2024, 0, 7 + i))),
  );
}

export default async function HabitDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [habitResult, profileResult] = await Promise.all([
    supabase.from("habits").select("*").eq("id", params.id).maybeSingle(),
    supabase
      .from("profiles")
      .select("timezone")
      .eq("id", user.id)
      .single(),
  ]);

  const habit = habitResult.data;
  if (!habit) notFound();

  const tz = profileResult.data?.timezone ?? "UTC";
  const today = todayInTimezone(tz);
  const todayDow = dayOfWeek(today);

  const { data: checkInRows } = await supabase
    .from("check_ins")
    .select("local_date")
    .eq("habit_id", habit.id);

  const checkIns = new Set((checkInRows ?? []).map((r) => r.local_date));
  const targetDays = new Set(habit.target_days_of_week);

  const stats = computeStreaks(checkIns, today, habit.target_days_of_week);
  const weekly = weeklyCompletionRate(checkIns, today, targetDays);
  const monthly = monthlyCompletionRate(checkIns, today, targetDays);
  const grid = buildHeatmap(checkIns, today, targetDays, HEATMAP_WEEKS);

  const isTargetToday = targetDays.has(todayDow);
  const t = await getTranslations("habitDetail");
  const locale = await getLocale();
  const dayShort = getWeekdayShort(locale);
  const targetDayLabel =
    targetDays.size === 7
      ? t("everyDay")
      : habit.target_days_of_week
          .slice()
          .sort((a, b) => a - b)
          .map((d) => dayShort[d])
          .join(", ");
  const cadenceLabel =
    habit.cadence === "weekly" ? t("cadence.weekly") : t("cadence.daily");

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 sm:py-14">
      <Link
        href="/app"
        className="inline-flex items-center gap-1 text-sm font-medium text-navy/60 hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" /> {t("back")}
      </Link>

      <header className="mt-4 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-card bg-cream text-3xl"
            aria-hidden
          >
            {habit.emoji ?? "•"}
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-display text-3xl font-bold text-navy sm:text-4xl">
              {habit.name}
            </h1>
            <p className="mt-1 text-sm text-navy/60">
              {cadenceLabel} · {targetDayLabel}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <CheckInButton
            habitId={habit.id}
            isDoneToday={stats.isDoneToday}
            isTargetToday={isTargetToday}
          />
          <Link
            href={`/app/habits/${habit.id}/edit`}
            aria-label={t("editAria")}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-navy/15 bg-white text-navy/70 hover:bg-navy/5"
          >
            <Settings className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <section className="mt-8">
        <HabitStats
          current={stats.current}
          longest={stats.longest}
          weeklyRate={weekly}
          monthlyRate={monthly}
        />
      </section>

      <section className="mt-8 rounded-card border border-navy/5 bg-white p-5 shadow-soft">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-lg font-bold text-navy">
            {t("lastWeeks", { count: HEATMAP_WEEKS })}
          </h2>
          <span className="text-xs text-navy/50">
            {t("totalCheckIns", { count: checkIns.size })}
          </span>
        </div>
        <HabitHeatmap grid={grid} hasAnyHistory={checkIns.size > 0} />
      </section>
    </div>
  );
}
