/**
 * Props for one guideline list item.
 * Kept as separate fields so the UI stays easy to read.
 */
type GuidelineCardProps = {
  name: string;
  url: string;
  organization: string;
  region: string;
  language: string;
  year: number | null;
  guidelineType: string;
  summary: string;
  lastReviewed: string | null;
};

/**
 * Renders one published guideline as a list item.
 * The name links to the external URL (no on-site detail page).
 * Used on /guidelines and on topic detail pages.
 */
export default function GuidelineCard({
  name,
  url,
  organization,
  region,
  language,
  year,
  guidelineType,
  summary,
  lastReviewed,
}: GuidelineCardProps) {
  return (
    <li className="border-b border-neutral-200 pb-4">
      {/* External link opens in a new tab so the user does not leave our site by accident. */}
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xl font-semibold text-blue-700 underline hover:no-underline"
        >
          {name}
        </a>
      ) : (
        <h2 className="text-xl font-semibold">{name}</h2>
      )}

      {organization ? (
        <p className="mt-2 text-sm text-neutral-500">
          Organization: {organization}
        </p>
      ) : null}

      {year !== null ? (
        <p className="mt-1 text-sm text-neutral-500">Year: {year}</p>
      ) : null}

      {region ? (
        <p className="mt-1 text-sm text-neutral-500">Region: {region}</p>
      ) : null}

      {language ? (
        <p className="mt-1 text-sm text-neutral-500">Language: {language}</p>
      ) : null}

      {guidelineType ? (
        <p className="mt-1 text-sm text-neutral-500">Type: {guidelineType}</p>
      ) : null}

      {summary ? <p className="mt-2 text-neutral-700">{summary}</p> : null}

      {lastReviewed ? (
        <p className="mt-2 text-sm text-neutral-500">
          Last reviewed: {lastReviewed}
        </p>
      ) : null}
    </li>
  );
}
