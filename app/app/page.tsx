import { createClient } from "@/lib/supabase/server";

export default async function AppHome() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-wider text-orange">
        You&apos;re in
      </p>
      <h1 className="mt-3 font-display text-4xl font-bold leading-tight text-navy sm:text-5xl">
        Welcome to Streak.
      </h1>
      <p className="mt-3 text-lg text-navy/70">
        Signed in as{" "}
        <span className="font-semibold text-navy">{user?.email}</span>. Your
        &ldquo;Today&rdquo; view will live here once habits ship in the next
        sprint.
      </p>

      <section className="mt-10 rounded-card bg-white p-6 shadow-soft">
        <h2 className="font-display text-xl font-bold text-navy">
          Next up on the roadmap
        </h2>
        <ul className="mt-3 space-y-2 text-[15px] text-navy/75">
          <li>• Create your first habit (name, emoji, cadence)</li>
          <li>• One-tap check-ins with live streak counter</li>
          <li>• Calendar heatmap of your history</li>
        </ul>
      </section>
    </div>
  );
}
