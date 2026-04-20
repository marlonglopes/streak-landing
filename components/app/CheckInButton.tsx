import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { toggleCheckIn } from "@/app/actions/habits";

type Props = {
  habitId: string;
  isDoneToday: boolean;
  isTargetToday: boolean;
};

export default async function CheckInButton({
  habitId,
  isDoneToday,
  isTargetToday,
}: Props) {
  const t = await getTranslations("habitCard");

  if (!isTargetToday) {
    return (
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-dashed border-navy/20 text-xs font-medium text-navy/40"
        aria-label={t("notTargetDay")}
      >
        —
      </div>
    );
  }

  return (
    <form action={toggleCheckIn}>
      <input type="hidden" name="habit_id" value={habitId} />
      <button
        type="submit"
        aria-label={isDoneToday ? t("undoCheckIn") : t("checkIn")}
        aria-pressed={isDoneToday}
        className={
          isDoneToday
            ? "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange text-white shadow-glow transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange/40"
            : "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-navy/20 bg-white text-navy/30 transition-colors hover:border-orange hover:text-orange focus:outline-none focus:ring-2 focus:ring-orange/40"
        }
      >
        <Check className="h-6 w-6" strokeWidth={3} />
      </button>
    </form>
  );
}
