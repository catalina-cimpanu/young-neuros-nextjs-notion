import { isFullDatabase, isFullPage } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client";
import { notion } from "./notion";

/**
 * The shape we use inside the app for one Neuro Topic.
 * This is a simplified version of the Notion page properties.
 */
export type Topic = {
  id: string;
  name: string;
  slug: string;
  topicType: string;
  shortDescription: string;
  residencyRelevance: string;
  featured: boolean;
  lastReviewed: string | null;
};

/**
 * Reads the Neuro Topics database ID from environment variables.
 * Throws a clear error if it is missing.
 */
function getTopicsDatabaseId(): string {
  const databaseId = process.env.NOTION_TOPICS_DATABASE_ID;

  if (!databaseId) {
    throw new Error(
      "Missing NOTION_TOPICS_DATABASE_ID. Add it to your .env.local file.",
    );
  }

  return databaseId;
}

/**
 * Notion API v5 queries a "data source", not a database container directly.
 * This helper looks up the first data source ID inside our Topics database.
 */
async function getTopicsDataSourceId(): Promise<string> {
  const databaseId = getTopicsDatabaseId();
  const database = await notion.databases.retrieve({ database_id: databaseId });

  if (!isFullDatabase(database)) {
    throw new Error("Could not load the full Neuro Topics database from Notion.");
  }

  if (database.data_sources.length === 0) {
    throw new Error("The Neuro Topics database has no data sources.");
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
 * Converts one Notion page into our simple Topic object.
 */
function mapNotionPageToTopic(page: PageObjectResponse): Topic {
  return {
    id: page.id,
    name: getTextProperty(page.properties, "Name"),
    slug: getTextProperty(page.properties, "Slug"),
    topicType: getSelectOrStatusName(page.properties, "Topic type"),
    shortDescription: getTextProperty(page.properties, "Short description"),
    // Residency relevance may be rich text or a select in Notion — try both.
    residencyRelevance:
      getTextProperty(page.properties, "Residency relevance") ||
      getSelectOrStatusName(page.properties, "Residency relevance"),
    featured: getCheckboxProperty(page.properties, "Featured"),
    lastReviewed: getDateProperty(page.properties, "Last reviewed"),
  };
}

/**
 * Fetches all published Neuro Topics from Notion.
 * Only returns pages where Status = Published.
 */
export async function getPublishedTopics(): Promise<Topic[]> {
  const dataSourceId = await getTopicsDataSourceId();

  const topics: Topic[] = [];
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
        topics.push(mapNotionPageToTopic(result));
      }
    }

    hasMore = response.has_more;
    if (response.next_cursor) {
      cursor = response.next_cursor;
    } else {
      cursor = undefined;
    }
  }

  return topics;
}

/**
 * Fetches one published Neuro Topic by its Slug.
 * Returns null if no matching published topic is found.
 */
export async function getPublishedTopicBySlug(
  slug: string,
): Promise<Topic | null> {
  const dataSourceId = await getTopicsDataSourceId();

  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    page_size: 1,
    filter: {
      and: [
        {
          property: "Status",
          status: {
            equals: "Published",
          },
        },
        {
          property: "Slug",
          rich_text: {
            equals: slug,
          },
        },
      ],
    },
  });

  for (const result of response.results) {
    if (isFullPage(result)) {
      return mapNotionPageToTopic(result);
    }
  }

  return null;
}
