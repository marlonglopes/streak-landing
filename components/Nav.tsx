import Link from "next/link";
import Wordmark from "./Wordmark";

export default function Nav() {
  return (
    <header className="sticky top-0 z-50 bg-cream/85 backdrop-blur-md border-b border-navy/5">
      <nav
        aria-label="Primary"
        className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4"
      >
        <Link href="/" aria-label="Streak home" className="flex items-center">
          <Wordmark />
        </Link>

        <div className="flex items-center gap-2 sm:gap-6">
          <ul className="hidden sm:flex items-center gap-6 text-sm font-medium text-navy/75">
            <li>
              <a href="#features" className="hover:text-navy transition-colors">
                Features
              </a>
            </li>
            <li>
              <a href="#pricing" className="hover:text-navy transition-colors">
                Pricing
              </a>
            </li>
            <li>
              <Link href="/login" className="hover:text-navy transition-colors">
                Log in
              </Link>
            </li>
          </ul>
          <Link
            href="/login"
            className="inline-flex items-center rounded-card bg-orange px-4 py-2 text-sm font-semibold text-white shadow-glow hover:bg-orange-dark transition-colors"
          >
            Get Streak
          </Link>
        </div>
      </nav>
    </header>
  );
}
