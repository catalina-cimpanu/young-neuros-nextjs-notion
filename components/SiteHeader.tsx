import Link from "next/link";

/**
 * Renders the site-wide header with main navigation links.
 * Used in app/layout.tsx so the header appears on every page.
 */
export default function SiteHeader() {
  // Same MVP routes as the homepage — Home is included here for navigation from any page.
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/pathologies", label: "Pathologies" },
    { href: "/neuroskills", label: "Neuroskills" },
    { href: "/resources", label: "Resources" },
    { href: "/guidelines", label: "Guidelines" },
    { href: "/calendar", label: "Calendar" },
    { href: "/articles", label: "Articles" },
  ];

  return (
    <header className="border-b border-neutral-200 px-6 py-4">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="text-lg font-bold text-neutral-900">
          Young Neuros
        </Link>

        <nav aria-label="Main navigation">
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {navLinks.map((link) => (
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
    </header>
  );
}
