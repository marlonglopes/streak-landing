import Link from "next/link";
import { getTranslations } from "next-intl/server";
import Wordmark from "./Wordmark";
import LocaleSwitcher from "./app/LocaleSwitcher";

export default async function Nav() {
  const t = await getTranslations("nav");
  return (
    <header className="sticky top-0 z-50 bg-cream/85 backdrop-blur-md border-b border-navy/5">
      <nav
        aria-label="Primary"
        className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4"
      >
        <Link href="/" aria-label={t("homeAria")} className="flex items-center">
          <Wordmark />
        </Link>

        <div className="flex items-center gap-2 sm:gap-6">
          <ul className="hidden sm:flex items-center gap-6 text-sm font-medium text-navy/75">
            <li>
              <a href="#features" className="hover:text-navy transition-colors">
                {t("features")}
              </a>
            </li>
            <li>
              <a href="#pricing" className="hover:text-navy transition-colors">
                {t("pricing")}
              </a>
            </li>
            <li>
              <Link href="/login" className="hover:text-navy transition-colors">
                {t("login")}
              </Link>
            </li>
          </ul>
          <LocaleSwitcher />
          <Link
            href="/login"
            className="inline-flex items-center rounded-card bg-orange px-4 py-2 text-sm font-semibold text-white shadow-glow hover:bg-orange-dark transition-colors"
          >
            {t("cta")}
          </Link>
        </div>
      </nav>
    </header>
  );
}
