import { Suspense } from "react";
import GuidelinesList from "@/components/GuidelinesList";
import { getPublishedGuidelines } from "@/lib/guidelines";

// Re-fetch Notion data at most once per hour (3600 seconds).
export const revalidate = 3600;

/**
 * Renders published Neuro Guidelines from Notion.
 * Grouping and filters live in the client GuidelinesList component.
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
        // Suspense is required around useSearchParams() in the client list.
        <Suspense
          fallback={<p className="mt-8 text-neutral-600">Loading filters…</p>}
        >
          <GuidelinesList guidelines={guidelines} />
        </Suspense>
      )}
    </main>
  );
}
