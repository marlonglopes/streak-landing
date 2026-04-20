import Link from "next/link";
import { getTranslations } from "next-intl/server";
import PhoneMockup from "./PhoneMockup";

export default async function Hero() {
  const t = await getTranslations("hero");
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-24 lg:py-28">
        <div className="grid items-center gap-12 md:gap-16 md:grid-cols-2">
          <div className="text-center md:text-left">
            <span className="inline-flex items-center rounded-full bg-orange/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange">
              {t("badge")}
            </span>
            <h1 className="mt-5 font-display text-5xl font-bold leading-[1.05] tracking-tight text-navy sm:text-6xl lg:text-7xl">
              {t("headlineLine1")}
              <br />
              {t("headlineLine2")}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-navy/70 md:text-xl max-w-xl mx-auto md:mx-0">
              {t("subhead")}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3">
              <Link
                href="/login"
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-card bg-orange px-6 py-3.5 text-base font-semibold text-white shadow-glow hover:bg-orange-dark transition-colors"
              >
                {t("primaryCta")}
              </Link>
              <a
                href="#features"
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-card border border-navy/15 bg-transparent px-6 py-3.5 text-base font-semibold text-navy hover:bg-navy/5 transition-colors"
              >
                {t("secondaryCta")}
              </a>
            </div>
            <p className="mt-6 text-sm text-navy/50">{t("socialProof")}</p>
          </div>

          <div className="flex justify-center md:justify-end">
            <PhoneMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
