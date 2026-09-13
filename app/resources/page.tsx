import ResourceCard from "@/components/ResourceCard";
import { getPublishedResources } from "@/lib/resources";

// Re-fetch Notion data at most once per hour (3600 seconds).
export const revalidate = 3600;

/**
 * Renders published Neuro Resources from Notion.
 * Each resource links out to its external URL (no detail page).
 */
export default async function ResourcesPage() {
  const resources = await getPublishedResources();

  return (
    <main className="homepage">
      <h1>Resources</h1>
      <p className="homepage-subtitle">
        Curated links to useful learning materials for neurology residents.
      </p>

      {resources.length === 0 ? (
        <p className="mt-8 text-neutral-600">
          No published resources yet. Add one in Notion with Status = Published.
        </p>
      ) : (
        <ul className="mt-8 list-none space-y-6 p-0">
          {resources.map((resource) => (
            <ResourceCard
              key={resource.id}
              name={resource.name}
              url={resource.url}
              resourceType={resource.resourceType}
              audience={resource.audience}
              language={resource.language}
              sourceQuality={resource.sourceQuality}
              description={resource.description}
              whyUseful={resource.whyUseful}
              lastChecked={resource.lastChecked}
            />
          ))}
        </ul>
      )}
    </main>
  );
}
