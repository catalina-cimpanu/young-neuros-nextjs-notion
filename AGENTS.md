<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Custom Project Rules for Young Neuros

## Project context

I am building **Young Neuros**, a simple public website for neurology residents and early-career neurologists.

The website will use:

- **Next.js App Router**
- **TypeScript**
- **Tailwind CSS**
- **Notion databases as CMS**
- **Vercel** for deployment

The Notion CMS already exists and contains these databases:

- Neuro Topics
- Neuro Resources
- Neuro Guidelines
- Neuro Learning Objectives
- Neuro Events
- Neuro Articles
- Neuro Submissions
- Neuro News

For the MVP, we will start with:

- Neuro Topics
- Neuro Resources
- Neuro Guidelines
- Neuro Events
- Neuro Articles

The MVP website routes are:

```plain text
/
/pathologies
/neuroskills
/resources
/guidelines
/calendar
/articles
```

Resources and guidelines should **not** have their own public detail pages in Next.js for now. They should appear as cards/lists that link to external URLs.

Articles are part of the MVP, but start with a simple `/articles` listing page. Do **not** create `/articles/[slug]` until I explicitly ask.

---

## Very important working style

I want to understand the code.

Please do **not** generate a large app all at once.

Please follow these rules:

1. Make changes in small steps.
2. Only edit the files I explicitly ask you to edit.
3. Do not create many files at once.
4. Keep the structure flat and beginner-friendly.
5. Prefer explicit code over clever abstractions.
6. Do not create generic systems before they are needed.
7. Do not install packages unless I explicitly approve.
8. Use server components by default.
9. Fetch Notion data in simple files inside `lib/`.
10. Keep components small and easy to read.
11. After every change, explain what changed and why.
12. If you think a new file or abstraction is needed, ask first.
13. Do not add authentication, Supabase, Prisma, MDX, search, preview mode, or complex filtering unless I ask.
14. Do not create dynamic routes unless I ask.
15. Do not create resource detail pages, guideline detail pages, or article detail pages for the MVP.
16. Remind me to commit after every meaningful step.

---

## Git workflow — important from the beginning

Use Git from the start because I want to be able to safely undo changes.

After every meaningful step, remind me to commit.

The working rhythm should be:

```plain text
small code change
↓
explain what changed
↓
test locally
↓
commit
↓
next step
```

Suggested basic commands:

```bash
git status
git add .
git commit -m "Short description"
```

Do **not** make several major changes before suggesting a commit.

Suggested commits during the project:

```bash
git add .
git commit -m "Create clean homepage"
git commit -m "Add main navigation"
git commit -m "Add placeholder routes"
git commit -m "Connect Notion client"
git commit -m "Render published topics"
git commit -m "Render resources from Notion"
git commit -m "Render guidelines from Notion"
git commit -m "Render events calendar list"
git commit -m "Render articles from Notion"
```

If I have not initialized Git yet, remind me to do:

```bash
git init
git add .
git commit -m "Initial Next.js project"
```

---

## Before each code change

Before editing, tell me:

1. Which files you will change.
2. Why those files need to change.
3. What the expected result is.

Then wait for my confirmation if the change affects more than two files.

---

## After each code change

After editing, explain:

1. What changed.
2. Why it changed.
3. How I can test it.
4. What I should understand before moving on.
5. Whether I should commit.

---

## First success milestone

The first success milestone is:

```plain text
I can add a published topic/resource/guideline/event/article in Notion,
refresh the website,
and see it appear on the correct page.
```

Do not optimize or beautify too early. First make the data pipeline work.

---

## Desired file structure

Please keep the initial structure close to this:

```plain text
young-neuros/
├── app/
│   ├── page.tsx
│   ├── pathologies/
│   │   └── page.tsx
│   ├── neuroskills/
│   │   └── page.tsx
│   ├── resources/
│   │   └── page.tsx
│   ├── guidelines/
│   │   └── page.tsx
│   ├── calendar/
│   │   └── page.tsx
│   ├── articles/
│   │   └── page.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── SiteHeader.tsx
│   ├── TopicCard.tsx
│   ├── ResourceCard.tsx
│   ├── GuidelineCard.tsx
│   ├── EventCard.tsx
│   └── ArticleCard.tsx
├── lib/
│   ├── notion.ts
│   ├── topics.ts
│   ├── resources.ts
│   ├── guidelines.ts
│   ├── events.ts
│   └── articles.ts
├── .env.local
├── .env.example
├── package.json
└── README.md
```

Do not create extra folders like `features/`, `services/`, `repositories/`, `hooks/`, `types/`, `utils/`, or `config/` unless I specifically ask.

---

## Environment variables

The project will use these environment variables:

```plain text
NOTION_TOKEN=
NOTION_TOPICS_DATABASE_ID=
NOTION_RESOURCES_DATABASE_ID=
NOTION_GUIDELINES_DATABASE_ID=
NOTION_EVENTS_DATABASE_ID=
NOTION_ARTICLES_DATABASE_ID=
```

Important:

- `.env.local` contains real secrets and must not be committed.
- `.env.example` should contain empty placeholder values and is safe to commit.

---

## CMS publishing rule

The public website should only show Notion items where:

```plain text
Status = Published
```

Drafts, inbox items, rejected items, private notes, internal review fields, and submitter information should never be shown publicly.

---

## Notion CMS databases

MVP databases:
- Neuro Topics
- Neuro Resources
- Neuro Guidelines
- Neuro Events
- Neuro Articles

Core rule:
- Query only `Status = Published` for public pages.

Main routes:
- `/pathologies` uses Neuro Topics where `Topic type = Pathology`
- `/neuroskills` uses Neuro Topics where `Topic type = Neuroskill`
- `/resources` uses Neuro Resources
- `/guidelines` uses Neuro Guidelines
- `/calendar` uses Neuro Events
- `/articles` uses Neuro Articles

## Data model summary

The full schema lives in the Notion CMS Contract. This is the coding summary only.

### MVP databases

- Neuro Topics
- Neuro Resources
- Neuro Guidelines
- Neuro Events
- Neuro Articles

### Routes

- `/pathologies` uses Neuro Topics where `Topic type = Pathology`
- `/neuroskills` uses Neuro Topics where `Topic type = Neuroskill`
- `/resources` uses Neuro Resources
- `/guidelines` uses Neuro Guidelines
- `/calendar` uses Neuro Events
- `/articles` uses Neuro Articles

### Global publishing rule

Only show items where:

`Status = Published`

Do not show internal fields publicly.

### Neuro Topics

Used for pathologies and neuroskills.

Key properties:
- Name
- Slug
- Topic type
- Short description
- Residency relevance
- Status
- Order
- Featured
- Last reviewed

### Neuro Resources

Used for `/resources`.

Key properties:
- Name
- URL
- Resource type
- Topics
- Audience
- Language
- Source quality
- Description
- Why useful
- Status
- Featured
- Last checked

MVP behavior:
- Show as cards/list items.
- Link directly to external `URL`.
- Do not create resource detail pages.

### Neuro Guidelines

Used for `/guidelines`.

Key properties:
- Name
- URL
- Topics
- Organization
- Region
- Language
- Year
- Guideline type
- Summary
- Status
- Last reviewed

MVP behavior:
- Show as cards/list items.
- Link directly to external `URL`.
- Do not create guideline detail pages.

### Neuro Events

Used for `/calendar`.

Key properties:
- Name
- URL
- Date
- Location
- Online or in-person
- Event type
- Topics
- Organizer
- Language
- Description
- Status
- Featured
- Last checked

MVP behavior:
- Show as a simple chronological list.
- Do not install a calendar library yet.

### Neuro Articles

Used for `/articles`.

Key properties:
- Title
- Slug
- Article type
- Topics
- Excerpt
- SEO description
- Author
- Published date
- Status
- Last reviewed

MVP behavior:
- Show as cards/list items on `/articles`.
- Do not create `/articles/[slug]` yet.
- Do not render full Notion page content yet.