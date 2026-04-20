import Link from "next/link";
import { Plus } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { dayOfWeek, todayInTimezone } from "@/lib/dates";
import { computeStreaks } from "@/lib/streaks";
import EmptyState from "@/components/app/EmptyState";
import HabitCard from "@/components/app/HabitCard";
import TimezoneCapture from "@/components/app/TimezoneCapture";

export default async function TodayPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Layout already guards this, but TypeScript doesn't know that.
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone, subscription_tier")
    .eq("id", user.id)
    .single();

  const tz = profile?.timezone ?? "UTC";
  const today = todayInTimezone(tz);
  const todayDow = dayOfWeek(today);

  const { data: habits } = await supabase
    .from("habits")
    .select("*")
    .is("archived_at", null)
    .order("created_at", { ascending: true });

  const habitList = habits ?? [];

  const habitIds = habitList.map((h) => h.id);
  const { data: checkIns } = habitIds.length
    ? await supabase
        .from("check_ins")
        .select("habit_id, local_date")
        .in("habit_id", habitIds)
    : { data: [] as { habit_id: string; local_date: string }[] };

  const checkInsByHabit = new Map<string, Set<string>>();
  for (const row of checkIns ?? []) {
    if (!checkInsByHabit.has(row.habit_id)) {
      checkInsByHabit.set(row.habit_id, new Set());
    }
    checkInsByHabit.get(row.habit_id)!.add(row.local_date);
  }

  const tier = profile?.subscription_tier ?? "free";
  const activeCount = habitList.length;
  const approachingFreeLimit = tier === "free" && activeCount >= 3;

  const locale = await getLocale();
  const t = await getTranslations("today");
  const dateLabel = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(`${today}T00:00:00`));

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 sm:py-14">
      <TimezoneCapture currentTimezone={tz} />

      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-orange">
            {t("eyebrow", { date: dateLabel })}
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold text-navy sm:text-5xl">
            {t("heading")}
          </h1>
        </div>
        {activeCount > 0 && !approachingFreeLimit && (
          <Link
            href="/app/habits/new"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-card bg-orange px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-orange-dark"
          >
            <Plus className="h-4 w-4" strokeWidth={3} />
            {t("newHabit")}
          </Link>
        )}
      </div>

      <div className="mt-8">
        {habitList.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="space-y-3">
            {habitList.map((habit) => {
              const checks = checkInsByHabit.get(habit.id) ?? new Set<string>();
              const stats = computeStreaks(
                checks,
                today,
                habit.target_days_of_week,
              );
              const isTargetToday =
                habit.target_days_of_week.includes(todayDow);
              return (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  stats={stats}
                  isTargetToday={isTargetToday}
                />
              );
            })}
          </ul>
        )}
      </div>

      {habitList.length > 0 && (
        <div className="mt-8 flex items-center justify-between gap-4 text-sm">
          {approachingFreeLimit ? (
            <p className="text-navy/60">{t("freeLimit")}</p>
          ) : (
            <Link
              href="/app/habits/new"
              className="inline-flex items-center gap-1.5 rounded-card border border-navy/15 bg-white px-4 py-2 font-semibold text-navy/80 hover:bg-navy/5 sm:hidden"
            >
              <Plus className="h-4 w-4" strokeWidth={3} />
              {t("newHabit")}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
