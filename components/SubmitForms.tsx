"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { submitToNotion } from "@/app/submit/actions";
import type {
  CreateSubmissionResult,
  SubmissionType,
} from "@/lib/submissions";

const languageOptions = ["English", "German", "French", "Other"];

const resourceTypeOptions = [
  "Website",
  "App",
  "Course",
  "Event",
  "Article",
  "Link",
  "Other",
];

/**
 * One tab on the submit page.
 */
type SubmitTab = {
  submissionType: SubmissionType;
  label: string;
  title: string;
  description: string;
};

const submitTabs: SubmitTab[] = [
  {
    submissionType: "Event",
    label: "Event",
    title: "Submit an event",
    description:
      "Suggest a conference, course, webinar, exam, or deadline for the calendar.",
  },
  {
    submissionType: "Resource",
    label: "Resource",
    title: "Submit a resource",
    description:
      "Suggest a website, tool, course, or other learning resource.",
  },
  {
    submissionType: "Guideline",
    label: "Guideline",
    title: "Submit a guideline",
    description: "Suggest a clinical guideline or official recommendation.",
  },
  {
    submissionType: "Link",
    label: "Link",
    title: "Submit a link",
    description: "Suggest a useful link to show on a topic page.",
  },
];

/**
 * Shared field styles so all forms stay readable and consistent.
 */
const labelClassName = "flex flex-col gap-1 text-sm text-neutral-700";
const inputClassName =
  "border border-neutral-300 bg-white px-2 py-1.5 text-neutral-900";

/**
 * True when this form type requires a URL field.
 */
function needsUrl(submissionType: SubmissionType): boolean {
  return (
    submissionType === "Resource" ||
    submissionType === "Guideline" ||
    submissionType === "Link"
  );
}

/**
 * Renders one submission form with success/error feedback.
 */
function SubmissionForm({
  submissionType,
  title,
  description,
}: {
  submissionType: SubmissionType;
  title: string;
  description: string;
}) {
  const [state, formAction, isPending] = useActionState<
    CreateSubmissionResult | null,
    FormData
  >(submitToNotion, null);

  if (state?.ok) {
    return (
      <div className="rounded border border-neutral-200 p-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-neutral-700">
          Thanks — your submission was received. We will review it before
          anything appears on the public site.
        </p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-4 rounded border border-t-0 border-neutral-200 p-4"
    >
      <p className="text-sm text-neutral-600">{description}</p>

      <input type="hidden" name="submissionType" value={submissionType} />

      {/* Honeypot field: hidden from people, visible to many bots */}
      <div className="hidden" aria-hidden="true">
        <label>
          Company website
          <input
            type="text"
            name="company_website"
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>

      <label className={labelClassName}>
        Name *
        <input
          className={inputClassName}
          type="text"
          name="name"
          required
          maxLength={200}
        />
      </label>

      {needsUrl(submissionType) ? (
        <label className={labelClassName}>
          URL *
          <input
            className={inputClassName}
            type="url"
            name="url"
            required
            placeholder="https://"
          />
        </label>
      ) : (
        <label className={labelClassName}>
          URL (optional)
          <input
            className={inputClassName}
            type="url"
            name="url"
            placeholder="https://"
          />
        </label>
      )}

      {submissionType === "Event" ? (
        <>
          <label className={labelClassName}>
            Event date *
            <input
              className={inputClassName}
              type="date"
              name="eventDate"
              required
            />
          </label>
          <label className={labelClassName}>
            Location
            <input className={inputClassName} type="text" name="location" />
          </label>
          <label className={labelClassName}>
            Organizer
            <input className={inputClassName} type="text" name="organizer" />
          </label>
        </>
      ) : null}

      {submissionType === "Resource" ? (
        <label className={labelClassName}>
          Suggested resource type
          <select
            className={inputClassName}
            name="suggestedResourceType"
            defaultValue=""
          >
            <option value="">Choose one (optional)</option>
            {resourceTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className={labelClassName}>
        Suggested topic
        <input
          className={inputClassName}
          type="text"
          name="suggestedTopic"
          placeholder="e.g. Stroke, EEG"
        />
      </label>

      <label className={labelClassName}>
        Language
        <select className={inputClassName} name="language" defaultValue="">
          <option value="">Choose one (optional)</option>
          {languageOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClassName}>
        Short description
        <textarea
          className={inputClassName}
          name="shortDescription"
          rows={3}
          maxLength={2000}
        />
      </label>

      <label className={labelClassName}>
        Why useful
        <textarea
          className={inputClassName}
          name="whyUseful"
          rows={3}
          maxLength={2000}
        />
      </label>

      <label className={labelClassName}>
        Your name (optional)
        <input className={inputClassName} type="text" name="submitterName" />
      </label>

      <label className={labelClassName}>
        Your email (optional)
        <input className={inputClassName} type="email" name="submitterEmail" />
      </label>

      <label className={labelClassName}>
        Notes for reviewers (optional)
        <textarea
          className={inputClassName}
          name="submitterNotes"
          rows={2}
          maxLength={2000}
        />
      </label>

      {state && !state.ok ? (
        <p className="text-sm text-red-700">{state.errorMessage}</p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="border border-neutral-400 bg-neutral-100 px-4 py-2 text-sm text-neutral-900 disabled:opacity-60"
      >
        {isPending ? "Sending…" : "Submit for review"}
      </button>
    </form>
  );
}

/**
 * Client UI for /submit with tabs for Event, Resource, Guideline, and Link.
 */
export default function SubmitForms() {
  const [activeTab, setActiveTab] = useState<SubmissionType>("Event");

  const selectedTab = submitTabs.find((tab) => {
    return tab.submissionType === activeTab;
  });

  // selectedTab is always found because activeTab comes from submitTabs.
  if (!selectedTab) {
    return null;
  }

  return (
    <div className="mt-8">
      <div
        role="tablist"
        aria-label="Submission type"
        className="flex flex-wrap gap-2 border-b border-neutral-200"
      >
        {submitTabs.map((tab) => {
          const isActive = tab.submissionType === activeTab;

          return (
            <button
              key={tab.submissionType}
              type="button"
              role="tab"
              aria-selected={isActive}
              id={`tab-${tab.submissionType}`}
              className={
                isActive
                  ? "border border-b-0 border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-900"
                  : "border border-transparent px-3 py-2 text-sm text-blue-700 underline hover:no-underline"
              }
              onClick={() => {
                setActiveTab(tab.submissionType);
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        aria-labelledby={`tab-${selectedTab.submissionType}`}
      >
        {/* key remounts the form when switching tabs so success state resets */}
        <SubmissionForm
          key={selectedTab.submissionType}
          submissionType={selectedTab.submissionType}
          title={selectedTab.title}
          description={selectedTab.description}
        />
      </div>

      <p className="mt-8 text-sm text-neutral-600">
        By submitting, you agree we may store the details you send for review.
        See our{" "}
        <Link
          href="/pages/privacy"
          className="text-blue-700 underline hover:no-underline"
        >
          Privacy
        </Link>{" "}
        page.
      </p>
    </div>
  );
}
