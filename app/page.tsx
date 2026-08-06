import Link from "next/link";
import { getPublishedArticles } from "@/lib/articles";
import { getPublishedEvents } from "@/lib/events";
import { getPublishedResources } from "@/lib/resources";
import { getPublishedTopics } from "@/lib/topics";

// Re-fetch Notion data at most once per hour (3600 seconds).
export const revalidate = 3600;

/**
 * Renders the Young Neuros homepage.
 * Shows a short intro, links to main sections, and a few featured/recent items.
 */
export default async function Home() {
  const mainSections = [
    {
      href: "/pathologies",
      label: "Pathologies",
      description: "Disease-focused neurology topics",
    },
    {
      href: "/neuroskills",
      label: "Neuroskills",
      description: "Practical skills for training",
    },
    {
      href: "/resources",
      label: "Resources",
      description: "Curated learning links",
    },
    {
      href: "/guidelines",
      label: "Guidelines",
      description: "Clinical guideline links",
    },
    {
      href: "/calendar",
      label: "Calendar",
      description: "Events and courses",
    },
    {
      href: "/articles",
      label: "Articles",
      description: "Short write-ups for learners",
    },
  ];

  // Fetch all MVP data in parallel so the homepage does not wait one-by-one.
  const [topics, resources, events, articles] = await Promise.all([
    getPublishedTopics(),
    getPublishedResources(),
    getPublishedEvents(),
    getPublishedArticles(),
  ]);

  // Prefer featured items when available; otherwise show a small recent sample.
  const featuredTopics = topics.filter((topic) => topic.featured).slice(0, 3);
  const featuredResources = resources
    .filter((resource) => resource.featured)
    .slice(0, 3);
  const upcomingEvents = events.slice(0, 3);
  const recentArticles = articles.slice(0, 3);

  return (
    <main className="homepage">
      <h1>Young Neuros</h1>

      <p className="homepage-subtitle">
        A simple public learning hub for neurology residents and early-career
        neurologists. Browse pathologies, skills, resources, guidelines,
        events, and articles — all curated in Notion and shown here when
        published.
      </p>

      <section className="mt-10" aria-labelledby="explore-heading">
        <h2 id="explore-heading" className="text-lg font-semibold">
          Explore
        </h2>
        <ul className="homepage-nav">
          {mainSections.map((section) => (
            <li key={section.href}>
              <Link href={section.href}>{section.label}</Link>
              <span className="ml-2 text-neutral-500">
                — {section.description}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {featuredTopics.length > 0 ? (
        <section className="mt-10" aria-labelledby="topics-heading">
          <h2 id="topics-heading" className="text-lg font-semibold">
            Featured topics
          </h2>
          <ul className="mt-4 list-none space-y-3 p-0">
            {featuredTopics.map((topic) => (
              <li key={topic.id}>
                <Link
                  href={
                    topic.topicType === "Neuroskill"
                      ? "/neuroskills"
                      : "/pathologies"
                  }
                  className="font-medium text-blue-700 underline hover:no-underline"
                >
                  {topic.name}
                </Link>
                {topic.shortDescription ? (
                  <p className="mt-1 text-sm text-neutral-600">
                    {topic.shortDescription}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {featuredResources.length > 0 ? (
        <section className="mt-10" aria-labelledby="resources-heading">
          <h2 id="resources-heading" className="text-lg font-semibold">
            Featured resources
          </h2>
          <ul className="mt-4 list-none space-y-3 p-0">
            {featuredResources.map((resource) => (
              <li key={resource.id}>
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
                {resource.description ? (
                  <p className="mt-1 text-sm text-neutral-600">
                    {resource.description}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {upcomingEvents.length > 0 ? (
        <section className="mt-10" aria-labelledby="events-heading">
          <h2 id="events-heading" className="text-lg font-semibold">
            Upcoming events
          </h2>
          <ul className="mt-4 list-none space-y-3 p-0">
            {upcomingEvents.map((event) => (
              <li key={event.id}>
                <Link
                  href="/calendar"
                  className="font-medium text-blue-700 underline hover:no-underline"
                >
                  {event.name}
                </Link>
                {event.date ? (
                  <p className="mt-1 text-sm text-neutral-600">{event.date}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {recentArticles.length > 0 ? (
        <section className="mt-10" aria-labelledby="articles-heading">
          <h2 id="articles-heading" className="text-lg font-semibold">
            Recent articles
          </h2>
          <ul className="mt-4 list-none space-y-3 p-0">
            {recentArticles.map((article) => (
              <li key={article.id}>
                <Link
                  href="/articles"
                  className="font-medium text-blue-700 underline hover:no-underline"
                >
                  {article.title}
                </Link>
                {article.excerpt ? (
                  <p className="mt-1 text-sm text-neutral-600">
                    {article.excerpt}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
