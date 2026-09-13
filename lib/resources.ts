import { isFullDatabase, isFullPage } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client";
import { notion } from "./notion";
import { getPublishedTopics } from "./topics";

/**
 * The shape we use inside the app for one Neuro Resource.
 * This is a simplified version of the Notion page properties.
 */
export type Resource = {
  id: string;
  name: string;
  url: string;
  resourceType: string;
  // Audience is a multi-select in Notion, so we keep every selected value.
  audience: string[];
  language: string;
  sourceQuality: string;
  description: string;
  whyUseful: string;
  featured: boolean;
  lastChecked: string | null;
  // Topics relation page IDs (used for filtering and grouping later).
  topicIds: string[];
  // Human-readable topic names resolved from published Neuro Topics.
  topicNames: string[];
};

/**
 * Reads the Neuro Resources database ID from environment variables.
 * Throws a clear error if it is missing.
 */
function getResourcesDatabaseId(): string {
  const databaseId = process.env.NOTION_RESOURCES_DATABASE_ID;

  if (!databaseId) {
    throw new Error(
      "Missing NOTION_RESOURCES_DATABASE_ID. Add it to your .env.local file.",
    );
  }

  return databaseId;
}

/**
 * Notion API v5 queries a "data source", not a database container directly.
 * This helper looks up the first data source ID inside our Resources database.
 */
async function getResourcesDataSourceId(): Promise<string> {
  const databaseId = getResourcesDatabaseId();
  const database = await notion.databases.retrieve({ database_id: databaseId });

  if (!isFullDatabase(database)) {
    throw new Error(
      "Could not load the full Neuro Resources database from Notion.",
    );
  }

  if (database.data_sources.length === 0) {
    throw new Error("The Neuro Resources database has no data sources.");
  }

  // For a normal single-table Notion database, the first data source is the one we want.
  return database.data_sources[0].id;
}

/**
 * Joins Notion rich text / title arrays into one plain string.
 * Empty arrays become an empty string.
 */
function richTextToPlainText(
  richTextItems: Array<{ plain_text: string }> | undefined,
): string {
  if (!richTextItems || richTextItems.length === 0) {
    return "";
  }

  return richTextItems.map((item) => item.plain_text).join("");
}

/**
 * Reads a title or rich_text property as a plain string.
 * Returns "" if the property is missing or is a different type.
 */
function getTextProperty(
  properties: PageObjectResponse["properties"],
  propertyName: string,
): string {
  const property = properties[propertyName];

  if (!property) {
    return "";
  }

  if (property.type === "title") {
    return richTextToPlainText(property.title);
  }

  if (property.type === "rich_text") {
    return richTextToPlainText(property.rich_text);
  }

  return "";
}

/**
 * Reads a select or status property name as a string.
 * Returns "" if the property is missing or empty.
 */
function getSelectOrStatusName(
  properties: PageObjectResponse["properties"],
  propertyName: string,
): string {
  const property = properties[propertyName];

  if (!property) {
    return "";
  }

  if (property.type === "select") {
    if (property.select) {
      return property.select.name;
    }
    return "";
  }

  if (property.type === "status") {
    if (property.status) {
      return property.status.name;
    }
    return "";
  }

  return "";
}

/**
 * Reads a URL property as a string.
 * Returns "" if the property is missing or empty.
 */
function getUrlProperty(
  properties: PageObjectResponse["properties"],
  propertyName: string,
): string {
  const property = properties[propertyName];

  if (!property) {
    return "";
  }

  if (property.type === "url" && property.url) {
    return property.url;
  }

  return "";
}

/**
 * Reads a checkbox property as a boolean.
 * Returns false if the property is missing or is not a checkbox.
 */
function getCheckboxProperty(
  properties: PageObjectResponse["properties"],
  propertyName: string,
): boolean {
  const property = properties[propertyName];

  if (!property) {
    return false;
  }

  if (property.type === "checkbox") {
    return property.checkbox;
  }

  return false;
}

/**
 * Reads a date property start value as a string, or null if empty.
 */
function getDateProperty(
  properties: PageObjectResponse["properties"],
  propertyName: string,
): string | null {
  const property = properties[propertyName];

  if (!property) {
    return null;
  }

  if (property.type === "date" && property.date) {
    return property.date.start;
  }

  return null;
}

/**
 * Reads a multi-select property as a list of option names.
 * Also accepts a single select (one-item list) so older data still works.
 */
function getMultiSelectNames(
  properties: PageObjectResponse["properties"],
  propertyName: string,
): string[] {
  const property = properties[propertyName];

  if (!property) {
    return [];
  }

  if (property.type === "multi_select") {
    return property.multi_select.map((option) => option.name);
  }

  // Fallback: if Notion still has a single select, wrap it in an array.
  if (property.type === "select" && property.select) {
    return [property.select.name];
  }

  return [];
}

/**
 * Reads a relation property as a list of related page IDs.
 */
function getRelationIds(
  properties: PageObjectResponse["properties"],
  propertyName: string,
): string[] {
  const property = properties[propertyName];

  if (!property) {
    return [];
  }

  if (property.type === "relation") {
    return property.relation.map((relatedPage) => relatedPage.id);
  }

  return [];
}

/**
 * Converts one Notion page into our simple Resource object.
 * topicNames starts empty; fillTopicNames() adds readable names afterward.
 */
function mapNotionPageToResource(page: PageObjectResponse): Resource {
  return {
    id: page.id,
    name: getTextProperty(page.properties, "Name"),
    url: getUrlProperty(page.properties, "URL"),
    resourceType: getSelectOrStatusName(page.properties, "Resource type"),
    audience: getMultiSelectNames(page.properties, "Audience"),
    language:
      getSelectOrStatusName(page.properties, "Language") ||
      getTextProperty(page.properties, "Language"),
    sourceQuality:
      getSelectOrStatusName(page.properties, "Source quality") ||
      getTextProperty(page.properties, "Source quality"),
    description: getTextProperty(page.properties, "Description"),
    whyUseful: getTextProperty(page.properties, "Why useful"),
    featured: getCheckboxProperty(page.properties, "Featured"),
    lastChecked: getDateProperty(page.properties, "Last checked"),
    topicIds: getRelationIds(page.properties, "Topics"),
    topicNames: [],
  };
}

/**
 * Fills topicNames on each resource by looking up published Neuro Topics.
 * Uses topicIds from the Topics relation.
 */
async function fillTopicNames(resources: Resource[]): Promise<Resource[]> {
  const publishedTopics = await getPublishedTopics();

  // Map makes "find name by id" fast while we loop over resources.
  const topicNameById = new Map<string, string>();
  for (const topic of publishedTopics) {
    topicNameById.set(topic.id, topic.name);
  }

  return resources.map((resource) => {
    const topicNames: string[] = [];

    for (const topicId of resource.topicIds) {
      const topicName = topicNameById.get(topicId);
      if (topicName) {
        topicNames.push(topicName);
      }
    }

    return {
      ...resource,
      topicNames,
    };
  });
}

/**
 * Fetches all published Neuro Resources from Notion.
 * Only returns pages where Status = Published.
 */
export async function getPublishedResources(): Promise<Resource[]> {
  const dataSourceId = await getResourcesDataSourceId();

  const resources: Resource[] = [];
  let cursor: string | undefined = undefined;
  let hasMore = true;

  // Notion returns results in pages, so we loop until there are no more.
  while (hasMore) {
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      start_cursor: cursor,
      filter: {
        property: "Status",
        status: {
          equals: "Published",
        },
      },
    });

    for (const result of response.results) {
      // Query results can include partial objects; we only map full pages.
      if (isFullPage(result)) {
        resources.push(mapNotionPageToResource(result));
      }
    }

    hasMore = response.has_more;
    if (response.next_cursor) {
      cursor = response.next_cursor;
    } else {
      cursor = undefined;
    }
  }

  // Resolve Topics relation IDs into readable names for cards and filters.
  return fillTopicNames(resources);
}

/**
 * Fetches published Neuro Resources linked to one Neuro Topic.
 * Uses the Topics relation and Status = Published.
 */
export async function getPublishedResourcesForTopic(
  topicId: string,
): Promise<Resource[]> {
  const dataSourceId = await getResourcesDataSourceId();

  const resources: Resource[] = [];
  let cursor: string | undefined = undefined;
  let hasMore = true;

  while (hasMore) {
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      start_cursor: cursor,
      filter: {
        and: [
          {
            property: "Status",
            status: {
              equals: "Published",
            },
          },
          {
            property: "Topics",
            relation: {
              contains: topicId,
            },
          },
        ],
      },
    });

    for (const result of response.results) {
      if (isFullPage(result)) {
        resources.push(mapNotionPageToResource(result));
      }
    }

    hasMore = response.has_more;
    if (response.next_cursor) {
      cursor = response.next_cursor;
    } else {
      cursor = undefined;
    }
  }

  return fillTopicNames(resources);
}
