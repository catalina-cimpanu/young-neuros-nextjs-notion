import { isFullDatabase, isFullPage } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client";
import { notion } from "./notion";

/**
 * The shape we use inside the app for one Site Page (legal / FAQ / Contact / etc.).
 */
export type SitePage = {
  id: string;
  name: string;
  slug: string;
  pageType: string;
  seoDescription: string;
};

/**
 * Reads the Site Pages database ID from environment variables.
 * Throws a clear error if it is missing.
 */
function getSitePagesDatabaseId(): string {
  const databaseId = process.env.NOTION_SITE_PAGES_DATABASE_ID;

  if (!databaseId) {
    throw new Error(
      "Missing NOTION_SITE_PAGES_DATABASE_ID. Add it to your .env.local file.",
    );
  }

  return databaseId;
}

/**
 * Notion API v5 queries a "data source", not a database container directly.
 * This helper looks up the first data source ID inside our Site Pages database.
 */
async function getSitePagesDataSourceId(): Promise<string> {
  const databaseId = getSitePagesDatabaseId();
  const database = await notion.databases.retrieve({ database_id: databaseId });

  if (!isFullDatabase(database)) {
    throw new Error("Could not load the full Site Pages database from Notion.");
  }

  if (database.data_sources.length === 0) {
    throw new Error("The Site Pages database has no data sources.");
  }

  return database.data_sources[0].id;
}

/**
 * Joins Notion rich text / title arrays into one plain string.
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
 * Converts one Notion page into our simple SitePage object.
 */
function mapNotionPageToSitePage(page: PageObjectResponse): SitePage {
  return {
    id: page.id,
    name: getTextProperty(page.properties, "Name"),
    slug: getTextProperty(page.properties, "Slug"),
    pageType: getSelectOrStatusName(page.properties, "Page type"),
    seoDescription: getTextProperty(page.properties, "SEO description"),
  };
}

/**
 * Fetches all published Site Pages from Notion.
 * Only returns pages where Status = Published.
 */
export async function getPublishedSitePages(): Promise<SitePage[]> {
  const dataSourceId = await getSitePagesDataSourceId();

  const sitePages: SitePage[] = [];
  let cursor: string | undefined = undefined;
  let hasMore = true;

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
      if (isFullPage(result)) {
        sitePages.push(mapNotionPageToSitePage(result));
      }
    }

    hasMore = response.has_more;
    if (response.next_cursor) {
      cursor = response.next_cursor;
    } else {
      cursor = undefined;
    }
  }

  return sitePages;
}

/**
 * Fetches one published Site Page by its Slug.
 * Returns null if no matching published page is found.
 */
export async function getPublishedSitePageBySlug(
  slug: string,
): Promise<SitePage | null> {
  const dataSourceId = await getSitePagesDataSourceId();

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
      return mapNotionPageToSitePage(result);
    }
  }

  return null;
}
