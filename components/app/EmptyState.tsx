import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function EmptyState() {
  const t = await getTranslations("emptyState");
  return (
    <div className="rounded-card border border-dashed border-navy/15 bg-white/60 p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange/10 text-orange">
        <CalendarCheck className="h-7 w-7" strokeWidth={2} />
      </div>
      <h2 className="mt-4 font-display text-2xl font-bold text-navy">
        {t("title")}
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-[15px] text-navy/70">
        {t("body")}
      </p>
      <Link
        href="/app/habits/new"
        className="mt-6 inline-block rounded-card bg-orange px-5 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-orange-dark"
      >
        {t("cta")}
      </Link>
    </div>
  );
}
