# Community link archive

This app is a mobile-first archive for a small KakaoTalk group. Anyone can read
saved links, and people who know the shared write password can create, edit, and
delete entries.

The MVP uses Next.js App Router on Vercel and Supabase Postgres for storage. It
focuses on a date-based journal view with a small recent-links feed, search,
source-type filtering, and URL metadata fetching with manual fallback.

## Features

The current product includes the core archive workflow for a 12-person chat
room.

- Public read access without login.
- Shared-password validation for create, update, and delete requests.
- Date navigation for daily link journals.
- Recent links on the first screen.
- Search by title, URL, note, site name, description, or nickname.
- Source-type filtering for `youtube`, `shorts`, `community`, and `other`.
- URL metadata fetching for title, description, thumbnail, and site name.
- Manual title entry when metadata fetching fails.
- Public MapleStory character registration by character name.
- MapleStory character cards with level, class, stat, and equipment views.

## Tech stack

The app keeps privileged database access on the server and uses the browser only
for public reads and form interactions.

- Next.js App Router
- React
- TypeScript
- Supabase Postgres
- `@supabase/supabase-js`
- Zod
- Cheerio
- Vitest
- Testing Library
- Playwright
- NEXON Open API

## Environment variables

Create `.env.local` from `.env.example` before running the app locally. Configure
the same variables in Vercel before deploying.

```bash
cp .env.example .env.local
```

Set these values:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase public anon or publishable key.
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase server-only service role or secret key.
- `ARCHIVE_WRITE_PASSWORD`: Shared password required for write actions.
- `NEXON_OPEN_API_KEY`: Server-only NEXON Open API key for MapleStory data.

> **Warning:** Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser. Keep it
> only in local server environment files and Vercel environment variables.

`NEXON_OPEN_API_KEY` is also server-only. Maple character registration and detail
lookups return a server configuration error locally until `.env.local` contains a
valid NEXON Open API key.

## Database setup

Run the SQL migration in Supabase before using the app against a real database.
The migration creates the `archive_items` table, indexes, and soft-delete
columns.

```text
supabase/migrations/20260701000000_create_archive_items.sql
supabase/migrations/20260702000000_create_maple_characters.sql
```

You can apply it through the Supabase SQL editor or a Supabase CLI workflow.

## Local development

Install dependencies and run the development server from the repository root.

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000` in a browser. The KakaoTalk webview target is a
mobile viewport, so test at about 390 px wide when checking layout.

## Verification

Run the checks before deploying or changing archive behavior.

```bash
pnpm lint
pnpm test
pnpm exec tsc --noEmit
pnpm build
pnpm test:e2e
```

The Playwright tests mock API responses, so they don't require Supabase
credentials.

## Deployment

Deploy the repository to Vercel after Supabase and environment variables are
ready.

1. Create or select a Supabase project.
2. Run the migration in `supabase/migrations`.
3. Create a Vercel project from this repository.
4. Add all variables from `.env.example` to Vercel.
5. Deploy the project.
6. Open the Vercel URL on mobile and register a test link with the shared
   password.

## Project structure

The repository is organized by product boundary.

- `src/app`: Next.js pages, layout, styles, and API route handlers.
- `src/components`: Archive UI components.
- `src/lib`: Supabase, metadata, validation, password, and date helpers.
- `src/hooks`: React Query hooks for archive and Maple client workflows.
- `src/types`: Shared archive and Maple types.
- `supabase/migrations`: Database schema migration.
- `tests`: API, component, utility, and end-to-end tests.
- `docs/superpowers`: Product design and implementation plan.

## Next steps

After deployment, add real sample links from the KakaoTalk group and adjust the
shared password rotation process if the group needs tighter write control.
