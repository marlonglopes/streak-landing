import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import HabitForm from "@/components/app/HabitForm";
import {
  archiveHabit,
  deleteHabit,
  updateHabit,
} from "@/app/actions/habits";

export default async function EditHabitPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { data: habit } = await supabase
    .from("habits")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!habit) notFound();

  const update = updateHabit.bind(null, habit.id);

  return (
    <div className="mx-auto max-w-xl px-6 py-10 sm:py-14">
      <h1 className="font-display text-3xl font-bold text-navy sm:text-4xl">
        Edit habit
      </h1>
      <p className="mt-2 text-navy/60">
        Archiving hides a habit from Today but keeps its history. Deleting wipes
        check-ins too.
      </p>
      <div className="mt-8">
        <HabitForm
          action={update}
          habit={habit}
          error={searchParams.error}
          submitLabel="Save changes"
          secondary={
            <>
              <form action={archiveHabit}>
                <input type="hidden" name="habit_id" value={habit.id} />
                <button
                  type="submit"
                  className="rounded-card border border-navy/15 bg-white px-4 py-2.5 text-sm font-semibold text-navy/70 hover:bg-navy/5"
                >
                  Archive
                </button>
              </form>
              <form action={deleteHabit}>
                <input type="hidden" name="habit_id" value={habit.id} />
                <button
                  type="submit"
                  className="rounded-card border border-orange/30 bg-white px-4 py-2.5 text-sm font-semibold text-orange-dark hover:bg-orange/10"
                >
                  Delete
                </button>
              </form>
            </>
          }
        />
      </div>
    </div>
  );
}
