# Young Neuros

Young Neuros is a simple public website for neurology residents and early-career neurologists.

Content is managed in Notion. The website only shows items where **Status = Published**.

## Tech stack

- **Next.js** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Notion** as the CMS (via `@notionhq/client`)
- **Vercel** for deployment (planned)

## How to run locally

1. Install dependencies:

```bash
npm install
```

2. Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

3. Start the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Create a `.env.local` file with:

```plain text
NOTION_TOKEN=
NOTION_TOPICS_DATABASE_ID=
NOTION_RESOURCES_DATABASE_ID=
NOTION_GUIDELINES_DATABASE_ID=
NOTION_EVENTS_DATABASE_ID=
NOTION_ARTICLES_DATABASE_ID=
```

Important:

- `.env.local` holds real secrets. Do **not** commit it.
- `.env.example` has empty placeholders and is safe to commit.

You also need to share each Notion database with your Notion integration.

## Notion CMS

Notion is the content source. For the MVP we use these databases:

| Database | Used for |
| --- | --- |
| Neuro Topics | `/pathologies` and `/neuroskills` |
| Neuro Resources | `/resources` |
| Neuro Guidelines | `/guidelines` |
| Neuro Events | `/calendar` |
| Neuro Articles | `/articles` |

Rules:

- Only items with `Status = Published` appear on the site.
- Drafts, inbox items, and internal review fields stay private.
- Resources and guidelines link out to external URLs (no detail pages).
- Topics are filtered by `Topic type`: `Pathology` or `Neuroskill`.

Fetch code lives in simple files under `lib/`:

- `lib/notion.ts` — shared Notion client
- `lib/topics.ts`
- `lib/resources.ts`
- `lib/guidelines.ts`
- `lib/events.ts`
- `lib/articles.ts`

## Current routes

| Route | What it shows |
| --- | --- |
| `/` | Homepage intro, section links, and a few featured/recent items |
| `/pathologies` | Published topics where Topic type = Pathology |
| `/neuroskills` | Published topics where Topic type = Neuroskill |
| `/resources` | Published resources (external links) |
| `/guidelines` | Published guidelines (external links) |
| `/calendar` | Published events in chronological order |
| `/articles` | Published articles listing |

## Intentionally not built yet

These are out of scope for the current MVP:

- Article detail pages (`/articles/[slug]`)
- Resource or guideline detail pages
- Full Notion page body rendering for articles
- Authentication
- Search and complex filtering
- A calendar UI library
- Extra databases (Learning Objectives, Submissions, News)

## Project structure (simplified)

```plain text
app/                 # Pages and layout
components/          # Small UI pieces (SiteHeader, TopicCard)
lib/                 # Notion client and data-fetching helpers
.env.example         # Safe placeholder env vars
.env.local           # Your real secrets (gitignored)
```

## Suggested workflow

```plain text
small code change → test locally → commit → next step
```
