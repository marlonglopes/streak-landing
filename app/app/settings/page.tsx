import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import ReminderSettings from "@/components/app/ReminderSettings";

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_reminder_channel, quiet_hours_start, quiet_hours_end, unsubscribed_at")
    .eq("id", user.id)
    .single();

  const t = await getTranslations("settings");

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">{t("title")}</h1>
      <section className="rounded-card border border-navy/10 bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">{t("reminders.heading")}</h2>
        <ReminderSettings
          channel={profile?.preferred_reminder_channel ?? "email"}
          quietHoursStart={profile?.quiet_hours_start ?? null}
          quietHoursEnd={profile?.quiet_hours_end ?? null}
          unsubscribedAt={profile?.unsubscribed_at ?? null}
        />
      </section>
    </div>
  );
}
