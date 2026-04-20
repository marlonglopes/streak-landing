import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import Wordmark from "@/components/Wordmark";
import LocaleSwitcher from "@/components/app/LocaleSwitcher";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware already redirects unauthenticated requests, but belt-and-suspenders:
  // if a session somehow lands here without a user, bounce to /login.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const t = await getTranslations("appShell");
  const tNav = await getTranslations("nav");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-navy/10 bg-white">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-6 py-4">
          <Link href="/app" aria-label={tNav("homeAria")}>
            <Wordmark />
          </Link>
          <div className="flex items-center gap-4">
            <span
              className="hidden sm:inline text-sm text-navy/60"
              title={user.email ?? undefined}
            >
              {user.email}
            </span>
            <LocaleSwitcher />
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-card border border-navy/15 bg-white px-3 py-1.5 text-sm font-medium text-navy/80 hover:bg-navy/5 transition-colors"
              >
                {t("signOut")}
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
