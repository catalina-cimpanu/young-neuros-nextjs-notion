"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ResourceCard from "@/components/ResourceCard";
import { groupResourcesByTopic } from "@/lib/resource-groups";

/**
 * Shape of one resource passed from the server page into this client list.
 * Defined here (not imported from lib/resources) so the browser never loads
 * the Notion client or NOTION_TOKEN.
 */
type ResourceListItem = {
  id: string;
  name: string;
  url: string;
  resourceType: string;
  audience: string[];
  language: string;
  sourceQuality: string;
  description: string;
  whyUseful: string;
  lastChecked: string | null;
  topicNames: string[];
};

/**
 * Props for the resources listing UI (filters + topic groups).
 */
type ResourcesListProps = {
  resources: ResourceListItem[];
};

/**
 * Builds a sorted list of unique non-empty strings (for filter dropdowns).
 */
function uniqueSortedLabels(values: string[]): string[] {
  const uniqueValues = new Set<string>();

  for (const value of values) {
    if (value.trim() !== "") {
      uniqueValues.add(value);
    }
  }

  return Array.from(uniqueValues).sort();
}

/**
 * Client list for /resources: Type, Language, Audience, Topic filters
 * (URL search params) and a default view grouped by topic.
 */
export default function ResourcesList({ resources }: ResourcesListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read filters from the URL so links are shareable.
  const selectedType = searchParams.get("type") || "";
  const selectedLanguage = searchParams.get("language") || "";
  const selectedAudience = searchParams.get("audience") || "";
  const selectedTopic = searchParams.get("topic") || "";

  // Dropdown options come from the published data we already loaded.
  const typeOptions = uniqueSortedLabels(
    resources.map((resource) => resource.resourceType),
  );
  const languageOptions = uniqueSortedLabels(
    resources.map((resource) => resource.language),
  );

  const allAudienceValues: string[] = [];
  for (const resource of resources) {
    for (const audienceValue of resource.audience) {
      allAudienceValues.push(audienceValue);
    }
  }
  const audienceOptions = uniqueSortedLabels(allAudienceValues);

  const allTopicValues: string[] = [];
  for (const resource of resources) {
    for (const topicName of resource.topicNames) {
      allTopicValues.push(topicName);
    }
  }
  const topicOptions = uniqueSortedLabels(allTopicValues);

  /**
   * Updates one filter in the URL (or removes it when value is empty).
   * Keeps the other filter params so filters can be combined.
   */
  function updateFilter(
    filterName: "type" | "language" | "audience" | "topic",
    value: string,
  ) {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (value === "") {
      nextParams.delete(filterName);
    } else {
      nextParams.set(filterName, value);
    }

    const queryString = nextParams.toString();

    if (queryString === "") {
      router.push(pathname);
    } else {
      router.push(`${pathname}?${queryString}`);
    }
  }

  /**
   * Clears all filters and returns to /resources with no query string.
   */
  function clearFilters() {
    router.push(pathname);
  }

  // Apply filters before grouping so empty groups do not appear.
  const filteredResources = resources.filter((resource) => {
    if (selectedType !== "" && resource.resourceType !== selectedType) {
      return false;
    }

    if (selectedLanguage !== "" && resource.language !== selectedLanguage) {
      return false;
    }

    // Audience is multi-select: keep the resource if it includes the chosen audience.
    if (selectedAudience !== "") {
      if (!resource.audience.includes(selectedAudience)) {
        return false;
      }
    }

    // Topic filter: keep the resource if it is linked to that topic name.
    if (selectedTopic !== "") {
      if (!resource.topicNames.includes(selectedTopic)) {
        return false;
      }
    }

    return true;
  });

  const topicGroups = groupResourcesByTopic(filteredResources);
  const hasActiveFilters =
    selectedType !== "" ||
    selectedLanguage !== "" ||
    selectedAudience !== "" ||
    selectedTopic !== "";

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex flex-col gap-1 text-sm text-neutral-700">
          Topic
          <select
            className="min-w-[12rem] border border-neutral-300 bg-white px-2 py-1.5"
            value={selectedTopic}
            onChange={(event) => {
              updateFilter("topic", event.target.value);
            }}
          >
            <option value="">All topics</option>
            {topicOptions.map((topicOption) => (
              <option key={topicOption} value={topicOption}>
                {topicOption}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-neutral-700">
          Type
          <select
            className="min-w-[12rem] border border-neutral-300 bg-white px-2 py-1.5"
            value={selectedType}
            onChange={(event) => {
              updateFilter("type", event.target.value);
            }}
          >
            <option value="">All types</option>
            {typeOptions.map((typeOption) => (
              <option key={typeOption} value={typeOption}>
                {typeOption}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-neutral-700">
          Language
          <select
            className="min-w-[12rem] border border-neutral-300 bg-white px-2 py-1.5"
            value={selectedLanguage}
            onChange={(event) => {
              updateFilter("language", event.target.value);
            }}
          >
            <option value="">All languages</option>
            {languageOptions.map((languageOption) => (
              <option key={languageOption} value={languageOption}>
                {languageOption}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-neutral-700">
          Audience
          <select
            className="min-w-[12rem] border border-neutral-300 bg-white px-2 py-1.5"
            value={selectedAudience}
            onChange={(event) => {
              updateFilter("audience", event.target.value);
            }}
          >
            <option value="">All audiences</option>
            {audienceOptions.map((audienceOption) => (
              <option key={audienceOption} value={audienceOption}>
                {audienceOption}
              </option>
            ))}
          </select>
        </label>

        {hasActiveFilters ? (
          <button
            type="button"
            className="text-sm text-blue-700 underline hover:no-underline"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {filteredResources.length === 0 ? (
        <p className="mt-8 text-neutral-600">
          No resources match these filters.
        </p>
      ) : (
        <div className="mt-8 space-y-10">
          {topicGroups.map((topicGroup) => (
            <section
              key={topicGroup.topicLabel}
              aria-labelledby={`topic-${topicGroup.topicLabel}`}
            >
              <h2
                id={`topic-${topicGroup.topicLabel}`}
                className="text-lg font-semibold"
              >
                {topicGroup.topicLabel}
              </h2>

              <ul className="mt-4 list-none space-y-6 p-0">
                {topicGroup.resources.map((resource) => (
                  <ResourceCard
                    key={`${topicGroup.topicLabel}-${resource.id}`}
                    name={resource.name}
                    url={resource.url}
                    resourceType={resource.resourceType}
                    audience={resource.audience}
                    language={resource.language}
                    sourceQuality={resource.sourceQuality}
                    description={resource.description}
                    whyUseful={resource.whyUseful}
                    lastChecked={resource.lastChecked}
                    // Topic is already the section heading, so hide it on the card.
                    topicNames={[]}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
