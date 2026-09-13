import { isFullBlock, isFullDatabase, isFullPage } from "@notionhq/client";
import type {
  BlockObjectResponse,
  PageObjectResponse,
} from "@notionhq/client";
import { notion } from "./notion";

/**
 * The shape we use inside the app for one Neuro Article.
 * Listing/detail properties only — page body is fetched separately.
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
  // Tags is a multi-select in Notion.
  tags: string[];
};

/**
 * A Notion block plus optional nested children (for lists, etc.).
 */
export type ArticleBlock = BlockObjectResponse & {
  children?: ArticleBlock[];
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
 * Reads a multi-select property as a list of option names.
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

  return [];
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
    tags: getMultiSelectNames(page.properties, "Tags"),
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

/**
 * Fetches one published Neuro Article by its Slug.
 * Returns null if no matching published article is found.
 */
export async function getPublishedArticleBySlug(
  slug: string,
): Promise<Article | null> {
  const dataSourceId = await getArticlesDataSourceId();

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
      return mapNotionPageToArticle(result);
    }
  }

  return null;
}

/**
 * Fetches one page of Notion block children for a block or page id.
 * Loops until every page of results is collected.
 */
async function listAllChildBlocks(
  parentBlockId: string,
): Promise<BlockObjectResponse[]> {
  const blocks: BlockObjectResponse[] = [];
  let cursor: string | undefined = undefined;
  let hasMore = true;

  while (hasMore) {
    const response = await notion.blocks.children.list({
      block_id: parentBlockId,
      start_cursor: cursor,
      page_size: 100,
    });

    for (const result of response.results) {
      if (isFullBlock(result)) {
        blocks.push(result);
      }
    }

    hasMore = response.has_more;
    if (response.next_cursor) {
      cursor = response.next_cursor;
    } else {
      cursor = undefined;
    }
  }

  return blocks;
}

/**
 * True when we should load nested children for rendering
 * (list items and toggles). Skip child pages/databases.
 */
function shouldFetchNestedChildren(block: BlockObjectResponse): boolean {
  if (!block.has_children) {
    return false;
  }

  if (
    block.type === "bulleted_list_item" ||
    block.type === "numbered_list_item" ||
    block.type === "quote" ||
    block.type === "toggle"
  ) {
    return true;
  }

  return false;
}

/**
 * Fetches Notion blocks for an article page, including nested list children.
 * Returns a tree the ArticleBody component can render.
 */
export async function getArticleBlocks(
  pageId: string,
): Promise<ArticleBlock[]> {
  const topLevelBlocks = await listAllChildBlocks(pageId);
  const blocksWithChildren: ArticleBlock[] = [];

  for (const block of topLevelBlocks) {
    if (shouldFetchNestedChildren(block)) {
      const childBlocks = await getArticleBlocks(block.id);
      blocksWithChildren.push({
        ...block,
        children: childBlocks,
      });
    } else {
      blocksWithChildren.push(block);
    }
  }

  return blocksWithChildren;
}

/**
 * Finds the previous (older) and next (newer) published articles
 * around the current slug. Articles are expected newest-first.
 */
export function getAdjacentArticles(
  articles: Article[],
  currentSlug: string,
): { previousArticle: Article | null; nextArticle: Article | null } {
  const articlesWithSlug = articles.filter((article) => {
    return article.slug !== "";
  });

  const currentIndex = articlesWithSlug.findIndex((article) => {
    return article.slug === currentSlug;
  });

  if (currentIndex === -1) {
    return {
      previousArticle: null,
      nextArticle: null,
    };
  }

  // Newest-first list: a higher index is older → Previous.
  const previousArticle =
    currentIndex < articlesWithSlug.length - 1
      ? articlesWithSlug[currentIndex + 1]
      : null;

  // A lower index is newer → Next.
  const nextArticle =
    currentIndex > 0 ? articlesWithSlug[currentIndex - 1] : null;

  return {
    previousArticle,
    nextArticle,
  };
}
