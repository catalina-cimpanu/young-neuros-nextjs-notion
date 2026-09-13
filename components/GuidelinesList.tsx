"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import GuidelineCard from "@/components/GuidelineCard";
import {
  getGuidelineRegionLabel,
  groupGuidelinesByRegion,
} from "@/lib/guideline-groups";

/**
 * Shape of one guideline passed from the server page into this client list.
 * Defined here (not imported from lib/guidelines) so the browser never loads
 * the Notion client or NOTION_TOKEN.
 */
type GuidelineListItem = {
  id: string;
  name: string;
  url: string;
  organization: string;
  region: string;
  language: string;
  year: number | null;
  guidelineType: string;
  summary: string;
  lastReviewed: string | null;
  topicNames: string[];
};

/**
 * Props for the guidelines listing UI (filters + region groups).
 */
type GuidelinesListProps = {
  guidelines: GuidelineListItem[];
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
 * Client list for /guidelines: Region + Language filters (URL search params)
 * and a default view grouped by region.
 */
export default function GuidelinesList({ guidelines }: GuidelinesListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read filters from the URL so links like /guidelines?region=Europe are shareable.
  const selectedRegion = searchParams.get("region") || "";
  const selectedLanguage = searchParams.get("language") || "";

  // Dropdown options come from the published data we already loaded.
  const regionOptions = uniqueSortedLabels(
    guidelines.map((guideline) => getGuidelineRegionLabel(guideline.region)),
  );
  const languageOptions = uniqueSortedLabels(
    guidelines.map((guideline) => guideline.language),
  );

  /**
   * Updates one filter in the URL (or removes it when value is empty).
   * Keeps the other filter param so both can be combined.
   */
  function updateFilter(filterName: "region" | "language", value: string) {
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
   * Clears both filters and returns to /guidelines with no query string.
   */
  function clearFilters() {
    router.push(pathname);
  }

  // Apply filters before grouping so empty groups do not appear.
  const filteredGuidelines = guidelines.filter((guideline) => {
    const regionLabel = getGuidelineRegionLabel(guideline.region);

    if (selectedRegion !== "" && regionLabel !== selectedRegion) {
      return false;
    }

    if (selectedLanguage !== "" && guideline.language !== selectedLanguage) {
      return false;
    }

    return true;
  });

  const regionGroups = groupGuidelinesByRegion(filteredGuidelines);
  const hasActiveFilters = selectedRegion !== "" || selectedLanguage !== "";

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex flex-col gap-1 text-sm text-neutral-700">
          Region
          <select
            className="min-w-[12rem] border border-neutral-300 bg-white px-2 py-1.5"
            value={selectedRegion}
            onChange={(event) => {
              updateFilter("region", event.target.value);
            }}
          >
            <option value="">All regions</option>
            {regionOptions.map((regionOption) => (
              <option key={regionOption} value={regionOption}>
                {regionOption}
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

      {filteredGuidelines.length === 0 ? (
        <p className="mt-8 text-neutral-600">
          No guidelines match these filters.
        </p>
      ) : (
        <div className="mt-8 space-y-10">
          {regionGroups.map((regionGroup) => (
            <section
              key={regionGroup.regionLabel}
              aria-labelledby={`region-${regionGroup.regionLabel}`}
            >
              <h2
                id={`region-${regionGroup.regionLabel}`}
                className="text-lg font-semibold"
              >
                {regionGroup.regionLabel}
              </h2>

              <ul className="mt-4 list-none space-y-6 p-0">
                {regionGroup.guidelines.map((guideline) => (
                  <GuidelineCard
                    key={guideline.id}
                    name={guideline.name}
                    url={guideline.url}
                    organization={guideline.organization}
                    // Region is already the section heading, so hide it on the card.
                    region=""
                    language={guideline.language}
                    year={guideline.year}
                    guidelineType={guideline.guidelineType}
                    summary={guideline.summary}
                    lastReviewed={guideline.lastReviewed}
                    topicNames={guideline.topicNames}
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
