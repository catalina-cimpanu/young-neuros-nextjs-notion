import { isFullDatabase, isFullPage } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client";
import { notion } from "./notion";

/**
 * The shape we use inside the app for one Neuro Event.
 * This is a simplified version of the Notion page properties.
 */
export type Event = {
  id: string;
  name: string;
  url: string;
  date: string | null;
  location: string;
  onlineOrInPerson: string;
  eventType: string;
  organizer: string;
  language: string;
  description: string;
};

/**
 * Reads the Neuro Events database ID from environment variables.
 * Throws a clear error if it is missing.
 */
function getEventsDatabaseId(): string {
  const databaseId = process.env.NOTION_EVENTS_DATABASE_ID;

  if (!databaseId) {
    throw new Error(
      "Missing NOTION_EVENTS_DATABASE_ID. Add it to your .env.local file.",
    );
  }

  return databaseId;
}

/**
 * Notion API v5 queries a "data source", not a database container directly.
 * This helper looks up the first data source ID inside our Events database.
 */
async function getEventsDataSourceId(): Promise<string> {
  const databaseId = getEventsDatabaseId();
  const database = await notion.databases.retrieve({ database_id: databaseId });

  if (!isFullDatabase(database)) {
    throw new Error(
      "Could not load the full Neuro Events database from Notion.",
    );
  }

  if (database.data_sources.length === 0) {
    throw new Error("The Neuro Events database has no data sources.");
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
 * Converts one Notion page into our simple Event object.
 */
function mapNotionPageToEvent(page: PageObjectResponse): Event {
  return {
    id: page.id,
    name: getTextProperty(page.properties, "Name"),
    url: getUrlProperty(page.properties, "URL"),
    date: getDateProperty(page.properties, "Date"),
    location: getTextProperty(page.properties, "Location"),
    onlineOrInPerson: getSelectOrStatusName(
      page.properties,
      "Online or in-person",
    ),
    eventType: getSelectOrStatusName(page.properties, "Event type"),
    organizer:
      getTextProperty(page.properties, "Organizer") ||
      getSelectOrStatusName(page.properties, "Organizer"),
    language:
      getSelectOrStatusName(page.properties, "Language") ||
      getTextProperty(page.properties, "Language"),
    description: getTextProperty(page.properties, "Description"),
  };
}

/**
 * Fetches all published Neuro Events from Notion.
 * Only returns pages where Status = Published, sorted by Date ascending.
 */
export async function getPublishedEvents(): Promise<Event[]> {
  const dataSourceId = await getEventsDataSourceId();

  const events: Event[] = [];
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
      // Earliest dates first so the calendar reads chronologically.
      sorts: [
        {
          property: "Date",
          direction: "ascending",
        },
      ],
    });

    for (const result of response.results) {
      // Query results can include partial objects; we only map full pages.
      if (isFullPage(result)) {
        events.push(mapNotionPageToEvent(result));
      }
    }

    hasMore = response.has_more;
    if (response.next_cursor) {
      cursor = response.next_cursor;
    } else {
      cursor = undefined;
    }
  }

  return events;
}
