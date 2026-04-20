"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { updateReminderPrefs } from "@/app/actions/reminders";
import type { ReminderChannel } from "@/lib/database.types";

type Props = {
  channel: ReminderChannel;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  unsubscribedAt: string | null;
};

function toTimeInput(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 5); // 'HH:MM:SS' → 'HH:MM'
}

export default function ReminderSettings(props: Props) {
  const t = useTranslations("settings.reminders");
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => {
      updateReminderPrefs(formData);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <fieldset>
        <legend className="text-sm font-medium mb-2">{t("channelLabel")}</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="channel" value="email" defaultChecked={props.channel === "email"} />
          {t("channelEmail")}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="channel" value="none" defaultChecked={props.channel === "none"} />
          {t("channelNone")}
        </label>
        {props.unsubscribedAt && (
          <p className="text-xs text-navy/60 mt-2">{t("reEnableNote")}</p>
        )}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{t("quietHoursLabel")}</legend>
        <p className="text-xs text-navy/60">{t("quietHoursHelp")}</p>
        <div className="flex items-center gap-3 text-sm">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-navy/60">{t("quietStart")}</span>
            <input
              type="time"
              name="quietHoursStart"
              defaultValue={toTimeInput(props.quietHoursStart)}
              className="rounded-card border border-navy/15 bg-white px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-navy/60">{t("quietEnd")}</span>
            <input
              type="time"
              name="quietHoursEnd"
              defaultValue={toTimeInput(props.quietHoursEnd)}
              className="rounded-card border border-navy/15 bg-white px-2 py-1"
            />
          </label>
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="rounded-card bg-navy text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
      >
        {pending ? t("saving") : t("save")}
      </button>
    </form>
  );
}
