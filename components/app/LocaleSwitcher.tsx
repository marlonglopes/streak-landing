"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { LOCALES, type Locale } from "@/lib/i18n/config";
import { setLocale } from "@/app/actions/profile";

export default function LocaleSwitcher() {
  const current = useLocale() as Locale;
  const t = useTranslations("localeSwitcher");
  const [pending, startTransition] = useTransition();

  function onChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value;
    const formData = new FormData();
    formData.set("locale", next);
    startTransition(() => {
      setLocale(formData);
    });
  }

  return (
    <label className="inline-flex items-center gap-2 text-sm text-navy/70">
      <span className="sr-only">{t("label")}</span>
      <select
        value={current}
        onChange={onChange}
        disabled={pending}
        aria-label={t("label")}
        className="rounded-card border border-navy/15 bg-transparent px-2 py-1 text-sm font-medium text-navy hover:bg-navy/5 focus:outline-none focus:ring-2 focus:ring-orange/40 disabled:opacity-50"
      >
        {LOCALES.map((loc) => (
          <option key={loc} value={loc}>
            {t(loc)}
          </option>
        ))}
      </select>
    </label>
  );
}
