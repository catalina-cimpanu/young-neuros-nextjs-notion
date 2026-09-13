/**
 * Props for one resource list item.
 * Kept as separate fields so the UI stays easy to read.
 */
type ResourceCardProps = {
  name: string;
  url: string;
  resourceType: string;
  audience: string;
  language: string;
  sourceQuality: string;
  description: string;
  whyUseful: string;
  lastChecked: string | null;
};

/**
 * Renders one published resource as a list item.
 * The name links to the external URL (no on-site detail page).
 * Used on /resources and on topic detail pages (non-Link resources).
 */
export default function ResourceCard({
  name,
  url,
  resourceType,
  audience,
  language,
  sourceQuality,
  description,
  whyUseful,
  lastChecked,
}: ResourceCardProps) {
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

      {resourceType ? (
        <p className="mt-2 text-sm text-neutral-500">Type: {resourceType}</p>
      ) : null}

      {audience ? (
        <p className="mt-1 text-sm text-neutral-500">Audience: {audience}</p>
      ) : null}

      {language ? (
        <p className="mt-1 text-sm text-neutral-500">Language: {language}</p>
      ) : null}

      {sourceQuality ? (
        <p className="mt-1 text-sm text-neutral-500">
          Source quality: {sourceQuality}
        </p>
      ) : null}

      {description ? (
        <p className="mt-2 text-neutral-700">{description}</p>
      ) : null}

      {whyUseful ? (
        <p className="mt-2 text-neutral-700">Why useful: {whyUseful}</p>
      ) : null}

      {lastChecked ? (
        <p className="mt-2 text-sm text-neutral-500">
          Last checked: {lastChecked}
        </p>
      ) : null}
    </li>
  );
}
