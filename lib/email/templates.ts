// Reminder email content per locale. Kept inline (not in the message catalog)
// because emails need HTML markup that would balloon the JSON dictionaries and
// confuse the next-intl linters. Native-speaker review gates every pt-BR edit.

import type { Locale } from "@/lib/i18n/config";

export type ReminderTemplateInput = {
  locale: Locale;
  displayName: string | null;
  habitName: string;
  streakDays: number;
  checkInUrl: string;
  unsubscribeUrl: string;
};

export type ReminderEmail = {
  subject: string;
  html: string;
  text: string;
};

type Copy = {
  subject: (habit: string) => string;
  greeting: (name: string) => string;
  streakLine: (days: number) => string;
  checkInCta: string;
  unsubscribeLine: string;
  signature: string;
};

const COPY: Record<Locale, Copy> = {
  en: {
    subject: (habit) => `Don't break the streak: ${habit}`,
    greeting: (name) => `Hi ${name},`,
    streakLine: (days) =>
      days === 0
        ? `Today is a great day to start.`
        : days === 1
          ? `You're on a 1 day streak. Keep it going.`
          : `You're on a ${days} day streak. Keep it going.`,
    checkInCta: "Check in",
    unsubscribeLine: "Getting too many? Unsubscribe with one click.",
    signature: "— Streak",
  },
  "pt-BR": {
    subject: (habit) => `Não quebre a corrente: ${habit}`,
    greeting: (name) => `Oi ${name},`,
    streakLine: (days) =>
      days === 0
        ? `Hoje é um ótimo dia para começar.`
        : days === 1
          ? `Você está em uma sequência de 1 dia. Continue assim.`
          : `Você está em uma sequência de ${days} dias. Continue assim.`,
    checkInCta: "Registrar hoje",
    unsubscribeLine: "Está demais? Cancele com um clique.",
    signature: "— Streak",
  },
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildReminderEmail(input: ReminderTemplateInput): ReminderEmail {
  const copy = COPY[input.locale];
  const name = input.displayName?.trim() || (input.locale === "pt-BR" ? "você" : "there");
  const habit = input.habitName;

  const subject = copy.subject(habit);
  const greeting = copy.greeting(name);
  const streakLine = copy.streakLine(input.streakDays);

  const text = [
    greeting,
    "",
    `${habit} — ${streakLine}`,
    "",
    `${copy.checkInCta}: ${input.checkInUrl}`,
    "",
    copy.signature,
    "",
    `${copy.unsubscribeLine} ${input.unsubscribeUrl}`,
  ].join("\n");

  const html = `<!doctype html>
<html lang="${input.locale}">
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #FBF7F0; color: #14213D; margin: 0; padding: 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; padding: 32px;">
      <tr><td>
        <p style="margin: 0 0 16px 0; font-size: 16px;">${escapeHtml(greeting)}</p>
        <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600;">${escapeHtml(habit)}</h1>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #4A5568;">${escapeHtml(streakLine)}</p>
        <p style="margin: 0 0 32px 0;">
          <a href="${input.checkInUrl}" style="display: inline-block; background: #14213D; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">${escapeHtml(copy.checkInCta)}</a>
        </p>
        <p style="margin: 0; font-size: 13px; color: #4A5568;">${escapeHtml(copy.signature)}</p>
      </td></tr>
    </table>
    <p style="max-width: 480px; margin: 16px auto 0 auto; font-size: 12px; color: #718096; text-align: center;">
      ${escapeHtml(copy.unsubscribeLine)} <a href="${input.unsubscribeUrl}" style="color: #718096;">${input.locale === "pt-BR" ? "Cancelar" : "Unsubscribe"}</a>
    </p>
  </body>
</html>`;

  return { subject, html, text };
}
