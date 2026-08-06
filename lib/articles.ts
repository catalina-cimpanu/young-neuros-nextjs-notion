import { isFullDatabase, isFullPage } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client";
import { notion } from "./notion";

/**
 * The shape we use inside the app for one Neuro Article.
 * This is listing data only — we do not load full Notion page content yet.
 */
export type Article = {
  id: string;
  title: string;
  slug: string;
  articleType: string;
  excerpt: string;
  seoDescription: string;
  author: string;
  publishedDate: string | null;
  lastReviewed: string | null;
};

/**
 * Reads the Neuro Articles database ID from environment variables.
 * Throws a clear error if it is missing.
 */
function getArticlesDatabaseId(): string {
  const databaseId = process.env.NOTION_ARTICLES_DATABASE_ID;

  if (!databaseId) {
    throw new Error(
      "Missing NOTION_ARTICLES_DATABASE_ID. Add it to your .env.local file.",
    );
  }

  return databaseId;
}

/**
 * Notion API v5 queries a "data source", not a database container directly.
 * This helper looks up the first data source ID inside our Articles database.
 */
async function getArticlesDataSourceId(): Promise<string> {
  const databaseId = getArticlesDatabaseId();
  const database = await notion.databases.retrieve({ database_id: databaseId });

  if (!isFullDatabase(database)) {
    throw new Error(
      "Could not load the full Neuro Articles database from Notion.",
    );
  }

  if (database.data_sources.length === 0) {
    throw new Error("The Neuro Articles database has no data sources.");
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
 * Converts one Notion page into our simple Article object.
 */
function mapNotionPageToArticle(page: PageObjectResponse): Article {
  return {
    id: page.id,
    title: getTextProperty(page.properties, "Title"),
    slug: getTextProperty(page.properties, "Slug"),
    articleType: getSelectOrStatusName(page.properties, "Article type"),
    excerpt: getTextProperty(page.properties, "Excerpt"),
    seoDescription: getTextProperty(page.properties, "SEO description"),
    author:
      getTextProperty(page.properties, "Author") ||
      getSelectOrStatusName(page.properties, "Author"),
    publishedDate: getDateProperty(page.properties, "Published date"),
    lastReviewed: getDateProperty(page.properties, "Last reviewed"),
  };
}

/**
 * Fetches all published Neuro Articles from Notion.
 * Only returns pages where Status = Published, newest published date first.
 */
export async function getPublishedArticles(): Promise<Article[]> {
  const dataSourceId = await getArticlesDataSourceId();

  const articles: Article[] = [];
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
      // Newest articles first for the listing page.
      sorts: [
        {
          property: "Published date",
          direction: "descending",
        },
      ],
    });

    for (const result of response.results) {
      // Query results can include partial objects; we only map full pages.
      if (isFullPage(result)) {
        articles.push(mapNotionPageToArticle(result));
      }
    }

    hasMore = response.has_more;
    if (response.next_cursor) {
      cursor = response.next_cursor;
    } else {
      cursor = undefined;
    }
  }

  return articles;
}
