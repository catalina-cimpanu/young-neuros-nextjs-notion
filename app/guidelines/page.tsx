import { getPublishedGuidelines } from "@/lib/guidelines";

// Re-fetch Notion data at most once per hour (3600 seconds).
export const revalidate = 3600;

/**
 * Renders published Neuro Guidelines from Notion.
 * Each guideline links out to its external URL (no detail page).
 */
export default async function GuidelinesPage() {
  const guidelines = await getPublishedGuidelines();

  return (
    <main className="homepage">
      <h1>Guidelines</h1>
      <p className="homepage-subtitle">
        Links to clinical guidelines relevant to neurology practice.
      </p>

      {guidelines.length === 0 ? (
        <p className="mt-8 text-neutral-600">
          No published guidelines yet. Add one in Notion with Status =
          Published.
        </p>
      ) : (
        <ul className="mt-8 list-none space-y-6 p-0">
          {guidelines.map((guideline) => (
            <li key={guideline.id} className="border-b border-neutral-200 pb-4">
              {guideline.url ? (
                <a
                  href={guideline.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl font-semibold text-blue-700 underline hover:no-underline"
                >
                  {guideline.name}
                </a>
              ) : (
                <h2 className="text-xl font-semibold">{guideline.name}</h2>
              )}

              {guideline.organization ? (
                <p className="mt-2 text-sm text-neutral-500">
                  Organization: {guideline.organization}
                </p>
              ) : null}

              {guideline.year !== null ? (
                <p className="mt-1 text-sm text-neutral-500">
                  Year: {guideline.year}
                </p>
              ) : null}

              {guideline.language ? (
                <p className="mt-1 text-sm text-neutral-500">
                  Language: {guideline.language}
                </p>
              ) : null}

              {guideline.guidelineType ? (
                <p className="mt-1 text-sm text-neutral-500">
                  Type: {guideline.guidelineType}
                </p>
              ) : null}

              {guideline.region ? (
                <p className="mt-1 text-sm text-neutral-500">
                  Region: {guideline.region}
                </p>
              ) : null}

              {guideline.summary ? (
                <p className="mt-2 text-neutral-700">{guideline.summary}</p>
              ) : null}

              {guideline.lastReviewed ? (
                <p className="mt-2 text-sm text-neutral-500">
                  Last reviewed: {guideline.lastReviewed}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
