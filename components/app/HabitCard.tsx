import Link from "next/link";
import { Flame } from "lucide-react";
import CheckInButton from "./CheckInButton";
import type { Habit } from "@/lib/database.types";
import type { StreakStats } from "@/lib/streaks";

type Props = {
  habit: Habit;
  stats: StreakStats;
  isTargetToday: boolean;
};

export default function HabitCard({ habit, stats, isTargetToday }: Props) {
  return (
    <li className="flex items-center gap-4 rounded-card border border-navy/5 bg-white p-4 shadow-soft">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-cream text-2xl"
        aria-hidden
      >
        {habit.emoji ?? "•"}
      </div>

      <div className="min-w-0 flex-1">
        <Link
          href={`/app/habits/${habit.id}`}
          className="block truncate font-display text-lg font-bold text-navy hover:text-orange-dark"
        >
          {habit.name}
        </Link>
        <div className="mt-0.5 flex items-center gap-3 text-sm text-navy/60">
          <span
            className="inline-flex items-center gap-1 font-medium text-navy/80"
            title="Current streak"
          >
            <Flame
              className={
                stats.current > 0 ? "h-4 w-4 text-orange" : "h-4 w-4 text-navy/30"
              }
              strokeWidth={2.5}
            />
            {stats.current} day{stats.current === 1 ? "" : "s"}
          </span>
          <span className="text-navy/30">·</span>
          <span title="Longest streak">best {stats.longest}</span>
          {!isTargetToday && (
            <>
              <span className="text-navy/30">·</span>
              <span className="text-navy/50">rest day</span>
            </>
          )}
        </div>
      </div>

      <CheckInButton
        habitId={habit.id}
        isDoneToday={stats.isDoneToday}
        isTargetToday={isTargetToday}
      />
    </li>
  );
}
