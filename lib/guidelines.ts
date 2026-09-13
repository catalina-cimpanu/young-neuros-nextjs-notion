import { isFullDatabase, isFullPage } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client";
import { notion } from "./notion";
import { getPublishedTopics } from "./topics";

/**
 * The shape we use inside the app for one Neuro Guideline.
 * This is a simplified version of the Notion page properties.
 */
export type Guideline = {
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
  // Topics relation page IDs (used for filtering and cards).
  topicIds: string[];
  // Human-readable topic names resolved from published Neuro Topics.
  topicNames: string[];
};

/**
 * Reads the Neuro Guidelines database ID from environment variables.
 * Throws a clear error if it is missing.
 */
function getGuidelinesDatabaseId(): string {
  const databaseId = process.env.NOTION_GUIDELINES_DATABASE_ID;

  if (!databaseId) {
    throw new Error(
      "Missing NOTION_GUIDELINES_DATABASE_ID. Add it to your .env.local file.",
    );
  }

  return databaseId;
}

/**
 * Notion API v5 queries a "data source", not a database container directly.
 * This helper looks up the first data source ID inside our Guidelines database.
 */
async function getGuidelinesDataSourceId(): Promise<string> {
  const databaseId = getGuidelinesDatabaseId();
  const database = await notion.databases.retrieve({ database_id: databaseId });

  if (!isFullDatabase(database)) {
    throw new Error(
      "Could not load the full Neuro Guidelines database from Notion.",
    );
  }

  if (database.data_sources.length === 0) {
    throw new Error("The Neuro Guidelines database has no data sources.");
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
 * Reads a number property as a number, or null if empty.
 */
function getNumberProperty(
  properties: PageObjectResponse["properties"],
  propertyName: string,
): number | null {
  const property = properties[propertyName];

  if (!property) {
    return null;
  }

  if (property.type === "number" && property.number !== null) {
    return property.number;
  }

  return null;
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
 * Converts one Notion page into our simple Guideline object.
 * topicNames starts empty; fillTopicNames() adds readable names afterward.
 */
function mapNotionPageToGuideline(page: PageObjectResponse): Guideline {
  return {
    id: page.id,
    name: getTextProperty(page.properties, "Name"),
    url: getUrlProperty(page.properties, "URL"),
    organization:
      getTextProperty(page.properties, "Organization") ||
      getSelectOrStatusName(page.properties, "Organization"),
    region:
      getSelectOrStatusName(page.properties, "Region") ||
      getTextProperty(page.properties, "Region"),
    language:
      getSelectOrStatusName(page.properties, "Language") ||
      getTextProperty(page.properties, "Language"),
    year: getNumberProperty(page.properties, "Year"),
    guidelineType: getSelectOrStatusName(page.properties, "Guideline type"),
    summary: getTextProperty(page.properties, "Summary"),
    lastReviewed: getDateProperty(page.properties, "Last reviewed"),
    topicIds: getRelationIds(page.properties, "Topics"),
    topicNames: [],
  };
}

/**
 * Fills topicNames on each guideline by looking up published Neuro Topics.
 */
async function fillTopicNames(guidelines: Guideline[]): Promise<Guideline[]> {
  const publishedTopics = await getPublishedTopics();

  const topicNameById = new Map<string, string>();
  for (const topic of publishedTopics) {
    topicNameById.set(topic.id, topic.name);
  }

  return guidelines.map((guideline) => {
    const topicNames: string[] = [];

    for (const topicId of guideline.topicIds) {
      const topicName = topicNameById.get(topicId);
      if (topicName) {
        topicNames.push(topicName);
      }
    }

    return {
      ...guideline,
      topicNames,
    };
  });
}

/**
 * Fetches all published Neuro Guidelines from Notion.
 * Only returns pages where Status = Published.
 */
export async function getPublishedGuidelines(): Promise<Guideline[]> {
  const dataSourceId = await getGuidelinesDataSourceId();

  const guidelines: Guideline[] = [];
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
        guidelines.push(mapNotionPageToGuideline(result));
      }
    }

    hasMore = response.has_more;
    if (response.next_cursor) {
      cursor = response.next_cursor;
    } else {
      cursor = undefined;
    }
  }

  return fillTopicNames(guidelines);
}

/**
 * Fetches published Neuro Guidelines linked to one Neuro Topic.
 * Uses the Topics relation and Status = Published.
 */
export async function getPublishedGuidelinesForTopic(
  topicId: string,
): Promise<Guideline[]> {
  const dataSourceId = await getGuidelinesDataSourceId();

  const guidelines: Guideline[] = [];
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
        guidelines.push(mapNotionPageToGuideline(result));
      }
    }

    hasMore = response.has_more;
    if (response.next_cursor) {
      cursor = response.next_cursor;
    } else {
      cursor = undefined;
    }
  }

  return fillTopicNames(guidelines);
}
