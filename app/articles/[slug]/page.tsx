import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleBody from "@/components/ArticleBody";
import {
  getArticleBlocks,
  getPublishedArticleBySlug,
} from "@/lib/articles";

// Re-fetch Notion data at most once per hour (3600 seconds).
export const revalidate = 3600;

/**
 * Renders one published Neuro Article by slug.
 * Shows properties plus the Notion page body.
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

  // Load the Notion page body after we know the article exists.
  const blocks = await getArticleBlocks(article.id);

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

      <ArticleBody blocks={blocks} />
    </main>
  );
}
