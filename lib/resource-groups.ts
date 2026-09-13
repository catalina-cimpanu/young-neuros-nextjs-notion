/**
 * Preferred display order for resource types (matches Notion select options).
 * Types not in this list still appear afterward, alphabetically.
 */
const RESOURCE_TYPE_DISPLAY_ORDER = [
  "Website",
  "App",
  "Calculator",
  "Video",
  "Book",
  "Course",
  "Article",
  "Podcast",
  "PDF",
  "Link",
  "Other",
];

/**
 * Turns a resource type into a stable group label.
 * Empty/missing type becomes "Unknown".
 */
export function getResourceTypeLabel(resourceType: string): string {
  if (resourceType.trim() === "") {
    return "Unknown";
  }

  return resourceType;
}

/**
 * One topic group used when rendering resources by topic on /resources.
 */
export type ResourceTopicGroup<T> = {
  topicLabel: string;
  resources: T[];
};

/**
 * One type group used when rendering resources by type on topic pages.
 */
export type ResourceTypeGroup<T extends { resourceType: string }> = {
  typeLabel: string;
  resources: T[];
};

/**
 * Groups resources by related topic name for the /resources listing.
 * A resource linked to several topics appears in each of those groups.
 * Resources with no published topic names go under "Unknown".
 *
 * No Notion imports — safe for client components.
 */
export function groupResourcesByTopic<
  T extends { topicNames: string[] },
>(resources: T[]): ResourceTopicGroup<T>[] {
  const resourcesByTopic = new Map<string, T[]>();

  for (const resource of resources) {
    if (resource.topicNames.length === 0) {
      const existingUnknown = resourcesByTopic.get("Unknown");

      if (existingUnknown) {
        existingUnknown.push(resource);
      } else {
        resourcesByTopic.set("Unknown", [resource]);
      }
    } else {
      for (const topicName of resource.topicNames) {
        const existingGroup = resourcesByTopic.get(topicName);

        if (existingGroup) {
          existingGroup.push(resource);
        } else {
          resourcesByTopic.set(topicName, [resource]);
        }
      }
    }
  }

  const grouped: ResourceTopicGroup<T>[] = [];
  const topicLabels = Array.from(resourcesByTopic.keys()).sort();

  // Keep Unknown at the end even though sort would put it near the end anyway.
  const orderedTopicLabels = topicLabels.filter((label) => label !== "Unknown");
  if (topicLabels.includes("Unknown")) {
    orderedTopicLabels.push("Unknown");
  }

  for (const topicLabel of orderedTopicLabels) {
    const groupResources = resourcesByTopic.get(topicLabel);

    if (groupResources && groupResources.length > 0) {
      grouped.push({
        topicLabel,
        resources: groupResources,
      });
    }
  }

  return grouped;
}

/**
 * Groups resources by Resource type (for topic detail pages).
 * Empty type → "Unknown". Known types keep Notion order; others sort A–Z.
 */
export function groupResourcesByType<T extends { resourceType: string }>(
  resources: T[],
): ResourceTypeGroup<T>[] {
  const resourcesByType = new Map<string, T[]>();

  for (const resource of resources) {
    const typeLabel = getResourceTypeLabel(resource.resourceType);
    const existingGroup = resourcesByType.get(typeLabel);

    if (existingGroup) {
      existingGroup.push(resource);
    } else {
      resourcesByType.set(typeLabel, [resource]);
    }
  }

  const grouped: ResourceTypeGroup<T>[] = [];

  for (const typeLabel of RESOURCE_TYPE_DISPLAY_ORDER) {
    const groupResources = resourcesByType.get(typeLabel);

    if (groupResources && groupResources.length > 0) {
      grouped.push({
        typeLabel,
        resources: groupResources,
      });
      resourcesByType.delete(typeLabel);
    }
  }

  const unknownResources = resourcesByType.get("Unknown");
  if (unknownResources && unknownResources.length > 0) {
    grouped.push({
      typeLabel: "Unknown",
      resources: unknownResources,
    });
    resourcesByType.delete("Unknown");
  }

  const leftoverTypeLabels = Array.from(resourcesByType.keys()).sort();

  for (const typeLabel of leftoverTypeLabels) {
    const groupResources = resourcesByType.get(typeLabel);

    if (groupResources && groupResources.length > 0) {
      grouped.push({
        typeLabel,
        resources: groupResources,
      });
    }
  }

  return grouped;
}
