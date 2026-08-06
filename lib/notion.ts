import { Client } from "@notionhq/client";

/**
 * Returns the Notion API token from environment variables.
 * Throws a clear error if NOTION_TOKEN is missing so we fail early during development.
 */
function getNotionToken(): string {
  const token = process.env.NOTION_TOKEN;

  if (!token) {
    throw new Error(
      "Missing NOTION_TOKEN. Add it to your .env.local file before fetching Notion data.",
    );
  }

  return token;
}

/**
 * Single shared Notion client used by all lib/ fetch files.
 * Import this instead of creating a new Client in every file.
 */
export const notion = new Client({
  auth: getNotionToken(),
});
