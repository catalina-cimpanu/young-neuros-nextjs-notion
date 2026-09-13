import TopicCard from "@/components/TopicCard";
import { getPublishedTopics } from "@/lib/topics";

// Re-fetch Notion data at most once per hour (3600 seconds).
export const revalidate = 3600;

/**
 * Renders published Neuroskill topics from Notion.
 * Filters getPublishedTopics() down to Topic type = Neuroskill.
 */
export default async function NeuroskillsPage() {
  const topics = await getPublishedTopics();

  // Keep only topics marked as Neuroskill in Notion, and only if they have a slug for linking.
  const neuroskills = topics.filter((topic) => {
    return topic.topicType === "Neuroskill" && topic.slug !== "";
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
            <TopicCard
              key={neuroskill.id}
              name={neuroskill.name}
              shortDescription={neuroskill.shortDescription}
              residencyRelevance={neuroskill.residencyRelevance}
              lastReviewed={neuroskill.lastReviewed}
              href={`/neuroskills/${neuroskill.slug}`}
            />
          ))}
        </ul>
      )}
    </main>
  );
}
