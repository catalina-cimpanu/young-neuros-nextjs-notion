import type { ArticleBlock } from "@/lib/articles";

/**
 * One heading entry for the article Contents list.
 */
export type ArticleHeading = {
  id: string;
  text: string;
  // 2 = main section heading, 3 = subsection
  level: 2 | 3;
};

/**
 * Turns heading text into a URL-friendly id (must match ArticleBody).
 */
export function headingIdFromText(text: string): string {
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (slug === "") {
    return "section";
  }

  return slug;
}

/**
 * Collects heading blocks from the article body for the Contents list.
 * heading_1 and heading_2 both use level 2 (we render both as section headings).
 */
export function collectArticleHeadings(
  blocks: ArticleBlock[],
): ArticleHeading[] {
  const headings: ArticleHeading[] = [];

  for (const block of blocks) {
    if (block.type === "heading_1") {
      const text = block.heading_1.rich_text
        .map((item) => item.plain_text)
        .join("");
      if (text.trim() !== "") {
        headings.push({
          id: headingIdFromText(text),
          text,
          level: 2,
        });
      }
    }

    if (block.type === "heading_2") {
      const text = block.heading_2.rich_text
        .map((item) => item.plain_text)
        .join("");
      if (text.trim() !== "") {
        headings.push({
          id: headingIdFromText(text),
          text,
          level: 2,
        });
      }
    }

    if (block.type === "heading_3") {
      const text = block.heading_3.rich_text
        .map((item) => item.plain_text)
        .join("");
      if (text.trim() !== "") {
        headings.push({
          id: headingIdFromText(text),
          text,
          level: 3,
        });
      }
    }
  }

  return headings;
}

/**
 * Props for the article Contents nav.
 */
type ArticleContentsProps = {
  headings: ArticleHeading[];
};

/**
 * Renders a Contents list from article headings.
 * Returns null if there are fewer than 2 headings (not useful as a TOC).
 */
export default function ArticleContents({ headings }: ArticleContentsProps) {
  if (headings.length < 2) {
    return null;
  }

  return (
    <nav className="mt-8" aria-label="Article contents">
      <h2 className="text-base font-semibold">Contents</h2>
      <ul className="mt-2 list-none space-y-1 p-0 text-sm">
        {headings.map((heading) => (
          <li
            key={`${heading.id}-${heading.text}`}
            className={heading.level === 3 ? "pl-4" : undefined}
          >
            <a
              href={`#${heading.id}`}
              className="text-blue-700 underline hover:no-underline"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
