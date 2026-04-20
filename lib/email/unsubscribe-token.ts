// One-click unsubscribe tokens. Signed with HMAC-SHA256 keyed on UNSUB_TOKEN_SECRET.
//
// Why not a random token in a DB table? Keeping the lookup stateless means the
// unsubscribe handler works even if the DB is down, and we never have to garbage
// collect expired tokens. Secret rotation invalidates every outstanding link —
// acceptable trade-off; we'd only rotate after a leak.

import { createHmac, timingSafeEqual } from "node:crypto";

function base64UrlEncode(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(s: string): Buffer {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/") + "==".slice((s.length + 2) % 4);
  return Buffer.from(padded, "base64");
}

function sign(userId: string, secret: string): string {
  return base64UrlEncode(createHmac("sha256", secret).update(userId).digest());
}

export function createUnsubscribeToken(userId: string, secret: string): string {
  const sig = sign(userId, secret);
  return `${base64UrlEncode(Buffer.from(userId))}.${sig}`;
}

export function verifyUnsubscribeToken(token: string, secret: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encodedUser, sig] = parts;
  let userId: string;
  try {
    userId = base64UrlDecode(encodedUser).toString("utf8");
  } catch {
    return null;
  }
  if (!userId) return null;

  const expected = Buffer.from(sign(userId, secret));
  const actual = Buffer.from(sig);
  if (expected.length !== actual.length) return null;
  return timingSafeEqual(expected, actual) ? userId : null;
}
