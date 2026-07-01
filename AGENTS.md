# Repository instructions

This repository contains a small mobile-first community link archive for a
12-person KakaoTalk group. Future agents must keep the product simple, practical,
and optimized for repeated use inside a mobile webview.

## Project direction

The MVP is a public-read, password-protected-write link archive. The product is
not a social network, a full bulletin board, or a private account system.

Keep these decisions stable unless the user explicitly changes them:

- Use Vercel for deployment.
- Use Next.js App Router for the web application.
- Use Supabase Postgres for persistence.
- Let anyone read archived links.
- Require a shared write password for create, update, and delete actions.
- Let authors type a nickname when submitting a link.
- Use a date-based journal view as the primary interface.
- Show a small recent-links section on the home screen.
- Focus the MVP on links only.
- Exclude comments, emoji reactions, voting, and account login from the MVP.

## Product behavior

The main user path is reading and submitting links from a mobile device. Most
users will access the app through KakaoTalk's in-app browser.

Build around these flows:

- Browse links by date.
- Move to the previous day, today, or the next day.
- Search by title, note, URL, or site name.
- Filter by source type.
- Submit a URL with a nickname, optional note, and shared password.
- Fetch link metadata on the server.
- Let the user enter a title manually when metadata fetching fails.
- Edit or soft-delete an item after password verification.

Use these source types unless the design changes:

- `youtube`
- `shorts`
- `community`
- `other`

## Security model

The app uses a deliberately small security model for a small friend group.
Don't add user accounts unless the user asks for them.

Follow these rules:

- Store the shared write password in `ARCHIVE_WRITE_PASSWORD`.
- Verify write actions on the server.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.
- Never expose service role credentials to the client.
- Treat reads as public.
- Use soft delete through `deleted_at` instead of hard delete for MVP data.

## Data model

Start with one primary table named `archive_items`. Keep the model easy to
query by date and search text.

Expected fields:

- `id`
- `url`
- `title`
- `description`
- `image_url`
- `site_name`
- `source_type`
- `note`
- `author_name`
- `entry_date`
- `created_at`
- `updated_at`
- `deleted_at`

Read queries must exclude rows where `deleted_at` is not `NULL`.

## API boundaries

Keep write behavior behind server routes or server actions. Client-side code can
read public data, but it must not perform privileged writes directly.

Initial API shape:

- `GET /api/items`
- `POST /api/items/metadata`
- `POST /api/items`
- `PATCH /api/items/:id`
- `DELETE /api/items/:id`

The metadata endpoint must tolerate external site failures. A failed metadata
request must not block link submission when the user provides a manual title.

## UI guidance

Use a plain document-like style inspired by namu.wiki rather than a polished
marketing design. Prioritize clarity, small-screen readability, and predictable
controls.

Follow these UI rules:

- Design mobile first.
- Keep layouts usable in KakaoTalk's webview.
- Use a white background, subtle gray separators, and standard blue links.
- Avoid decorative hero sections and marketing copy.
- Keep forms short.
- Preserve form inputs when a request fails.
- Hide broken thumbnails instead of showing broken image icons.

## Documentation

Keep planning documents under `docs/superpowers/specs/`. The current MVP design
is documented in
`docs/superpowers/specs/2026-07-01-community-link-archive-design.md`.

When changing scope, update the design document or add a new dated design note.
Keep documentation concise and tied to actual product decisions.

## Verification

Before claiming implementation work is complete, verify the core flows:

- Mobile layout renders cleanly.
- Date navigation works.
- Search and source-type filtering work together.
- Metadata fetching succeeds for a normal YouTube URL.
- Manual title fallback works when metadata fetching fails.
- Writes fail with a missing or incorrect password.
- Writes succeed with the configured shared password.
- Vercel-required environment variables are documented.
