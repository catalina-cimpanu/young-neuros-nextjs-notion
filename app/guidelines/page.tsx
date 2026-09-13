import GuidelineCard from "@/components/GuidelineCard";
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
            <GuidelineCard
              key={guideline.id}
              name={guideline.name}
              url={guideline.url}
              organization={guideline.organization}
              region={guideline.region}
              language={guideline.language}
              year={guideline.year}
              guidelineType={guideline.guidelineType}
              summary={guideline.summary}
              lastReviewed={guideline.lastReviewed}
            />
          ))}
        </ul>
      )}
    </main>
  );
}
