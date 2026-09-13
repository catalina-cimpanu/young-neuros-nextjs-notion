import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedTopicBySlug } from "@/lib/topics";

// Re-fetch Notion data at most once per hour (3600 seconds).
export const revalidate = 3600;

/**
 * Renders one published Neuroskill topic by slug.
 * Example URL: /neuroskills/eeg
 */
export default async function NeuroskillTopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const topic = await getPublishedTopicBySlug(slug);

  // Only show this page if the topic exists, is published, and is a Neuroskill.
  if (!topic || topic.topicType !== "Neuroskill") {
    notFound();
  }

  return (
    <main className="homepage">
      <p className="text-sm">
        <Link
          href="/neuroskills"
          className="text-blue-700 underline hover:no-underline"
        >
          ← Back to Neuroskills
        </Link>
      </p>

      <h1 className="mt-6">{topic.name}</h1>

      {topic.shortDescription ? (
        <p className="homepage-subtitle">{topic.shortDescription}</p>
      ) : null}

      {topic.residencyRelevance ? (
        <p className="mt-4 text-sm text-neutral-500">
          Residency relevance: {topic.residencyRelevance}
        </p>
      ) : null}

      {topic.lastReviewed ? (
        <p className="mt-2 text-sm text-neutral-500">
          Last reviewed: {topic.lastReviewed}
        </p>
      ) : null}
    </main>
  );
}
