"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isValidTimezone } from "@/lib/dates";
import { LOCALE_COOKIE, isLocale } from "@/lib/i18n/config";

/**
 * Set the user's IANA timezone. Called once on first /app load when the
 * client detects the browser timezone doesn't match the stored one.
 * Silently no-ops for invalid input rather than throwing — worst case
 * the user keeps their old timezone for another session.
 */
export async function setTimezone(formData: FormData) {
  const tz = String(formData.get("timezone") ?? "").trim();
  if (!tz || !isValidTimezone(tz)) return;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("profiles").update({ timezone: tz }).eq("id", user.id);
  revalidatePath("/app");
}

/**
 * Persist the active locale. For signed-in users we write `profiles.locale`
 * so the choice follows them across devices; for anonymous visitors we drop
 * a NEXT_LOCALE cookie (1 year). Invalid input no-ops.
 */
export async function setLocale(formData: FormData) {
  const locale = formData.get("locale");
  if (!isLocale(locale)) return;

  cookies().set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("profiles").update({ locale }).eq("id", user.id);
  }

  revalidatePath("/", "layout");
}
