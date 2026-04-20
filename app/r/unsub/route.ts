// One-click unsubscribe handler. RFC 8058 / CAN-SPAM footer link lands here.
// The token is HMAC-signed on the user_id — no DB lookup needed to validate.
// We still update the profile (and set unsubscribed_at) so the cron job stops
// picking them up on the next tick.

import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(request: NextRequest) {
  const secret = process.env.UNSUB_TOKEN_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "server misconfigured" }, { status: 500 });
  }

  const token = request.nextUrl.searchParams.get("t");
  if (!token) return NextResponse.json({ error: "missing token" }, { status: 400 });

  const userId = verifyUnsubscribeToken(token, secret);
  if (!userId) return NextResponse.json({ error: "invalid token" }, { status: 400 });

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      unsubscribed_at: new Date().toISOString(),
      preferred_reminder_channel: "none",
    })
    .eq("id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Tiny HTML so the click gets a friendly confirmation instead of raw JSON.
  return new NextResponse(
    `<!doctype html><meta charset="utf-8"><title>Unsubscribed</title>
<body style="font-family: system-ui; max-width: 480px; margin: 80px auto; padding: 24px; color: #14213D;">
  <h1 style="font-size: 22px;">You're unsubscribed.</h1>
  <p>You won't receive reminder emails from Streak. You can re-enable them anytime from <a href="/app/settings">Settings</a>.</p>
</body>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

export const GET = handle;
// Mail clients may POST one-click unsubscribe (List-Unsubscribe-Post). Accept both.
export const POST = handle;
