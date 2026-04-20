import Link from "next/link";
import { getTranslations } from "next-intl/server";
import Wordmark from "@/components/Wordmark";
import { signInWithOtp } from "@/app/actions/auth";

type Props = {
  searchParams: {
    sent?: string;
    email?: string;
    error?: string;
    next?: string;
  };
};

export default async function LoginPage({ searchParams }: Props) {
  const sent = searchParams.sent === "1";
  const next = searchParams.next ?? "/app";
  const t = await getTranslations("login");
  const tNav = await getTranslations("nav");

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <Link
          href="/"
          aria-label={tNav("homeAria")}
          className="flex justify-center"
        >
          <Wordmark />
        </Link>

        <div className="mt-10 rounded-card bg-white p-8 shadow-soft">
          {sent ? (
            <SentState email={searchParams.email} />
          ) : (
            <SignInForm error={searchParams.error} next={next} />
          )}
        </div>

        <p className="mt-6 text-center text-sm text-navy/50">{t("terms")}</p>
      </div>
    </main>
  );
}

async function SignInForm({ error, next }: { error?: string; next: string }) {
  const t = await getTranslations("login");
  return (
    <>
      <h1 className="font-display text-3xl font-bold text-navy">
        {t("signIn")}
      </h1>
      <p className="mt-2 text-navy/70">{t("prompt")}</p>

      <form action={signInWithOtp} className="mt-6 space-y-4">
        <input type="hidden" name="next" value={next} />
        <label className="block">
          <span className="sr-only">{t("emailLabel")}</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder={t("emailPlaceholder")}
            className="w-full rounded-card border border-navy/15 bg-white px-4 py-3 text-base text-navy placeholder:text-navy/40 focus:outline-none focus:border-orange focus:ring-2 focus:ring-orange/20"
          />
        </label>
        <button
          type="submit"
          className="w-full inline-flex items-center justify-center rounded-card bg-orange px-6 py-3 text-base font-semibold text-white shadow-glow hover:bg-orange-dark transition-colors"
        >
          {t("sendMagicLink")}
        </button>
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </form>
    </>
  );
}

async function SentState({ email }: { email?: string }) {
  const t = await getTranslations("login");
  return (
    <div className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange/10">
        <span className="text-2xl" aria-hidden="true">
          ✉️
        </span>
      </div>
      <h1 className="mt-4 font-display text-3xl font-bold text-navy">
        {t("checkEmail")}
      </h1>
      <p className="mt-3 text-navy/70">
        {email ? t("linkSentTo", { email }) : t("linkSentNoEmail")}
      </p>
      <Link
        href="/login"
        className="mt-6 inline-block text-sm font-medium text-orange hover:text-orange-dark"
      >
        {t("useDifferent")}
      </Link>
    </div>
  );
}
