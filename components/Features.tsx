import { CalendarCheck, Snowflake, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

const featureKeys = [
  { key: "dailyCheckIns", icon: CalendarCheck },
  { key: "streakFreezes", icon: Snowflake },
  { key: "friendChallenges", icon: Users },
] as const;

export default async function Features() {
  const t = await getTranslations("features");
  const items: { icon: LucideIcon; title: string; description: string }[] =
    featureKeys.map(({ key, icon }) => ({
      icon,
      title: t(`${key}.title`),
      description: t(`${key}.description`),
    }));

  return (
    <section id="features" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-orange">
            {t("eyebrow")}
          </span>
          <h2 className="mt-3 font-display text-4xl font-bold leading-tight text-navy sm:text-5xl">
            {t("heading")}
          </h2>
          <p className="mt-4 text-lg text-navy/70">{t("subhead")}</p>
        </div>

        <div className="mt-12 md:mt-16 grid gap-6 md:grid-cols-3">
          {items.map(({ icon: Icon, title, description }) => (
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
