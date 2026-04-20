import { getTranslations } from "next-intl/server";
import HabitForm from "@/components/app/HabitForm";
import { createHabit } from "@/app/actions/habits";

export default async function NewHabitPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const t = await getTranslations("newHabit");
  const tForm = await getTranslations("habitForm");
  return (
    <div className="mx-auto max-w-xl px-6 py-10 sm:py-14">
      <h1 className="font-display text-3xl font-bold text-navy sm:text-4xl">
        {t("heading")}
      </h1>
      <p className="mt-2 text-navy/60">{t("subhead")}</p>
      <div className="mt-8">
        <HabitForm
          action={createHabit}
          error={searchParams.error}
          submitLabel={tForm("create")}
        />
      </div>
    </div>
  );
}
