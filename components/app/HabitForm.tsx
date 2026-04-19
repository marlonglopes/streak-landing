import Link from "next/link";
import type { Habit } from "@/lib/database.types";

type Props = {
  action: (formData: FormData) => void;
  habit?: Pick<
    Habit,
    "name" | "emoji" | "cadence" | "target_days_of_week" | "reminder_time"
  >;
  error?: string;
  submitLabel?: string;
  secondary?: React.ReactNode;
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function HabitForm({
  action,
  habit,
  error,
  submitLabel = "Save habit",
  secondary,
}: Props) {
  const defaultDays = habit?.target_days_of_week ?? [0, 1, 2, 3, 4, 5, 6];
  const defaultReminder = habit?.reminder_time?.slice(0, 5) ?? "";

  return (
    <form action={action} className="space-y-6">
      {error && (
        <p
          role="alert"
          className="rounded-card border border-orange/30 bg-orange/10 px-4 py-3 text-sm text-orange-dark"
        >
          {error}
        </p>
      )}

      <div className="grid grid-cols-[1fr_auto] gap-3">
        <label className="block">
          <span className="text-sm font-medium text-navy">Name</span>
          <input
            required
            type="text"
            name="name"
            maxLength={100}
            defaultValue={habit?.name ?? ""}
            placeholder="Morning run"
            className="mt-1 w-full rounded-card border border-navy/15 bg-white px-3 py-2 text-navy placeholder:text-navy/40 focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/30"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-navy">Emoji</span>
          <input
            type="text"
            name="emoji"
            maxLength={8}
            defaultValue={habit?.emoji ?? ""}
            placeholder="🏃"
            className="mt-1 w-20 rounded-card border border-navy/15 bg-white px-3 py-2 text-center text-xl focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/30"
          />
        </label>
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-navy">Cadence</legend>
        <div className="mt-2 flex gap-4 text-sm text-navy/80">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="cadence"
              value="daily"
              defaultChecked={(habit?.cadence ?? "daily") === "daily"}
            />
            Daily
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="cadence"
              value="weekly"
              defaultChecked={habit?.cadence === "weekly"}
            />
            Weekly
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium text-navy">Target days</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {DAY_LABELS.map((label, i) => {
            const checked = defaultDays.includes(i);
            return (
              <label
                key={i}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-card border border-navy/15 bg-white px-3 py-1.5 text-sm text-navy/80 hover:bg-navy/5 has-[:checked]:border-orange has-[:checked]:bg-orange/10 has-[:checked]:text-orange-dark"
              >
                <input
                  type="checkbox"
                  name="target_days_of_week"
                  value={i}
                  defaultChecked={checked}
                  className="accent-orange"
                />
                {label}
              </label>
            );
          })}
        </div>
      </fieldset>

      <label className="block">
        <span className="text-sm font-medium text-navy">
          Reminder time{" "}
          <span className="font-normal text-navy/50">(optional)</span>
        </span>
        <input
          type="time"
          name="reminder_time"
          defaultValue={defaultReminder}
          className="mt-1 block rounded-card border border-navy/15 bg-white px-3 py-2 text-navy focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/30"
        />
        <span className="mt-1 block text-xs text-navy/50">
          Reminder emails ship in Sprint 2.2.
        </span>
      </label>

      <div className="flex items-center justify-between gap-4 pt-2">
        <Link
          href="/app"
          className="text-sm font-medium text-navy/60 hover:text-navy"
        >
          Cancel
        </Link>
        <div className="flex items-center gap-3">
          {secondary}
          <button
            type="submit"
            className="rounded-card bg-orange px-5 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-orange-dark focus:outline-none focus:ring-2 focus:ring-orange/40"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
