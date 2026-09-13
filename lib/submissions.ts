import { isFullDatabase } from "@notionhq/client";
import { notion } from "./notion";

/**
 * Allowed public submission types (matches Notion Submission type options).
 */
export type SubmissionType = "Event" | "Resource" | "Guideline" | "Link";

/**
 * True when this submission type needs a URL.
 */
function submissionTypeRequiresUrl(submissionType: SubmissionType): boolean {
  return (
    submissionType === "Resource" ||
    submissionType === "Guideline" ||
    submissionType === "Link"
  );
}

/**
 * Input for creating one Neuro Submissions row from the public form.
 * Only fields we collect on the website — review fields stay internal.
 */
export type CreateSubmissionInput = {
  name: string;
  submissionType: SubmissionType;
  url: string;
  suggestedTopic: string;
  suggestedResourceType: string;
  eventDate: string;
  location: string;
  organizer: string;
  language: string;
  shortDescription: string;
  whyUseful: string;
  submitterName: string;
  submitterEmail: string;
  submitterNotes: string;
};

/**
 * Result returned to the form UI after trying to create a submission.
 */
export type CreateSubmissionResult =
  | { ok: true }
  | { ok: false; errorMessage: string };

/**
 * Reads the Neuro Submissions database ID from environment variables.
 */
function getSubmissionsDatabaseId(): string {
  const databaseId = process.env.NOTION_SUBMISSIONS_DATABASE_ID;

  if (!databaseId) {
    throw new Error(
      "Missing NOTION_SUBMISSIONS_DATABASE_ID. Add it to your .env.local file.",
    );
  }

  return databaseId;
}

/**
 * Resolves the data source id for Neuro Submissions (Notion API v5).
 * Used when creating pages under the data source parent.
 */
async function getSubmissionsDataSourceId(): Promise<string> {
  const databaseId = getSubmissionsDatabaseId();
  const database = await notion.databases.retrieve({ database_id: databaseId });

  if (!isFullDatabase(database)) {
    throw new Error(
      "Could not load the full Neuro Submissions database from Notion.",
    );
  }

  if (database.data_sources.length === 0) {
    throw new Error("The Neuro Submissions database has no data sources.");
  }

  return database.data_sources[0].id;
}

/**
 * Builds a rich_text property value from a plain string.
 * Empty strings become an empty rich_text array.
 */
function richTextProperty(value: string) {
  if (value.trim() === "") {
    return { rich_text: [] as Array<{ text: { content: string } }> };
  }

  return {
    rich_text: [
      {
        text: {
          content: value,
        },
      },
    ],
  };
}

/**
 * Very basic email shape check (not a full RFC validator).
 */
function looksLikeEmail(email: string): boolean {
  if (email.trim() === "") {
    return true;
  }

  return email.includes("@") && email.includes(".");
}

/**
 * Validates and creates one Neuro Submissions page with Review status = New.
 * This is write-only — submissions are never listed on the public site.
 */
export async function createSubmission(
  input: CreateSubmissionInput,
): Promise<CreateSubmissionResult> {
  const name = input.name.trim();
  const submissionType = input.submissionType;
  const url = input.url.trim();
  const eventDate = input.eventDate.trim();
  const submitterEmail = input.submitterEmail.trim();

  if (name === "") {
    return { ok: false, errorMessage: "Please enter a name." };
  }

  if (
    submissionType !== "Event" &&
    submissionType !== "Resource" &&
    submissionType !== "Guideline" &&
    submissionType !== "Link"
  ) {
    return {
      ok: false,
      errorMessage: "Please choose Event, Resource, Guideline, or Link.",
    };
  }

  if (submissionTypeRequiresUrl(submissionType) && url === "") {
    return {
      ok: false,
      errorMessage: `Please enter a URL for a ${submissionType.toLowerCase()} submission.`,
    };
  }

  if (submissionType === "Event" && eventDate === "") {
    return {
      ok: false,
      errorMessage: "Please enter a date for an event submission.",
    };
  }

  if (url !== "" && !url.startsWith("http://") && !url.startsWith("https://")) {
    return {
      ok: false,
      errorMessage: "URL should start with http:// or https://.",
    };
  }

  if (!looksLikeEmail(submitterEmail)) {
    return {
      ok: false,
      errorMessage: "Please enter a valid email address, or leave it blank.",
    };
  }

  try {
    const dataSourceId = await getSubmissionsDataSourceId();

    // Build properties carefully — only set optional fields when they have values.
    const properties: Record<string, unknown> = {
      Name: {
        title: [
          {
            text: {
              content: name,
            },
          },
        ],
      },
      "Submission type": {
        select: {
          name: submissionType,
        },
      },
      "Review status": {
        status: {
          name: "New",
        },
      },
      "Suggested topic": richTextProperty(input.suggestedTopic),
      Location: richTextProperty(input.location),
      Organizer: richTextProperty(input.organizer),
      "Short description": richTextProperty(input.shortDescription),
      "Why useful": richTextProperty(input.whyUseful),
      "Submitter name": richTextProperty(input.submitterName),
      "Submitter notes": richTextProperty(input.submitterNotes),
    };

    if (url !== "") {
      properties.URL = {
        url: url,
      };
    }

    if (input.language.trim() !== "") {
      properties.Language = {
        select: {
          name: input.language.trim(),
        },
      };
    }

    if (
      submissionType === "Resource" &&
      input.suggestedResourceType.trim() !== ""
    ) {
      properties["Suggested resource type"] = {
        select: {
          name: input.suggestedResourceType.trim(),
        },
      };
    }

    // Link submissions map to Suggested resource type = Link when not set.
    if (submissionType === "Link") {
      properties["Suggested resource type"] = {
        select: {
          name: "Link",
        },
      };
    }

    if (submissionType === "Event" && eventDate !== "") {
      properties["Event date"] = {
        date: {
          start: eventDate,
        },
      };
    }

    if (submitterEmail !== "") {
      properties["Submitter email"] = {
        email: submitterEmail,
      };
    }

    await notion.pages.create({
      parent: {
        data_source_id: dataSourceId,
      },
      // Cast: Notion's property map is a large union; we build it field-by-field above.
      properties: properties as Parameters<
        typeof notion.pages.create
      >[0]["properties"],
    });

    return { ok: true };
  } catch (error) {
    console.error("Failed to create Neuro Submission:", error);

    // Notion returns 403 when the integration can read the DB but cannot insert rows.
    const errorCode =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as { code: unknown }).code === "string"
        ? (error as { code: string }).code
        : "";

    if (errorCode === "restricted_resource") {
      return {
        ok: false,
        errorMessage:
          "The Notion integration cannot create submissions yet. In Notion → Settings → Connections (or My integrations), open your integration and enable Insert content. Also confirm Neuro Submissions is shared with that integration.",
      };
    }

    return {
      ok: false,
      errorMessage:
        "Something went wrong while sending your submission. Please try again later.",
    };
  }
}
