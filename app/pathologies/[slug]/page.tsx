import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedGuidelinesForTopic } from "@/lib/guidelines";
import { getPublishedResourcesForTopic } from "@/lib/resources";
import { getPublishedTopicBySlug } from "@/lib/topics";

// Re-fetch Notion data at most once per hour (3600 seconds).
export const revalidate = 3600;

/**
 * Renders one published Pathology topic by slug.
 * Shows three related sections, matching the old site layout:
 * Guidelines, Resources, and Links (Links = Resource type "Link" in Notion).
 * Example URL: /pathologies/multiple-sclerosis
 */
export default async function PathologyTopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const topic = await getPublishedTopicBySlug(slug);

  // Only show this page if the topic exists, is published, and is a Pathology.
  if (!topic || topic.topicType !== "Pathology") {
    notFound();
  }

  // Load related CMS items in parallel after we know the topic id.
  const [allResources, guidelines] = await Promise.all([
    getPublishedResourcesForTopic(topic.id),
    getPublishedGuidelinesForTopic(topic.id),
  ]);

  // In Notion, Links are stored in Neuro Resources with Resource type = Link.
  const links = allResources.filter((resource) => {
    return resource.resourceType === "Link";
  });

  // Everything else from Neuro Resources stays under Resources.
  const resources = allResources.filter((resource) => {
    return resource.resourceType !== "Link";
  });

  return (
    <main className="homepage">
      <p className="text-sm">
        <Link
          href="/pathologies"
          className="text-blue-700 underline hover:no-underline"
        >
          ← Back to Pathologies
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

      <section className="mt-10" aria-labelledby="guidelines-heading">
        <h2 id="guidelines-heading" className="text-lg font-semibold">
          Guidelines
        </h2>

        {guidelines.length === 0 ? (
          <p className="mt-3 text-neutral-600">
            No published guidelines linked to this topic yet.
          </p>
        ) : (
          <ul className="mt-4 list-none space-y-4 p-0">
            {guidelines.map((guideline) => (
              <li
                key={guideline.id}
                className="border-b border-neutral-200 pb-3"
              >
                {guideline.url ? (
                  <a
                    href={guideline.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-700 underline hover:no-underline"
                  >
                    {guideline.name}
                  </a>
                ) : (
                  <span className="font-medium">{guideline.name}</span>
                )}

                {guideline.organization ? (
                  <p className="mt-1 text-sm text-neutral-500">
                    {guideline.organization}
                    {guideline.year !== null ? ` · ${guideline.year}` : ""}
                  </p>
                ) : null}

                {guideline.summary ? (
                  <p className="mt-1 text-sm text-neutral-700">
                    {guideline.summary}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10" aria-labelledby="resources-heading">
        <h2 id="resources-heading" className="text-lg font-semibold">
          Resources
        </h2>

        {resources.length === 0 ? (
          <p className="mt-3 text-neutral-600">
            No published resources linked to this topic yet.
          </p>
        ) : (
          <ul className="mt-4 list-none space-y-4 p-0">
            {resources.map((resource) => (
              <li key={resource.id} className="border-b border-neutral-200 pb-3">
                {resource.url ? (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-700 underline hover:no-underline"
                  >
                    {resource.name}
                  </a>
                ) : (
                  <span className="font-medium">{resource.name}</span>
                )}

                {resource.resourceType ? (
                  <p className="mt-1 text-sm text-neutral-500">
                    Type: {resource.resourceType}
                  </p>
                ) : null}

                {resource.description ? (
                  <p className="mt-1 text-sm text-neutral-700">
                    {resource.description}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10" aria-labelledby="links-heading">
        <h2 id="links-heading" className="text-lg font-semibold">
          Links
        </h2>

        {links.length === 0 ? (
          <p className="mt-3 text-neutral-600">
            No published links linked to this topic yet.
          </p>
        ) : (
          <ul className="mt-4 list-none space-y-4 p-0">
            {links.map((linkItem) => (
              <li key={linkItem.id} className="border-b border-neutral-200 pb-3">
                {linkItem.url ? (
                  <a
                    href={linkItem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-700 underline hover:no-underline"
                  >
                    {linkItem.name}
                  </a>
                ) : (
                  <span className="font-medium">{linkItem.name}</span>
                )}

                {linkItem.description ? (
                  <p className="mt-1 text-sm text-neutral-700">
                    {linkItem.description}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
