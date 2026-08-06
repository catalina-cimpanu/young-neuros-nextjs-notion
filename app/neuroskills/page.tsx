import { getPublishedTopics } from "@/lib/topics";

// Re-fetch Notion data at most once per hour (3600 seconds).
export const revalidate = 3600;

/**
 * Renders published Neuroskill topics from Notion.
 * Filters getPublishedTopics() down to Topic type = Neuroskill.
 */
export default async function NeuroskillsPage() {
  const topics = await getPublishedTopics();

  // Keep only topics marked as Neuroskill in Notion.
  const neuroskills = topics.filter((topic) => {
    return topic.topicType === "Neuroskill";
  });

  return (
    <main className="homepage">
      <h1>Neuroskills</h1>
      <p className="homepage-subtitle">
        Practical skills for neurology training, from examination techniques to
        procedures.
      </p>

      {neuroskills.length === 0 ? (
        <p className="mt-8 text-neutral-600">
          No published neuroskills yet. Add one in Notion with Status =
          Published and Topic type = Neuroskill.
        </p>
      ) : (
        <ul className="mt-8 list-none space-y-6 p-0">
          {neuroskills.map((neuroskill) => (
            <li key={neuroskill.id} className="border-b border-neutral-200 pb-4">
              <h2 className="text-xl font-semibold">{neuroskill.name}</h2>

              {neuroskill.shortDescription ? (
                <p className="mt-2 text-neutral-700">
                  {neuroskill.shortDescription}
                </p>
              ) : null}

              {neuroskill.residencyRelevance ? (
                <p className="mt-2 text-sm text-neutral-500">
                  Residency relevance: {neuroskill.residencyRelevance}
                </p>
              ) : null}

              {neuroskill.lastReviewed ? (
                <p className="mt-1 text-sm text-neutral-500">
                  Last reviewed: {neuroskill.lastReviewed}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
