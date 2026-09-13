import Link from "next/link";
import { getPublishedArticles } from "@/lib/articles";

// Re-fetch Notion data at most once per hour (3600 seconds).
export const revalidate = 3600;

/**
 * Builds a sorted list of unique non-empty tag names.
 */
function uniqueSortedTags(tagLists: string[][]): string[] {
  const uniqueTags = new Set<string>();

  for (const tagList of tagLists) {
    for (const tag of tagList) {
      if (tag.trim() !== "") {
        uniqueTags.add(tag);
      }
    }
  }

  return Array.from(uniqueTags).sort();
}

/**
 * Renders published Neuro Articles from Notion as a simple listing.
 * Optional ?tag= filter narrows the list (shareable URL).
 */
export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag: selectedTagFromUrl } = await searchParams;
  const selectedTag = selectedTagFromUrl || "";

  const articles = await getPublishedArticles();

  // Only list articles that have a slug so we can link to a detail page.
  const articlesWithSlug = articles.filter((article) => {
    return article.slug !== "";
  });

  const allTags = uniqueSortedTags(
    articlesWithSlug.map((article) => article.tags),
  );

  const filteredArticles =
    selectedTag === ""
      ? articlesWithSlug
      : articlesWithSlug.filter((article) => {
          return article.tags.includes(selectedTag);
        });

  return (
    <main className="homepage">
      <h1>Articles</h1>
      <p className="homepage-subtitle">
        Short articles and write-ups for neurology learners.
      </p>

      {allTags.length > 0 ? (
        <nav className="mt-6" aria-label="Filter by tag">
          <p className="text-sm text-neutral-600">Filter by tag:</p>
          <ul className="mt-2 flex list-none flex-wrap gap-3 p-0 text-sm">
            <li>
              {selectedTag === "" ? (
                <span className="font-semibold text-neutral-900">All</span>
              ) : (
                <Link
                  href="/articles"
                  className="text-blue-700 underline hover:no-underline"
                >
                  All
                </Link>
              )}
            </li>
            {allTags.map((tag) => (
              <li key={tag}>
                {selectedTag === tag ? (
                  <span className="font-semibold text-neutral-900">{tag}</span>
                ) : (
                  <Link
                    href={`/articles?tag=${encodeURIComponent(tag)}`}
                    className="text-blue-700 underline hover:no-underline"
                  >
                    {tag}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {filteredArticles.length === 0 ? (
        <p className="mt-8 text-neutral-600">
          {selectedTag === ""
            ? "No published articles yet. Add one in Notion with Status = Published and a Slug."
            : `No published articles with the tag “${selectedTag}”.`}
        </p>
      ) : (
        <ul className="mt-8 list-none space-y-6 p-0">
          {filteredArticles.map((article) => (
            <li key={article.id} className="border-b border-neutral-200 pb-4">
              <h2 className="text-xl font-semibold">
                <Link
                  href={`/articles/${article.slug}`}
                  className="text-blue-700 underline hover:no-underline"
                >
                  {article.title}
                </Link>
              </h2>

              {article.articleType ? (
                <p className="mt-2 text-sm text-neutral-500">
                  Type: {article.articleType}
                </p>
              ) : null}

              {article.tags.length > 0 ? (
                <p className="mt-2 text-sm text-neutral-500">
                  Tags: {article.tags.join(", ")}
                </p>
              ) : null}

              {article.excerpt ? (
                <p className="mt-2 text-neutral-700">{article.excerpt}</p>
              ) : null}

              {article.author ? (
                <p className="mt-2 text-sm text-neutral-500">
                  Author: {article.author}
                </p>
              ) : null}

              {article.publishedDate ? (
                <p className="mt-1 text-sm text-neutral-500">
                  Published: {article.publishedDate}
                </p>
              ) : null}

              {article.lastReviewed ? (
                <p className="mt-1 text-sm text-neutral-500">
                  Last reviewed: {article.lastReviewed}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
