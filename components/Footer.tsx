import Wordmark from "./Wordmark";

type LinkColumn = {
  heading: string;
  links: { label: string; href: string }[];
};

const columns: LinkColumn[] = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Get started", href: "/login" },
      { label: "Changelog", href: "#" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Security", href: "#" },
      { label: "Cookies", href: "#" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-navy/10 bg-cream">
      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Wordmark />
            <p className="mt-4 max-w-xs text-sm text-navy/60">
              Small habits, big change. One day at a time.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.heading}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-navy/50">
                {col.heading}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-navy/80 hover:text-orange transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-navy/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-navy/50">
            © {new Date().getFullYear()} Streak Labs. All rights reserved.
          </p>
          <p className="text-sm text-navy/50">Made for people who show up.</p>
        </div>
      </div>
    </footer>
  );
}
