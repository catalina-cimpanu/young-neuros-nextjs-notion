import Link from "next/link";
import { notFound } from "next/navigation";
import GuidelineCard from "@/components/GuidelineCard";
import ResourceCard from "@/components/ResourceCard";
import { getPublishedGuidelinesForTopic } from "@/lib/guidelines";
import { getPublishedResourcesForTopic } from "@/lib/resources";
import { getPublishedTopicBySlug } from "@/lib/topics";

// Re-fetch Notion data at most once per hour (3600 seconds).
export const revalidate = 3600;

/**
 * Renders one published Neuroskill topic by slug.
 * Shows three related sections, matching the old site layout:
 * Guidelines, Resources, and Links (Links = Resource type "Link" in Notion).
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
              <GuidelineCard
                key={guideline.id}
                name={guideline.name}
                url={guideline.url}
                organization={guideline.organization}
                region={guideline.region}
                language={guideline.language}
                year={guideline.year}
                guidelineType={guideline.guidelineType}
                summary={guideline.summary}
                lastReviewed={guideline.lastReviewed}
              />
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
