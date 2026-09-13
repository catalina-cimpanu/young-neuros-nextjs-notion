import { Suspense } from "react";
import ResourcesList from "@/components/ResourcesList";
import { getPublishedResources } from "@/lib/resources";

// Re-fetch Notion data at most once per hour (3600 seconds).
export const revalidate = 3600;

/**
 * Renders published Neuro Resources from Notion.
 * Grouping and filters live in the client ResourcesList component.
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
        // Suspense is required around useSearchParams() in the client list.
        <Suspense
          fallback={<p className="mt-8 text-neutral-600">Loading filters…</p>}
        >
          <ResourcesList resources={resources} />
        </Suspense>
      )}
    </main>
  );
}
