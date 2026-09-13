"use server";

import { createSubmission } from "@/lib/submissions";
import type { CreateSubmissionResult, SubmissionType } from "@/lib/submissions";

/**
 * Server Action for the public /submit forms.
 * Reads FormData, ignores honeypot spam, and writes to Neuro Submissions.
 */
export async function submitToNotion(
  _previousState: CreateSubmissionResult | null,
  formData: FormData,
): Promise<CreateSubmissionResult> {
  // Honeypot: real users leave this empty; bots often fill it.
  const honeypot = String(formData.get("company_website") || "");
  if (honeypot.trim() !== "") {
    // Pretend success so bots do not keep retrying.
    return { ok: true };
  }

  const submissionTypeRaw = String(formData.get("submissionType") || "");
  const submissionType = submissionTypeRaw as SubmissionType;

  return createSubmission({
    name: String(formData.get("name") || ""),
    submissionType,
    url: String(formData.get("url") || ""),
    suggestedTopic: String(formData.get("suggestedTopic") || ""),
    suggestedResourceType: String(formData.get("suggestedResourceType") || ""),
    eventDate: String(formData.get("eventDate") || ""),
    location: String(formData.get("location") || ""),
    organizer: String(formData.get("organizer") || ""),
    language: String(formData.get("language") || ""),
    shortDescription: String(formData.get("shortDescription") || ""),
    whyUseful: String(formData.get("whyUseful") || ""),
    submitterName: String(formData.get("submitterName") || ""),
    submitterEmail: String(formData.get("submitterEmail") || ""),
    submitterNotes: String(formData.get("submitterNotes") || ""),
  });
}
