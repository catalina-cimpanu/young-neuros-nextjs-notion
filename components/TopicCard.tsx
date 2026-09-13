import Link from "next/link";

/**
 * Props for one topic card.
 * Kept as separate fields (not a whole Topic object) so the UI stays easy to read.
 */
type TopicCardProps = {
  name: string;
  shortDescription: string;
  residencyRelevance: string;
  lastReviewed: string | null;
  // Path to the topic detail page, e.g. /pathologies/stroke
  href: string;
};

/**
 * Renders one pathology or neuroskill as a list item with a link to its detail page.
 * Used on /pathologies and /neuroskills.
 */
export default function TopicCard({
  name,
  shortDescription,
  residencyRelevance,
  lastReviewed,
  href,
}: TopicCardProps) {
  return (
    <li className="border-b border-neutral-200 pb-4">
      <h2 className="text-xl font-semibold">
        <Link
          href={href}
          className="text-blue-700 underline hover:no-underline"
        >
          {name}
        </Link>
      </h2>

      {shortDescription ? (
        <p className="mt-2 text-neutral-700">{shortDescription}</p>
      ) : null}

      {residencyRelevance ? (
        <p className="mt-2 text-sm text-neutral-500">
          Residency relevance: {residencyRelevance}
        </p>
      ) : null}

      {lastReviewed ? (
        <p className="mt-1 text-sm text-neutral-500">
          Last reviewed: {lastReviewed}
        </p>
      ) : null}
    </li>
  );
}
