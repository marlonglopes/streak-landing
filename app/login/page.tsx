import Link from "next/link";
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

export default function LoginPage({ searchParams }: Props) {
  const sent = searchParams.sent === "1";
  const next = searchParams.next ?? "/app";

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <Link
          href="/"
          aria-label="Streak home"
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

        <p className="mt-6 text-center text-sm text-navy/50">
          By continuing you agree to our Terms and Privacy.
        </p>
      </div>
    </main>
  );
}

function SignInForm({ error, next }: { error?: string; next: string }) {
  return (
    <>
      <h1 className="font-display text-3xl font-bold text-navy">
        Sign in to Streak
      </h1>
      <p className="mt-2 text-navy/70">
        Enter your email and we&apos;ll send you a magic link. No password needed.
      </p>

      <form action={signInWithOtp} className="mt-6 space-y-4">
        <input type="hidden" name="next" value={next} />
        <label className="block">
          <span className="sr-only">Email address</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            className="w-full rounded-card border border-navy/15 bg-white px-4 py-3 text-base text-navy placeholder:text-navy/40 focus:outline-none focus:border-orange focus:ring-2 focus:ring-orange/20"
          />
        </label>
        <button
          type="submit"
          className="w-full inline-flex items-center justify-center rounded-card bg-orange px-6 py-3 text-base font-semibold text-white shadow-glow hover:bg-orange-dark transition-colors"
        >
          Send magic link
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

function SentState({ email }: { email?: string }) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange/10">
        <span className="text-2xl" aria-hidden="true">
          ✉️
        </span>
      </div>
      <h1 className="mt-4 font-display text-3xl font-bold text-navy">
        Check your email
      </h1>
      <p className="mt-3 text-navy/70">
        We sent a magic link{email ? ` to ` : "."}
        {email && <span className="font-semibold text-navy">{email}</span>}
        {email && "."} Tap the link and you&apos;re in.
      </p>
      <Link
        href="/login"
        className="mt-6 inline-block text-sm font-medium text-orange hover:text-orange-dark"
      >
        Use a different email
      </Link>
    </div>
  );
}
