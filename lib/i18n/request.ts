import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  type Locale,
  isLocale,
  matchAcceptLanguage,
} from "./config";

/**
 * Resolve the active locale for the current request.
 *
 * Precedence:
 *   1. Signed-in user's stored `profiles.locale` (authoritative)
 *   2. `NEXT_LOCALE` cookie (anonymous users who clicked the switcher)
 *   3. `Accept-Language` header (first visit, language-aware fallback)
 *   4. `DEFAULT_LOCALE` ('en')
 *
 * Exposed as a function (not baked into getRequestConfig) so Server Actions
 * and Route Handlers can reuse the same logic.
 */
export async function resolveLocale(): Promise<Locale> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("locale")
        .eq("id", user.id)
        .maybeSingle();
      if (profile && isLocale(profile.locale)) return profile.locale;
    }
  } catch {
    // Supabase env not configured (local dev before .env.local) — fall through.
  }

  const cookieValue = cookies().get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieValue)) return cookieValue;

  const accept = headers().get("accept-language");
  return matchAcceptLanguage(accept);
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale();
  const messages = (await import(`../../locales/${locale}.json`)).default;
  return { locale, messages };
});
