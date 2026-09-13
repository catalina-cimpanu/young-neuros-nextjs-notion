import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleBody from "@/components/ArticleBody";
import ArticleContents, {
  collectArticleHeadings,
} from "@/components/ArticleContents";
import {
  getAdjacentArticles,
  getArticleBlocks,
  getPublishedArticleBySlug,
  getPublishedArticles,
} from "@/lib/articles";

// Re-fetch Notion data at most once per hour (3600 seconds).
export const revalidate = 3600;

/**
 * Renders one published Neuro Article by slug.
 * Shows properties, Contents (from headings), Notion body, and prev/next links.
 * Example URL: /articles/first-steps-eeg
 */
export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  // Load body and the full published list (for prev/next) in parallel.
  const [blocks, allArticles] = await Promise.all([
    getArticleBlocks(article.id),
    getPublishedArticles(),
  ]);

  const headings = collectArticleHeadings(blocks);
  const { previousArticle, nextArticle } = getAdjacentArticles(
    allArticles,
    article.slug,
  );

  return (
    <main className="homepage">
      <p className="text-sm">
        <Link
          href="/articles"
          className="text-blue-700 underline hover:no-underline"
        >
          ← Back to Articles
        </Link>
      </p>

      <h1 className="mt-6">{article.title}</h1>

      {article.articleType ? (
        <p className="mt-2 text-sm text-neutral-500">
          Type: {article.articleType}
        </p>
      ) : null}

      {article.tags.length > 0 ? (
        <p className="mt-2 text-sm text-neutral-500">
          Tags:{" "}
          {article.tags.map((tag, index) => (
            <span key={tag}>
              {index > 0 ? ", " : null}
              <Link
                href={`/articles?tag=${encodeURIComponent(tag)}`}
                className="text-blue-700 underline hover:no-underline"
              >
                {tag}
              </Link>
            </span>
          ))}
        </p>
      ) : null}

      {article.excerpt ? (
        <p className="homepage-subtitle mt-4">{article.excerpt}</p>
      ) : null}

      {article.author ? (
        <p className="mt-4 text-sm text-neutral-500">
          Author: {article.author}
        </p>
      ) : null}

      {article.publishedDate ? (
        <p className="mt-2 text-sm text-neutral-500">
          Published: {article.publishedDate}
        </p>
      ) : null}

      {article.lastReviewed ? (
        <p className="mt-2 text-sm text-neutral-500">
          Last reviewed: {article.lastReviewed}
        </p>
      ) : null}

      <ArticleContents headings={headings} />

      <ArticleBody blocks={blocks} />

      {previousArticle || nextArticle ? (
        <nav
          className="mt-12 flex flex-col gap-4 border-t border-neutral-200 pt-6 sm:flex-row sm:justify-between"
          aria-label="Previous and next articles"
        >
          <div>
            {previousArticle ? (
              <>
                <p className="text-sm text-neutral-500">Previous</p>
                <Link
                  href={`/articles/${previousArticle.slug}`}
                  className="text-blue-700 underline hover:no-underline"
                >
                  {previousArticle.title}
                </Link>
              </>
            ) : null}
          </div>

          <div className="sm:text-right">
            {nextArticle ? (
              <>
                <p className="text-sm text-neutral-500">Next</p>
                <Link
                  href={`/articles/${nextArticle.slug}`}
                  className="text-blue-700 underline hover:no-underline"
                >
                  {nextArticle.title}
                </Link>
              </>
            ) : null}
          </div>
        </nav>
      ) : null}
    </main>
  );
}
