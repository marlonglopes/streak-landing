"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isValidTimezone } from "@/lib/dates";

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
