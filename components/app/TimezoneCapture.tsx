"use client";

import { useEffect, useRef } from "react";
import { setTimezone } from "@/app/actions/profile";

/**
 * Detects the browser's IANA timezone on mount and, if it differs from the
 * server-rendered `currentTimezone`, posts an update. Renders nothing.
 * Runs once per session per mismatch — after the server revalidates, the
 * next render sees matching values and this becomes a no-op.
 */
export default function TimezoneCapture({
  currentTimezone,
}: {
  currentTimezone: string;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!detected || detected === currentTimezone) return;

    fired.current = true;
    const fd = new FormData();
    fd.set("timezone", detected);
    void setTimezone(fd);
  }, [currentTimezone]);

  return null;
}
