import { getTranslations } from "next-intl/server";
import Wordmark from "./Wordmark";

type LinkKey =
  | "features"
  | "pricing"
  | "getStarted"
  | "changelog"
  | "about"
  | "blog"
  | "careers"
  | "contact"
  | "privacy"
  | "terms"
  | "security"
  | "cookies";

type LinkColumn = {
  columnKey: "product" | "company" | "legal";
  links: { linkKey: LinkKey; href: string }[];
};

const columns: LinkColumn[] = [
  {
    columnKey: "product",
    links: [
      { linkKey: "features", href: "#features" },
      { linkKey: "pricing", href: "#pricing" },
      { linkKey: "getStarted", href: "/login" },
      { linkKey: "changelog", href: "#" },
    ],
  },
  {
    columnKey: "company",
    links: [
      { linkKey: "about", href: "#" },
      { linkKey: "blog", href: "#" },
      { linkKey: "careers", href: "#" },
      { linkKey: "contact", href: "#" },
    ],
  },
  {
    columnKey: "legal",
    links: [
      { linkKey: "privacy", href: "#" },
      { linkKey: "terms", href: "#" },
      { linkKey: "security", href: "#" },
      { linkKey: "cookies", href: "#" },
    ],
  },
];

export default async function Footer() {
  const t = await getTranslations("footer");
  return (
    <footer className="border-t border-navy/10 bg-cream">
      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Wordmark />
            <p className="mt-4 max-w-xs text-sm text-navy/60">{t("tagline")}</p>
          </div>

          {columns.map((col) => (
            <div key={col.columnKey}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-navy/50">
                {t(`columns.${col.columnKey}`)}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.linkKey}>
                    <a
                      href={link.href}
                      className="text-sm text-navy/80 hover:text-orange transition-colors"
                    >
                      {t(`links.${link.linkKey}`)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-navy/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-navy/50">
            {t("copyright", { year: new Date().getFullYear() })}
          </p>
          <p className="text-sm text-navy/50">{t("madeFor")}</p>
        </div>
      </div>
    </footer>
  );
}
