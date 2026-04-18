import { Flame, Check } from "lucide-react";

type Habit = {
  name: string;
  time: string;
  done: boolean;
};

const habits: Habit[] = [
  { name: "Morning run", time: "7:00 AM", done: true },
  { name: "Read 20 pages", time: "9:30 PM", done: true },
  { name: "Meditate", time: "8:00 AM", done: false },
];

export default function PhoneMockup() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto w-[280px] sm:w-[320px]"
    >
      <div className="absolute -inset-6 -z-10 rounded-[48px] bg-gradient-to-br from-orange/20 via-orange/5 to-transparent blur-2xl" />

      <div className="relative rounded-[44px] bg-navy p-3 shadow-soft-lg">
        <div className="rounded-[32px] bg-cream overflow-hidden">
          <div className="relative h-6 bg-navy">
            <div className="absolute left-1/2 -translate-x-1/2 top-1.5 h-3 w-20 rounded-full bg-black/40" />
          </div>

          <div className="px-5 pt-5 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-navy/50">
                  Today
                </p>
                <h3 className="font-display text-xl font-bold text-navy">
                  Good morning, Alex
                </h3>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-orange/10 px-3 py-1.5">
                <Flame
                  className="h-4 w-4 text-orange"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
                <span className="text-sm font-bold text-orange">42</span>
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              {habits.map((habit) => (
                <div
                  key={habit.name}
                  className="flex items-center gap-3 rounded-card bg-white px-3.5 py-3 shadow-soft"
                >
                  <div
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                      habit.done
                        ? "bg-orange border-orange"
                        : "border-navy/15 bg-transparent"
                    }`}
                  >
                    {habit.done && (
                      <Check
                        className="h-4 w-4 text-white"
                        strokeWidth={3}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-semibold ${
                        habit.done
                          ? "text-navy/40 line-through"
                          : "text-navy"
                      }`}
                    >
                      {habit.name}
                    </p>
                    <p className="text-xs text-navy/50">{habit.time}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-card bg-navy px-4 py-3 text-center">
              <p className="text-[11px] font-medium uppercase tracking-wider text-white/60">
                Weekly progress
              </p>
              <p className="mt-0.5 font-display text-lg font-bold text-white">
                18 of 21 check-ins
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
