import type { ReactNode } from "react";
import type { RichTextItemResponse } from "@notionhq/client";
import type { ArticleBlock } from "@/lib/articles";

/**
 * Turns heading text into a URL-friendly id for in-page links / future TOC.
 */
function headingIdFromText(text: string): string {
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (slug === "") {
    return "section";
  }

  return slug;
}

/**
 * Renders Notion rich text (bold, italic, code, links) as React nodes.
 */
function RichText({ items }: { items: RichTextItemResponse[] }) {
  return (
    <>
      {items.map((item, index) => {
        let node: ReactNode = item.plain_text;

        if (item.annotations.code) {
          node = (
            <code className="rounded bg-neutral-100 px-1 text-sm">{node}</code>
          );
        }

        if (item.annotations.bold) {
          node = <strong>{node}</strong>;
        }

        if (item.annotations.italic) {
          node = <em>{node}</em>;
        }

        if (item.annotations.strikethrough) {
          node = <s>{node}</s>;
        }

        if (item.annotations.underline) {
          node = <span className="underline">{node}</span>;
        }

        // Links can come from href or from a text.link object.
        let href: string | null = item.href;
        if (!href && item.type === "text" && item.text.link) {
          href = item.text.link.url;
        }

        if (href) {
          node = (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 underline hover:no-underline"
            >
              {node}
            </a>
          );
        }

        return <span key={index}>{node}</span>;
      })}
    </>
  );
}

/**
 * Renders nested children under a list item or quote, if any exist.
 */
function NestedBlocks({ blocks }: { blocks: ArticleBlock[] | undefined }) {
  if (!blocks || blocks.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 space-y-2">
      <ArticleBlocks blocks={blocks} />
    </div>
  );
}

/**
 * Renders one Notion block. Unsupported types show a short note in development style.
 */
function ArticleBlockView({ block }: { block: ArticleBlock }) {
  if (block.type === "paragraph") {
    return (
      <p className="leading-relaxed text-neutral-800">
        <RichText items={block.paragraph.rich_text} />
      </p>
    );
  }

  if (block.type === "heading_1") {
    const text = block.heading_1.rich_text
      .map((item) => item.plain_text)
      .join("");
    return (
      <h2
        id={headingIdFromText(text)}
        className="mt-8 text-2xl font-semibold text-neutral-900"
      >
        <RichText items={block.heading_1.rich_text} />
      </h2>
    );
  }

  if (block.type === "heading_2") {
    const text = block.heading_2.rich_text
      .map((item) => item.plain_text)
      .join("");
    return (
      <h2
        id={headingIdFromText(text)}
        className="mt-8 text-xl font-semibold text-neutral-900"
      >
        <RichText items={block.heading_2.rich_text} />
      </h2>
    );
  }

  if (block.type === "heading_3") {
    const text = block.heading_3.rich_text
      .map((item) => item.plain_text)
      .join("");
    return (
      <h3
        id={headingIdFromText(text)}
        className="mt-6 text-lg font-semibold text-neutral-900"
      >
        <RichText items={block.heading_3.rich_text} />
      </h3>
    );
  }

  if (block.type === "bulleted_list_item") {
    return (
      <li className="ml-5 list-disc text-neutral-800">
        <RichText items={block.bulleted_list_item.rich_text} />
        <NestedBlocks blocks={block.children} />
      </li>
    );
  }

  if (block.type === "numbered_list_item") {
    return (
      <li className="ml-5 list-decimal text-neutral-800">
        <RichText items={block.numbered_list_item.rich_text} />
        <NestedBlocks blocks={block.children} />
      </li>
    );
  }

  if (block.type === "quote") {
    return (
      <blockquote className="border-l-4 border-neutral-300 pl-4 text-neutral-700 italic">
        <RichText items={block.quote.rich_text} />
        <NestedBlocks blocks={block.children} />
      </blockquote>
    );
  }

  if (block.type === "divider") {
    return <hr className="my-8 border-neutral-200" />;
  }

  if (block.type === "code") {
    const codeText = block.code.rich_text
      .map((item) => item.plain_text)
      .join("");

    return (
      <pre className="overflow-x-auto rounded bg-neutral-100 p-4 text-sm text-neutral-800">
        <code>{codeText}</code>
      </pre>
    );
  }

  if (block.type === "image") {
    let imageUrl = "";
    let captionText = "";

    if (block.image.type === "external") {
      imageUrl = block.image.external.url;
    } else if (block.image.type === "file") {
      imageUrl = block.image.file.url;
    }

    captionText = block.image.caption
      .map((item) => item.plain_text)
      .join("");

    if (!imageUrl) {
      return null;
    }

    return (
      <figure className="my-6">
        {/* Notion file URLs expire; external URLs are more stable. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={captionText || "Article image"}
          className="h-auto max-w-full"
        />
        {captionText ? (
          <figcaption className="mt-2 text-sm text-neutral-500">
            {captionText}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  if (block.type === "toggle") {
    return (
      <details className="rounded border border-neutral-200 p-3">
        <summary className="cursor-pointer font-medium text-neutral-800">
          <RichText items={block.toggle.rich_text} />
        </summary>
        <NestedBlocks blocks={block.children} />
      </details>
    );
  }

  // Skip unsupported block types quietly for the MVP.
  return null;
}

/**
 * Groups consecutive list items into one <ul> or <ol> for cleaner HTML.
 * Other blocks render one-by-one.
 */
function ArticleBlocks({ blocks }: { blocks: ArticleBlock[] }) {
  const elements: ReactNode[] = [];
  let index = 0;

  while (index < blocks.length) {
    const block = blocks[index];

    if (block.type === "bulleted_list_item") {
      const listItems: ArticleBlock[] = [];

      while (
        index < blocks.length &&
        blocks[index].type === "bulleted_list_item"
      ) {
        listItems.push(blocks[index]);
        index = index + 1;
      }

      elements.push(
        <ul key={listItems[0].id} className="my-4 space-y-2">
          {listItems.map((listItem) => (
            <ArticleBlockView key={listItem.id} block={listItem} />
          ))}
        </ul>,
      );
      continue;
    }

    if (block.type === "numbered_list_item") {
      const listItems: ArticleBlock[] = [];

      while (
        index < blocks.length &&
        blocks[index].type === "numbered_list_item"
      ) {
        listItems.push(blocks[index]);
        index = index + 1;
      }

      elements.push(
        <ol key={listItems[0].id} className="my-4 list-decimal space-y-2">
          {listItems.map((listItem) => (
            <ArticleBlockView key={listItem.id} block={listItem} />
          ))}
        </ol>,
      );
      continue;
    }

    elements.push(<ArticleBlockView key={block.id} block={block} />);
    index = index + 1;
  }

  return <>{elements}</>;
}

/**
 * Props for the article body renderer.
 */
type ArticleBodyProps = {
  blocks: ArticleBlock[];
};

/**
 * Renders a published article's Notion page body as HTML.
 * Supports common blocks only (paragraphs, headings, lists, quote, code, image).
 */
export default function ArticleBody({ blocks }: ArticleBodyProps) {
  if (blocks.length === 0) {
    return (
      <p className="mt-8 text-neutral-600">
        This article has no body content in Notion yet.
      </p>
    );
  }

  return (
    <div className="article-body mt-10 space-y-4">
      <ArticleBlocks blocks={blocks} />
    </div>
  );
}
