import Link from "next/link";

/**
 * Footer link labels and paths.
 * These match Site Pages slugs in Notion (Status = Published).
 */
const footerLinks = [
  { href: "/pages/terms", label: "Terms" },
  { href: "/pages/privacy", label: "Privacy" },
  { href: "/pages/cookies", label: "Cookie policy" },
  { href: "/pages/disclaimer", label: "Disclaimer" },
  { href: "/pages/faq", label: "FAQ" },
  { href: "/pages/contact", label: "Contact" },
];

/**
 * Renders the site-wide footer with legal / info links.
 * Used in app/layout.tsx so the footer appears on every page.
 */
export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-neutral-200 px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm text-neutral-600">
          Young Neuros provides educational information for neurology learners.
          It is not a substitute for clinical judgment or professional medical
          advice. See the{" "}
          <Link
            href="/pages/disclaimer"
            className="text-blue-700 underline hover:no-underline"
          >
            Disclaimer
          </Link>{" "}
          for details.
        </p>

        <nav className="mt-4" aria-label="Footer">
          <ul className="flex list-none flex-wrap gap-x-4 gap-y-2 p-0 text-sm">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-blue-700 underline hover:no-underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
