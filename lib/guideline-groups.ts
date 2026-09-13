/**
 * Preferred display order for guideline regions (matches Notion select options).
 * Regions not in this list still appear, after these, alphabetically.
 */
const REGION_DISPLAY_ORDER = [
  "Europe",
  "USA",
  "Germany",
  "Switzerland",
  "International",
  "Other",
];

/**
 * Turns a guideline region into a stable group label.
 * Empty/missing region becomes "Unknown".
 */
export function getGuidelineRegionLabel(region: string): string {
  if (region.trim() === "") {
    return "Unknown";
  }

  return region;
}

/**
 * One region group used when rendering guidelines by region.
 * Generic so both server and client code can reuse it without importing Notion.
 */
export type GuidelineRegionGroup<T extends { region: string }> = {
  regionLabel: string;
  guidelines: T[];
};

/**
 * Groups guidelines by region for the listing and topic pages.
 * Empty region → "Unknown". Known regions keep Notion order; others sort A–Z.
 *
 * This file has no Notion imports on purpose — client components can use it
 * without pulling NOTION_TOKEN into the browser.
 */
export function groupGuidelinesByRegion<T extends { region: string }>(
  guidelines: T[],
): GuidelineRegionGroup<T>[] {
  const guidelinesByRegion = new Map<string, T[]>();

  for (const guideline of guidelines) {
    const regionLabel = getGuidelineRegionLabel(guideline.region);
    const existingGroup = guidelinesByRegion.get(regionLabel);

    if (existingGroup) {
      existingGroup.push(guideline);
    } else {
      guidelinesByRegion.set(regionLabel, [guideline]);
    }
  }

  const grouped: GuidelineRegionGroup<T>[] = [];

  // First add regions in the preferred Notion order (skip empty groups).
  for (const regionLabel of REGION_DISPLAY_ORDER) {
    const groupGuidelines = guidelinesByRegion.get(regionLabel);

    if (groupGuidelines && groupGuidelines.length > 0) {
      grouped.push({
        regionLabel,
        guidelines: groupGuidelines,
      });
      guidelinesByRegion.delete(regionLabel);
    }
  }

  // Put Unknown near the end, before any unexpected leftover labels.
  const unknownGuidelines = guidelinesByRegion.get("Unknown");
  if (unknownGuidelines && unknownGuidelines.length > 0) {
    grouped.push({
      regionLabel: "Unknown",
      guidelines: unknownGuidelines,
    });
    guidelinesByRegion.delete("Unknown");
  }

  // Any other region labels (typos or new Notion options) sort alphabetically.
  const leftoverRegionLabels = Array.from(guidelinesByRegion.keys()).sort();

  for (const regionLabel of leftoverRegionLabels) {
    const groupGuidelines = guidelinesByRegion.get(regionLabel);

    if (groupGuidelines && groupGuidelines.length > 0) {
      grouped.push({
        regionLabel,
        guidelines: groupGuidelines,
      });
    }
  }

  return grouped;
}
