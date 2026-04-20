export const LOCALES = ["en", "pt-BR"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** The cookie used to remember a locale choice for anonymous visitors. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * Picks the best match from an Accept-Language header. pt-* variants fall back
 * to pt-BR; anything else falls back to en. Keeps the matcher tiny — we only
 * have two locales and no plans to machine-match more.
 */
export function matchAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;
  const entries = header.toLowerCase().split(",");
  for (const entry of entries) {
    const tag = entry.split(";")[0].trim();
    if (tag.startsWith("pt")) return "pt-BR";
    if (tag.startsWith("en")) return "en";
  }
  return DEFAULT_LOCALE;
}
