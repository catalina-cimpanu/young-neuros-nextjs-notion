import { notFound } from "next/navigation";
import ArticleBody from "@/components/ArticleBody";
import { getArticleBlocks } from "@/lib/articles";
import { getPublishedSitePageBySlug } from "@/lib/site-pages";

// Re-fetch Notion data at most once per hour (3600 seconds).
export const revalidate = 3600;

/**
 * Renders one published Site Page by slug (Terms, Privacy, FAQ, Contact, …).
 * Body content is the Notion page content, rendered like article bodies.
 * Example URL: /pages/privacy
 */
export default async function SitePageDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sitePage = await getPublishedSitePageBySlug(slug);

  if (!sitePage) {
    notFound();
  }

  // Reuse the same Notion block fetcher as articles (works for any page id).
  const blocks = await getArticleBlocks(sitePage.id);

  // Optional contact email from env — only used on Contact pages.
  const contactEmail = process.env.CONTACT_EMAIL || "";

  return (
    <main className="homepage">
      <h1>{sitePage.name}</h1>

      {sitePage.pageType === "Contact" && contactEmail !== "" ? (
        <p className="mt-4 text-neutral-700">
          Email:{" "}
          <a
            href={`mailto:${contactEmail}`}
            className="text-blue-700 underline hover:no-underline"
          >
            {contactEmail}
          </a>
        </p>
      ) : null}

      <ArticleBody blocks={blocks} />
    </main>
  );
}
