import TopicCard from "@/components/TopicCard";
import { getPublishedTopics } from "@/lib/topics";

// Re-fetch Notion data at most once per hour (3600 seconds).
export const revalidate = 3600;

/**
 * Renders published Pathology topics from Notion.
 * Filters getPublishedTopics() down to Topic type = Pathology.
 */
export default async function PathologiesPage() {
  const topics = await getPublishedTopics();

  // Keep only topics marked as Pathology in Notion, and only if they have a slug for linking.
  const pathologies = topics.filter((topic) => {
    return topic.topicType === "Pathology" && topic.slug !== "";
  });

  return (
    <main className="homepage">
      <h1>Pathologies</h1>
      <p className="homepage-subtitle">
        Neurology topics focused on diseases and clinical conditions.
      </p>

      {pathologies.length === 0 ? (
        <p className="mt-8 text-neutral-600">
          No published pathologies yet. Add one in Notion with Status =
          Published and Topic type = Pathology.
        </p>
      ) : (
        <ul className="mt-8 list-none space-y-6 p-0">
          {pathologies.map((pathology) => (
            <TopicCard
              key={pathology.id}
              name={pathology.name}
              shortDescription={pathology.shortDescription}
              residencyRelevance={pathology.residencyRelevance}
              lastReviewed={pathology.lastReviewed}
              href={`/pathologies/${pathology.slug}`}
            />
          ))}
        </ul>
      )}
    </main>
  );
}
