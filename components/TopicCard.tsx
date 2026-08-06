/**
 * Props for one topic card.
 * Kept as separate fields (not a whole Topic object) so the UI stays easy to read.
 */
type TopicCardProps = {
  name: string;
  shortDescription: string;
  residencyRelevance: string;
  lastReviewed: string | null;
};

/**
 * Renders one pathology or neuroskill as a list item.
 * Used on /pathologies and /neuroskills.
 */
export default function TopicCard({
  name,
  shortDescription,
  residencyRelevance,
  lastReviewed,
}: TopicCardProps) {
  return (
    <li className="border-b border-neutral-200 pb-4">
      <h2 className="text-xl font-semibold">{name}</h2>

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
