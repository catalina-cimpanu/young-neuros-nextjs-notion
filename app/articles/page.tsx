import Link from "next/link";
import { getPublishedArticles } from "@/lib/articles";

// Re-fetch Notion data at most once per hour (3600 seconds).
export const revalidate = 3600;

/**
 * Renders published Neuro Articles from Notion as a simple listing.
 * Titles link to /articles/[slug]. Full Notion page body is not rendered yet.
 */
export default async function ArticlesPage() {
  const articles = await getPublishedArticles();

  // Only list articles that have a slug so we can link to a detail page.
  const articlesWithSlug = articles.filter((article) => {
    return article.slug !== "";
  });

  return (
    <main className="homepage">
      <h1>Articles</h1>
      <p className="homepage-subtitle">
        Short articles and write-ups for neurology learners.
      </p>

      {articlesWithSlug.length === 0 ? (
        <p className="mt-8 text-neutral-600">
          No published articles yet. Add one in Notion with Status = Published
          and a Slug.
        </p>
      ) : (
        <ul className="mt-8 list-none space-y-6 p-0">
          {articlesWithSlug.map((article) => (
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
