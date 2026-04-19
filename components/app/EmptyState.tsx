import Link from "next/link";
import { CalendarCheck } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="rounded-card border border-dashed border-navy/15 bg-white/60 p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange/10 text-orange">
        <CalendarCheck className="h-7 w-7" strokeWidth={2} />
      </div>
      <h2 className="mt-4 font-display text-2xl font-bold text-navy">
        Start your first streak
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-[15px] text-navy/70">
        Pick one habit. One tap a day. Don&apos;t break the chain. Free plan
        tracks up to three habits.
      </p>
      <Link
        href="/app/habits/new"
        className="mt-6 inline-block rounded-card bg-orange px-5 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-orange-dark"
      >
        Create a habit
      </Link>
    </div>
  );
}
