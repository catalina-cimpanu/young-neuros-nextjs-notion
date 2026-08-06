import { getPublishedArticles } from "@/lib/articles";

// Re-fetch Notion data at most once per hour (3600 seconds).
export const revalidate = 3600;

/**
 * Renders published Neuro Articles from Notion as a simple listing.
 * Does not create /articles/[slug] or render full Notion page content yet.
 */
export default async function ArticlesPage() {
  const articles = await getPublishedArticles();

  return (
    <main className="homepage">
      <h1>Articles</h1>
      <p className="homepage-subtitle">
        Short articles and write-ups for neurology learners.
      </p>

      {articles.length === 0 ? (
        <p className="mt-8 text-neutral-600">
          No published articles yet. Add one in Notion with Status = Published.
        </p>
      ) : (
        <ul className="mt-8 list-none space-y-6 p-0">
          {articles.map((article) => (
            <li key={article.id} className="border-b border-neutral-200 pb-4">
              <h2 className="text-xl font-semibold">{article.title}</h2>

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
