import Link from "next/link";
import { Check } from "lucide-react";

type Tier = {
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  features: string[];
  ctaLabel: string;
  highlight: boolean;
};

const tiers: Tier[] = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    tagline: "For trying out the habit you've been putting off.",
    features: [
      "Track up to 3 habits",
      "Daily check-ins and streaks",
      "Basic weekly stats",
      "Works offline",
    ],
    ctaLabel: "Start free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$4",
    cadence: "per month",
    tagline: "For the long haul — and the life you're actually building.",
    features: [
      "Unlimited habits",
      "Streak freezes to protect bad days",
      "Friend challenges and leaderboards",
      "Full history export (CSV)",
      "Detailed trends and insights",
    ],
    ctaLabel: "Go Pro",
    highlight: true,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-28 bg-white/60">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-orange">
            Pricing
          </span>
          <h2 className="mt-3 font-display text-4xl font-bold leading-tight text-navy sm:text-5xl">
            Simple pricing. Serious results.
          </h2>
          <p className="mt-4 text-lg text-navy/70">
            Start free. Upgrade when you're ready to go all in.
          </p>
        </div>

        <div className="mt-12 md:mt-16 grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-card bg-white p-8 ${
                tier.highlight
                  ? "border-2 border-orange shadow-glow"
                  : "border border-navy/10 shadow-soft"
              }`}
            >
              {tier.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white shadow-soft">
                  Most popular
                </span>
              )}

              <h3 className="font-display text-2xl font-bold text-navy">
                {tier.name}
              </h3>
              <p className="mt-1 text-sm text-navy/60">{tier.tagline}</p>

              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="font-display text-5xl font-bold text-navy">
                  {tier.price}
                </span>
                <span className="text-sm font-medium text-navy/60">
                  {tier.cadence}
                </span>
              </div>

              <ul className="mt-6 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${
                        tier.highlight ? "bg-orange" : "bg-navy/10"
                      }`}
                    >
                      <Check
                        className={`h-3 w-3 ${
                          tier.highlight ? "text-white" : "text-navy"
                        }`}
                        strokeWidth={3}
                        aria-hidden="true"
                      />
                    </span>
                    <span className="text-[15px] text-navy/80">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/login"
                className={`mt-8 inline-flex items-center justify-center rounded-card px-6 py-3 text-base font-semibold transition-colors ${
                  tier.highlight
                    ? "bg-orange text-white hover:bg-orange-dark shadow-glow"
                    : "border border-navy/15 text-navy hover:bg-navy/5"
                }`}
              >
                {tier.ctaLabel}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
