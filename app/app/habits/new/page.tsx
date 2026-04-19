import HabitForm from "@/components/app/HabitForm";
import { createHabit } from "@/app/actions/habits";

export default function NewHabitPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="mx-auto max-w-xl px-6 py-10 sm:py-14">
      <h1 className="font-display text-3xl font-bold text-navy sm:text-4xl">
        New habit
      </h1>
      <p className="mt-2 text-navy/60">
        One habit is plenty to start. You can always add more.
      </p>
      <div className="mt-8">
        <HabitForm
          action={createHabit}
          error={searchParams.error}
          submitLabel="Create habit"
        />
      </div>
    </div>
  );
}
