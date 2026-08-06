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
            <li key={resource.id} className="border-b border-neutral-200 pb-4">
              {resource.url ? (
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl font-semibold text-blue-700 underline hover:no-underline"
                >
                  {resource.name}
                </a>
              ) : (
                <h2 className="text-xl font-semibold">{resource.name}</h2>
              )}

              {resource.resourceType ? (
                <p className="mt-2 text-sm text-neutral-500">
                  Type: {resource.resourceType}
                </p>
              ) : null}

              {resource.description ? (
                <p className="mt-2 text-neutral-700">{resource.description}</p>
              ) : null}

              {resource.whyUseful ? (
                <p className="mt-2 text-neutral-700">
                  Why useful: {resource.whyUseful}
                </p>
              ) : null}

              {resource.audience ? (
                <p className="mt-2 text-sm text-neutral-500">
                  Audience: {resource.audience}
                </p>
              ) : null}

              {resource.language ? (
                <p className="mt-1 text-sm text-neutral-500">
                  Language: {resource.language}
                </p>
              ) : null}

              {resource.sourceQuality ? (
                <p className="mt-1 text-sm text-neutral-500">
                  Source quality: {resource.sourceQuality}
                </p>
              ) : null}

              {resource.lastChecked ? (
                <p className="mt-1 text-sm text-neutral-500">
                  Last checked: {resource.lastChecked}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
