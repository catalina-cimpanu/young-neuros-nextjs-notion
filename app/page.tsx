import Link from "next/link";

/**
 * Renders the Young Neuros homepage.
 * Shows a title, a short intro, and links to each main section of the site.
 * No Notion data is loaded on this page yet.
 */
export default function Home() {
  // These are the MVP routes we will build out in later steps.
  const mainSections = [
    { href: "/pathologies", label: "Pathologies" },
    { href: "/neuroskills", label: "Neuroskills" },
    { href: "/resources", label: "Resources" },
    { href: "/guidelines", label: "Guidelines" },
    { href: "/calendar", label: "Calendar" },
    { href: "/articles", label: "Articles" },
  ];

  return (
    <main className="homepage">
      <h1>Young Neuros</h1>

      <p className="homepage-subtitle">
        A simple learning hub for neurology residents and early-career
        neurologists.
      </p>

      <nav aria-label="Main sections">
        <ul className="homepage-nav">
          {mainSections.map((section) => (
            <li key={section.href}>
              <Link href={section.href}>{section.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
