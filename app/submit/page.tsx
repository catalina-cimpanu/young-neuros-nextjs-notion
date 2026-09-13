import SubmitForms from "@/components/SubmitForms";

/**
 * Public submission page.
 * Forms write into Neuro Submissions (Review status = New) for human review.
 */
export default function SubmitPage() {
  return (
    <main className="homepage">
      <h1>Submit</h1>
      <p className="homepage-subtitle">
        Suggest an event, resource, guideline, or link for Young Neuros.
        Everything is reviewed before it appears on the site.
      </p>

      <SubmitForms />
    </main>
  );
}
