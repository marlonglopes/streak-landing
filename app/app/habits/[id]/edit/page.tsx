import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
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
  const t = await getTranslations("editHabit");
  const tForm = await getTranslations("habitForm");

  return (
    <div className="mx-auto max-w-xl px-6 py-10 sm:py-14">
      <h1 className="font-display text-3xl font-bold text-navy sm:text-4xl">
        {t("heading")}
      </h1>
      <p className="mt-2 text-navy/60">{t("subhead")}</p>
      <div className="mt-8">
        <HabitForm
          action={update}
          habit={habit}
          error={searchParams.error}
          submitLabel={tForm("saveChanges")}
          secondary={
            <>
              <form action={archiveHabit}>
                <input type="hidden" name="habit_id" value={habit.id} />
                <button
                  type="submit"
                  className="rounded-card border border-navy/15 bg-white px-4 py-2.5 text-sm font-semibold text-navy/70 hover:bg-navy/5"
                >
                  {tForm("archive")}
                </button>
              </form>
              <form action={deleteHabit}>
                <input type="hidden" name="habit_id" value={habit.id} />
                <button
                  type="submit"
                  className="rounded-card border border-orange/30 bg-white px-4 py-2.5 text-sm font-semibold text-orange-dark hover:bg-orange/10"
                >
                  {tForm("delete")}
                </button>
              </form>
            </>
          }
        />
      </div>
    </div>
  );
}
