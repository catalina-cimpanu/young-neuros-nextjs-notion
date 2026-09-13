/**
 * Builds a stable HTML id from a section prefix and a label.
 * Example: ("guidelines", "Europe") → "guidelines-europe"
 * Used for Contents links and the matching subsection headings.
 */
export function topicSectionId(
  prefix: "guidelines" | "resources",
  label: string,
): string {
  const slug = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (slug === "") {
    return `${prefix}-unknown`;
  }

  return `${prefix}-${slug}`;
}

/**
 * Props for the topic page Contents list.
 * Parent links always show; region/type children only when those groups exist.
 */
type TopicContentsProps = {
  guidelineRegions: string[];
  resourceTypes: string[];
};

/**
 * Renders a Contents list with jump links.
 * Always lists Guidelines, Resources, and Links.
 * Under Guidelines, lists each region group; under Resources, each type group.
 */
export default function TopicContents({
  guidelineRegions,
  resourceTypes,
}: TopicContentsProps) {
  return (
    <nav className="mt-8" aria-label="Contents">
      <h2 className="text-base font-semibold">Contents</h2>
      <ul className="mt-2 list-none space-y-2 p-0 text-sm">
        <li>
          <a
            href="#guidelines"
            className="text-blue-700 underline hover:no-underline"
          >
            Guidelines
          </a>

          {guidelineRegions.length > 0 ? (
            <ul className="mt-1 list-none space-y-1 p-0 pl-4">
              {guidelineRegions.map((regionLabel) => (
                <li key={regionLabel}>
                  <a
                    href={`#${topicSectionId("guidelines", regionLabel)}`}
                    className="text-blue-700 underline hover:no-underline"
                  >
                    {regionLabel}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </li>

        <li>
          <a
            href="#resources"
            className="text-blue-700 underline hover:no-underline"
          >
            Resources
          </a>

          {resourceTypes.length > 0 ? (
            <ul className="mt-1 list-none space-y-1 p-0 pl-4">
              {resourceTypes.map((typeLabel) => (
                <li key={typeLabel}>
                  <a
                    href={`#${topicSectionId("resources", typeLabel)}`}
                    className="text-blue-700 underline hover:no-underline"
                  >
                    {typeLabel}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </li>

        <li>
          <a
            href="#links"
            className="text-blue-700 underline hover:no-underline"
          >
            Links
          </a>
        </li>
      </ul>
    </nav>
  );
}
