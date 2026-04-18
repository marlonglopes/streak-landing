import { CalendarCheck, Snowflake, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const features: Feature[] = [
  {
    icon: CalendarCheck,
    title: "Daily check-ins",
    description:
      "One tap is all it takes to log a habit. No journaling, no novellas — just the quick, satisfying click that keeps your day on track.",
  },
  {
    icon: Snowflake,
    title: "Streak freezes",
    description:
      "Life happens. Earn freezes by staying consistent, then spend them to protect your chain on the days that try to knock you off course.",
  },
  {
    icon: Users,
    title: "Friend challenges",
    description:
      "Invite a friend, pick a habit, and race side by side. Shared accountability turns solo willpower into a game you'll actually show up for.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-orange">
            Why Streak
          </span>
          <h2 className="mt-3 font-display text-4xl font-bold leading-tight text-navy sm:text-5xl">
            The tools that turn intentions into routines.
          </h2>
          <p className="mt-4 text-lg text-navy/70">
            Everything you need to keep showing up — and nothing you don't.
          </p>
        </div>

        <div className="mt-12 md:mt-16 grid gap-6 md:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="rounded-card bg-white p-8 shadow-soft hover:shadow-soft-lg transition-shadow"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-card bg-orange/10">
                <Icon
                  className="h-6 w-6 text-orange"
                  strokeWidth={2.25}
                  aria-hidden="true"
                />
              </div>
              <h3 className="mt-5 font-display text-xl font-bold text-navy">
                {title}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-navy/70">
                {description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
