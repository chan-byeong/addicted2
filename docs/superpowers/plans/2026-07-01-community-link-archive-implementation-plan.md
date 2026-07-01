# Community Link Archive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first KakaoTalk group link archive with public reads,
password-protected writes, date-based browsing, URL metadata previews, search,
and source-type filtering.

**Architecture:** Build a Next.js App Router application deployed on Vercel,
with Supabase Postgres as the persistence layer. Keep privileged writes inside
server route handlers, use a server-only Supabase client for mutations, and keep
the UI as a simple document-style single-page experience.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase Postgres,
`@supabase/supabase-js`, Zod, Cheerio, Vitest, Testing Library, Playwright,
Vercel.

---

## PRD overview

This PRD turns the approved design into a sequential implementation plan. A
developer can execute the tasks in order to ship the MVP without adding account
login, comments, reactions, direct uploads, or a separate admin dashboard.

### Product summary

The product is a lightweight archive for a 12-person KakaoTalk group. Anyone can
open the site and read links. People who know the shared write password can add,
edit, and soft-delete links. The first screen focuses on today's links, with
date navigation and a small recent-links section.

### Target users

The primary users are the group owner and group members who share links in a
KakaoTalk room. Most usage happens on mobile devices through KakaoTalk's in-app
browser.

### User goals

Users need to:

- Open the archive without signing in.
- See links saved for a selected date.
- Submit a link with a nickname, optional note, and shared password.
- Let the app fetch title, description, thumbnail, and site name from the URL.
- Enter a title manually when metadata fetching fails.
- Search past links by title, note, URL, or site name.
- Filter links by `youtube`, `shorts`, `community`, or `other`.
- Edit or delete links after shared password verification.

### Non-goals

The MVP does not include:

- Member accounts.
- Kakao login.
- Comments.
- Emoji reactions.
- Voting.
- File uploads.
- Image or video hosting.
- A separate admin dashboard.
- Schedule or incident archive item types.

### Success criteria

The MVP is complete when:

- The app runs locally with `pnpm dev`.
- The app builds with `pnpm build`.
- Unit and component tests pass with `pnpm test`.
- End-to-end tests pass with `pnpm test:e2e`.
- The mobile layout is usable at a 390 px wide viewport.
- A normal YouTube URL produces metadata.
- A blocked or invalid metadata URL falls back to manual title entry.
- Missing or incorrect passwords block create, update, and delete requests.
- Correct passwords permit create, update, and soft-delete requests.
- Vercel environment variables are documented in `.env.example` and README.

## File structure

Create the project with a `src` directory. Keep files small and grouped by
responsibility.

```text
.
├── .env.example
├── .gitignore
├── AGENTS.md
├── README.md
├── docs/
│   └── superpowers/
│       ├── plans/
│       │   └── 2026-07-01-community-link-archive-implementation-plan.md
│       └── specs/
│           └── 2026-07-01-community-link-archive-design.md
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── playwright.config.ts
├── public/
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── items/
│   │   │       ├── [id]/
│   │   │       │   └── route.ts
│   │   │       ├── metadata/
│   │   │       │   └── route.ts
│   │   │       └── route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── archive-app.tsx
│   │   ├── date-nav.tsx
│   │   ├── filter-bar.tsx
│   │   ├── item-form-dialog.tsx
│   │   ├── link-card.tsx
│   │   └── recent-links.tsx
│   ├── lib/
│   │   ├── api-client.ts
│   │   ├── archive-repository.ts
│   │   ├── date.ts
│   │   ├── env.ts
│   │   ├── metadata.ts
│   │   ├── password.ts
│   │   ├── source-type.ts
│   │   ├── supabase/
│   │   │   ├── browser.ts
│   │   │   └── server.ts
│   │   └── validation.ts
│   ├── test/
│   │   └── setup.ts
│   └── types/
│       └── archive.ts
├── supabase/
│   └── migrations/
│       └── 20260701000000_create_archive_items.sql
├── tests/
│   ├── api/
│   │   ├── items-route.test.ts
│   │   └── metadata-route.test.ts
│   ├── components/
│   │   └── archive-app.test.tsx
│   ├── e2e/
│   │   └── archive.spec.ts
│   └── lib/
│       ├── date.test.ts
│       ├── metadata.test.ts
│       ├── password.test.ts
│       ├── source-type.test.ts
│       └── validation.test.ts
├── tsconfig.json
└── vitest.config.ts
```

## Task sequence

Execute the tasks in order. Each task produces a working checkpoint and a small
commit. If the workspace is not a git repository, skip the commit step and note
that git initialization is still needed.

### Task 1: Scaffold the Next.js project

This task creates the runnable application shell, test commands, environment
template, and minimal page. The app has no product behavior yet.

**Files:**

- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `eslint.config.mjs`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Create: `.env.example`
- Create: `.gitignore`

- [ ] **Step 1: Initialize the app**

Run this command from `/Users/byeong/Desktop/dev/addicted2`:

```bash
pnpm create next-app@latest . --ts --eslint --app --src-dir --no-tailwind --import-alias "@/*"
```

Expected: the command creates a Next.js App Router app in the current directory.
When the command asks about Turbopack, choose the default option.

- [ ] **Step 2: Install runtime and test dependencies**

Run:

```bash
pnpm add @supabase/supabase-js cheerio zod
pnpm add -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event playwright
pnpm exec playwright install chromium
```

Expected: `package.json` contains the Supabase, metadata parsing, validation,
unit test, component test, and end-to-end test dependencies.

- [ ] **Step 3: Replace `package.json` scripts**

Modify the `scripts` object in `package.json` to match this content:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test"
}
```

Expected: local development, build, lint, unit test, and e2e commands are
available through `pnpm`.

- [ ] **Step 4: Configure Vitest**

Create `vitest.config.ts` with this content:

```ts
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Create `src/test/setup.ts` with this content:

```ts
import "@testing-library/jest-dom/vitest";
```

Expected: tests can import files with the `@/` alias and use Testing Library
matchers.

- [ ] **Step 5: Configure Playwright**

Create `playwright.config.ts` with this content:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
  },
  projects: [
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 5"],
      },
    },
  ],
});
```

Expected: e2e tests run against a mobile viewport that approximates KakaoTalk
webview usage.

- [ ] **Step 6: Create the environment template**

Create `.env.example` with this content:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-or-secret-key
ARCHIVE_WRITE_PASSWORD=change-this-password
```

Expected: required Vercel environment variables are documented without real
secrets.

- [ ] **Step 7: Create the initial layout and page**

Replace `src/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "단톡 링크 아카이브",
  description: "단톡방에서 공유한 링크를 날짜별로 모으는 작은 아카이브",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

Replace `src/app/page.tsx` with:

```tsx
export default function HomePage() {
  return (
    <main className="page-shell">
      <header className="site-header">
        <h1>단톡 링크 아카이브</h1>
        <p>오늘 본 재밌고 유익한 링크를 날짜별로 모읍니다.</p>
      </header>
    </main>
  );
}
```

Replace `src/app/globals.css` with:

```css
:root {
  color-scheme: light;
  --page-bg: #ffffff;
  --text: #202124;
  --muted: #6b7280;
  --border: #d5d7dc;
  --soft: #f6f7f9;
  --link: #1f5fbf;
  --danger: #b42318;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  min-height: 100%;
  background: var(--page-bg);
  color: var(--text);
  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

button,
input,
select,
textarea {
  font: inherit;
}

a {
  color: var(--link);
}

.page-shell {
  width: min(100%, 760px);
  margin: 0 auto;
  padding: 16px 12px 40px;
}

.site-header {
  border-bottom: 1px solid var(--border);
  padding-bottom: 12px;
}

.site-header h1 {
  margin: 0 0 6px;
  font-size: 24px;
  line-height: 1.25;
}

.site-header p {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.5;
}
```

Expected: the app renders a plain document-style first screen.

- [ ] **Step 8: Verify the scaffold**

Run:

```bash
pnpm lint
pnpm test --passWithNoTests
pnpm build
```

Expected: lint, an empty test run, and build complete successfully.

- [ ] **Step 9: Commit the scaffold**

Run:

```bash
git add .
git commit -m "chore: scaffold link archive app"
```

Expected: the project shell is committed. If the workspace is not a git
repository, run `git init` first or record that commits start after repository
initialization.

### Task 2: Add the database schema and shared types

This task defines the Supabase table and TypeScript domain types. Later tasks
depend on these names and field shapes.

**Files:**

- Create: `supabase/migrations/20260701000000_create_archive_items.sql`
- Create: `src/types/archive.ts`
- Create: `src/lib/env.ts`
- Modify: `.env.example`

- [ ] **Step 1: Create the Supabase migration**

Create `supabase/migrations/20260701000000_create_archive_items.sql` with:

```sql
create extension if not exists pg_trgm;

create table if not exists public.archive_items (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  title text not null,
  description text,
  image_url text,
  site_name text,
  source_type text not null check (
    source_type in ('youtube', 'shorts', 'community', 'other')
  ),
  note text,
  author_name text not null,
  entry_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists archive_items_entry_date_idx
  on public.archive_items (entry_date desc, created_at desc)
  where deleted_at is null;

create index if not exists archive_items_source_type_idx
  on public.archive_items (source_type)
  where deleted_at is null;

create index if not exists archive_items_search_idx
  on public.archive_items
  using gin (
    (
      coalesce(title, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(note, '') || ' ' ||
      coalesce(url, '') || ' ' ||
      coalesce(site_name, '')
    ) gin_trgm_ops
  )
  where deleted_at is null;

create or replace function public.set_archive_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists archive_items_updated_at on public.archive_items;

create trigger archive_items_updated_at
before update on public.archive_items
for each row
execute function public.set_archive_items_updated_at();
```

Expected: Supabase can create the table, indexes, and updated timestamp trigger.

- [ ] **Step 2: Define archive domain types**

Create `src/types/archive.ts` with:

```ts
export const SOURCE_TYPES = ["youtube", "shorts", "community", "other"] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];

export type ArchiveItem = {
  id: string;
  url: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  siteName: string | null;
  sourceType: SourceType;
  note: string | null;
  authorName: string;
  entryDate: string;
  createdAt: string;
  updatedAt: string;
};

export type ArchiveItemRow = {
  id: string;
  url: string;
  title: string;
  description: string | null;
  image_url: string | null;
  site_name: string | null;
  source_type: SourceType;
  note: string | null;
  author_name: string;
  entry_date: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type ArchiveItemInput = {
  url: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  siteName?: string | null;
  sourceType: SourceType;
  note?: string | null;
  authorName: string;
  entryDate: string;
};

export type ArchiveItemUpdateInput = Partial<ArchiveItemInput>;

export type ItemListParams = {
  date?: string;
  query?: string;
  sourceType?: SourceType | "all";
  limit?: number;
};
```

Expected: all later code imports `SourceType`, `ArchiveItem`, and input types
from this file.

- [ ] **Step 3: Define strict environment helpers**

Create `src/lib/env.ts` with:

```ts
function readRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getPublicEnv() {
  return {
    supabaseUrl: readRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnonKey: readRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}

export function getServerEnv() {
  return {
    ...getPublicEnv(),
    supabaseServiceRoleKey: readRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    archiveWritePassword: readRequiredEnv("ARCHIVE_WRITE_PASSWORD"),
  };
}
```

Expected: missing environment variables fail fast in server code.

- [ ] **Step 4: Verify TypeScript**

Run:

```bash
pnpm build
```

Expected: the build succeeds with no type errors.

- [ ] **Step 5: Commit the schema and types**

Run:

```bash
git add supabase src/types src/lib/env.ts .env.example
git commit -m "feat: define archive schema and types"
```

Expected: database schema and shared types are committed.

### Task 3: Add pure utilities with tests

This task adds deterministic helpers for dates, source-type detection, password
verification, and request validation. These helpers keep route handlers small.

**Files:**

- Create: `tests/lib/date.test.ts`
- Create: `tests/lib/source-type.test.ts`
- Create: `tests/lib/password.test.ts`
- Create: `tests/lib/validation.test.ts`
- Create: `src/lib/date.ts`
- Create: `src/lib/source-type.ts`
- Create: `src/lib/password.ts`
- Create: `src/lib/validation.ts`

- [ ] **Step 1: Write date tests**

Create `tests/lib/date.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import { addDays, formatDateKey, getTodayKey, isDateKey } from "@/lib/date";

describe("date helpers", () => {
  it("formats a date as a local YYYY-MM-DD key", () => {
    expect(formatDateKey(new Date("2026-07-01T12:00:00+09:00"))).toBe(
      "2026-07-01",
    );
  });

  it("adds days without changing the input string", () => {
    expect(addDays("2026-07-01", -1)).toBe("2026-06-30");
    expect(addDays("2026-07-01", 1)).toBe("2026-07-02");
  });

  it("validates date keys", () => {
    expect(isDateKey("2026-07-01")).toBe(true);
    expect(isDateKey("2026-7-1")).toBe(false);
    expect(isDateKey("not-a-date")).toBe(false);
  });

  it("returns a date key for today", () => {
    expect(getTodayKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
```

- [ ] **Step 2: Run date tests and verify failure**

Run:

```bash
pnpm test tests/lib/date.test.ts
```

Expected: FAIL because `src/lib/date.ts` does not exist yet.

- [ ] **Step 3: Implement date helpers**

Create `src/lib/date.ts` with:

```ts
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getTodayKey() {
  return formatDateKey(new Date());
}

export function isDateKey(value: string) {
  if (!DATE_KEY_PATTERN.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00`);
  return formatDateKey(date) === value;
}

export function addDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + days);

  return formatDateKey(date);
}
```

- [ ] **Step 4: Write source-type tests**

Create `tests/lib/source-type.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import { detectSourceType } from "@/lib/source-type";

describe("detectSourceType", () => {
  it("detects YouTube watch URLs", () => {
    expect(detectSourceType("https://www.youtube.com/watch?v=abc123")).toBe(
      "youtube",
    );
  });

  it("detects YouTube shorts URLs", () => {
    expect(detectSourceType("https://www.youtube.com/shorts/abc123")).toBe(
      "shorts",
    );
  });

  it("detects common Korean community URLs", () => {
    expect(detectSourceType("https://www.fmkorea.com/123")).toBe("community");
    expect(detectSourceType("https://theqoo.net/hot/123")).toBe("community");
  });

  it("uses other for unknown or invalid URLs", () => {
    expect(detectSourceType("https://example.com/post")).toBe("other");
    expect(detectSourceType("not a url")).toBe("other");
  });
});
```

- [ ] **Step 5: Implement source-type detection**

Create `src/lib/source-type.ts` with:

```ts
import type { SourceType } from "@/types/archive";

const COMMUNITY_HOSTS = [
  "fmkorea.com",
  "theqoo.net",
  "instiz.net",
  "clien.net",
  "ruliweb.com",
  "dcinside.com",
  "ppomppu.co.kr",
  "humoruniv.com",
];

function hostMatches(hostname: string, domain: string) {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

export function detectSourceType(rawUrl: string): SourceType {
  try {
    const url = new URL(rawUrl);
    const hostname = url.hostname.replace(/^www\./, "");

    if (hostMatches(hostname, "youtube.com")) {
      return url.pathname.startsWith("/shorts") ? "shorts" : "youtube";
    }

    if (hostMatches(hostname, "youtu.be")) {
      return "youtube";
    }

    if (COMMUNITY_HOSTS.some((domain) => hostMatches(hostname, domain))) {
      return "community";
    }

    return "other";
  } catch {
    return "other";
  }
}
```

- [ ] **Step 6: Write password tests**

Create `tests/lib/password.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import { verifyWritePassword } from "@/lib/password";

describe("verifyWritePassword", () => {
  it("accepts the exact shared password", () => {
    expect(verifyWritePassword("open-sesame", "open-sesame")).toBe(true);
  });

  it("rejects missing and incorrect passwords", () => {
    expect(verifyWritePassword("", "open-sesame")).toBe(false);
    expect(verifyWritePassword("wrong", "open-sesame")).toBe(false);
  });
});
```

- [ ] **Step 7: Implement password verification**

Create `src/lib/password.ts` with:

```ts
export function verifyWritePassword(input: string | undefined, expected: string) {
  if (!input || !expected) {
    return false;
  }

  return input === expected;
}
```

- [ ] **Step 8: Write validation tests**

Create `tests/lib/validation.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import {
  itemListParamsSchema,
  metadataRequestSchema,
  upsertItemSchema,
} from "@/lib/validation";

describe("validation schemas", () => {
  it("parses valid item input", () => {
    const result = upsertItemSchema.parse({
      url: "https://example.com/a",
      title: "Example title",
      sourceType: "other",
      authorName: "민수",
      entryDate: "2026-07-01",
      password: "secret",
    });

    expect(result.title).toBe("Example title");
  });

  it("rejects invalid URLs and dates", () => {
    expect(() =>
      upsertItemSchema.parse({
        url: "invalid",
        title: "Example title",
        sourceType: "other",
        authorName: "민수",
        entryDate: "2026-7-1",
        password: "secret",
      }),
    ).toThrow();
  });

  it("parses metadata requests", () => {
    expect(
      metadataRequestSchema.parse({ url: "https://example.com" }).url,
    ).toBe("https://example.com/");
  });

  it("normalizes list params", () => {
    expect(
      itemListParamsSchema.parse({
        date: "2026-07-01",
        sourceType: "all",
        limit: "5",
      }).limit,
    ).toBe(5);
  });
});
```

- [ ] **Step 9: Implement validation schemas**

Create `src/lib/validation.ts` with:

```ts
import { z } from "zod";
import { SOURCE_TYPES } from "@/types/archive";
import { isDateKey } from "@/lib/date";

const dateKeySchema = z.string().refine(isDateKey, "Invalid date");

const nullableTextSchema = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((value) => (value ? value : null));

export const metadataRequestSchema = z.object({
  url: z.string().trim().url().transform((value) => new URL(value).toString()),
});

export const upsertItemSchema = z.object({
  url: z.string().trim().url().transform((value) => new URL(value).toString()),
  title: z.string().trim().min(1).max(180),
  description: nullableTextSchema,
  imageUrl: z.string().trim().url().optional().nullable(),
  siteName: z.string().trim().max(120).optional().nullable(),
  sourceType: z.enum(SOURCE_TYPES),
  note: nullableTextSchema,
  authorName: z.string().trim().min(1).max(40),
  entryDate: dateKeySchema,
  password: z.string().min(1),
});

export const itemListParamsSchema = z.object({
  date: dateKeySchema.optional(),
  query: z.string().trim().max(120).optional(),
  sourceType: z.enum([...SOURCE_TYPES, "all"]).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});
```

- [ ] **Step 10: Run utility tests**

Run:

```bash
pnpm test tests/lib/date.test.ts tests/lib/source-type.test.ts tests/lib/password.test.ts tests/lib/validation.test.ts
```

Expected: all utility tests pass.

- [ ] **Step 11: Commit utilities**

Run:

```bash
git add src/lib/date.ts src/lib/source-type.ts src/lib/password.ts src/lib/validation.ts tests/lib
git commit -m "feat: add archive utility helpers"
```

Expected: utility helpers and tests are committed.

### Task 4: Add Supabase clients and archive repository

This task centralizes database access. Route handlers and pages will call the
repository instead of building Supabase queries inline.

**Files:**

- Create: `src/lib/supabase/browser.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/archive-repository.ts`
- Modify: `src/types/archive.ts`

- [ ] **Step 1: Create Supabase browser client**

Create `src/lib/supabase/browser.ts` with:

```ts
import { createClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/lib/env";

export function createBrowserSupabaseClient() {
  const env = getPublicEnv();

  return createClient(env.supabaseUrl, env.supabaseAnonKey);
}
```

Expected: public reads can use the anon or publishable key in browser-safe code.

- [ ] **Step 2: Create Supabase server client**

Create `src/lib/supabase/server.ts` with:

```ts
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";

export function createServerSupabaseClient() {
  const env = getServerEnv();

  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
```

Expected: server route handlers can perform privileged writes without exposing
the service role key to the client.

- [ ] **Step 3: Add row mapping helpers**

Create `src/lib/archive-repository.ts` with:

```ts
import type {
  ArchiveItem,
  ArchiveItemInput,
  ArchiveItemRow,
  ArchiveItemUpdateInput,
  ItemListParams,
} from "@/types/archive";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function mapArchiveItem(row: ArchiveItemRow): ArchiveItem {
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
    siteName: row.site_name,
    sourceType: row.source_type,
    note: row.note,
    authorName: row.author_name,
    entryDate: row.entry_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toInsertRow(input: ArchiveItemInput) {
  return {
    url: input.url,
    title: input.title,
    description: input.description ?? null,
    image_url: input.imageUrl ?? null,
    site_name: input.siteName ?? null,
    source_type: input.sourceType,
    note: input.note ?? null,
    author_name: input.authorName,
    entry_date: input.entryDate,
  };
}

function toUpdateRow(input: ArchiveItemUpdateInput) {
  return {
    ...(input.url === undefined ? {} : { url: input.url }),
    ...(input.title === undefined ? {} : { title: input.title }),
    ...(input.description === undefined
      ? {}
      : { description: input.description }),
    ...(input.imageUrl === undefined ? {} : { image_url: input.imageUrl }),
    ...(input.siteName === undefined ? {} : { site_name: input.siteName }),
    ...(input.sourceType === undefined ? {} : { source_type: input.sourceType }),
    ...(input.note === undefined ? {} : { note: input.note }),
    ...(input.authorName === undefined ? {} : { author_name: input.authorName }),
    ...(input.entryDate === undefined ? {} : { entry_date: input.entryDate }),
  };
}

export async function listArchiveItems(params: ItemListParams) {
  const supabase = createServerSupabaseClient();
  const limit = params.limit ?? 50;

  let query = supabase
    .from("archive_items")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (params.date) {
    query = query.eq("entry_date", params.date);
  }

  if (params.sourceType && params.sourceType !== "all") {
    query = query.eq("source_type", params.sourceType);
  }

  if (params.query) {
    const search = `%${params.query}%`;
    query = query.or(
      [
        `title.ilike.${search}`,
        `description.ilike.${search}`,
        `note.ilike.${search}`,
        `url.ilike.${search}`,
        `site_name.ilike.${search}`,
      ].join(","),
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data as ArchiveItemRow[]).map(mapArchiveItem);
}

export async function createArchiveItem(input: ArchiveItemInput) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("archive_items")
    .insert(toInsertRow(input))
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapArchiveItem(data as ArchiveItemRow);
}

export async function updateArchiveItem(id: string, input: ArchiveItemUpdateInput) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("archive_items")
    .update(toUpdateRow(input))
    .eq("id", id)
    .is("deleted_at", null)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapArchiveItem(data as ArchiveItemRow);
}

export async function softDeleteArchiveItem(id: string) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("archive_items")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    throw new Error(error.message);
  }
}
```

Expected: all database operations live in one file with a clear mapping between
database rows and UI-facing domain objects.

- [ ] **Step 4: Run TypeScript verification**

Run:

```bash
pnpm build
```

Expected: build succeeds. If Supabase generic types are added later, keep the
public function signatures from this task unchanged.

- [ ] **Step 5: Commit repository code**

Run:

```bash
git add src/lib/supabase src/lib/archive-repository.ts src/types/archive.ts
git commit -m "feat: add supabase archive repository"
```

Expected: Supabase access code is committed.

### Task 5: Add metadata fetching with fallback behavior

This task fetches URL metadata on the server and classifies the link. It must
fail gracefully so users can enter a title manually.

**Files:**

- Create: `tests/lib/metadata.test.ts`
- Create: `src/lib/metadata.ts`

- [ ] **Step 1: Write metadata tests**

Create `tests/lib/metadata.test.ts` with:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchLinkMetadata } from "@/lib/metadata";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchLinkMetadata", () => {
  it("extracts Open Graph metadata", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          `
            <html>
              <head>
                <meta property="og:title" content="OG title" />
                <meta property="og:description" content="OG description" />
                <meta property="og:image" content="/image.jpg" />
                <meta property="og:site_name" content="Example" />
              </head>
            </html>
          `,
          {
            status: 200,
            headers: { "content-type": "text/html; charset=utf-8" },
          },
        ),
      ),
    );

    const metadata = await fetchLinkMetadata("https://example.com/post");

    expect(metadata).toEqual({
      ok: true,
      url: "https://example.com/post",
      title: "OG title",
      description: "OG description",
      imageUrl: "https://example.com/image.jpg",
      siteName: "Example",
      sourceType: "other",
    });
  });

  it("returns a recoverable failure for bad responses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 403 })));

    const metadata = await fetchLinkMetadata("https://example.com/post");

    expect(metadata.ok).toBe(false);
  });

  it("classifies YouTube shorts URLs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response("<title>Short title</title>", {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
      ),
    );

    const metadata = await fetchLinkMetadata(
      "https://www.youtube.com/shorts/abc123",
    );

    expect(metadata.ok).toBe(true);
    expect(metadata.sourceType).toBe("shorts");
  });
});
```

- [ ] **Step 2: Run metadata tests and verify failure**

Run:

```bash
pnpm test tests/lib/metadata.test.ts
```

Expected: FAIL because `src/lib/metadata.ts` does not exist yet.

- [ ] **Step 3: Implement metadata fetching**

Create `src/lib/metadata.ts` with:

```ts
import * as cheerio from "cheerio";
import type { SourceType } from "@/types/archive";
import { detectSourceType } from "@/lib/source-type";

export type LinkMetadataResult =
  | {
      ok: true;
      url: string;
      title: string;
      description: string | null;
      imageUrl: string | null;
      siteName: string | null;
      sourceType: SourceType;
    }
  | {
      ok: false;
      url: string;
      sourceType: SourceType;
      message: string;
    };

function firstContent($: cheerio.CheerioAPI, selectors: string[]) {
  for (const selector of selectors) {
    const value = $(selector).first().attr("content") || $(selector).first().text();

    if (value?.trim()) {
      return value.trim();
    }
  }

  return null;
}

function absolutizeUrl(value: string | null, baseUrl: string) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return null;
  }
}

export async function fetchLinkMetadata(rawUrl: string): Promise<LinkMetadataResult> {
  const url = new URL(rawUrl).toString();
  const sourceType = detectSourceType(url);

  try {
    const response = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; CommunityLinkArchive/1.0; +https://example.com)",
        accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(7000),
    });

    if (!response.ok) {
      return {
        ok: false,
        url,
        sourceType,
        message: `Metadata request failed with ${response.status}`,
      };
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return {
        ok: false,
        url,
        sourceType,
        message: "Metadata response was not HTML",
      };
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const title =
      firstContent($, [
        'meta[property="og:title"]',
        'meta[name="twitter:title"]',
        "title",
      ]) || new URL(url).hostname;

    return {
      ok: true,
      url,
      title,
      description: firstContent($, [
        'meta[property="og:description"]',
        'meta[name="description"]',
        'meta[name="twitter:description"]',
      ]),
      imageUrl: absolutizeUrl(
        firstContent($, [
          'meta[property="og:image"]',
          'meta[name="twitter:image"]',
        ]),
        url,
      ),
      siteName: firstContent($, ['meta[property="og:site_name"]']) || new URL(url).hostname,
      sourceType,
    };
  } catch (error) {
    return {
      ok: false,
      url,
      sourceType,
      message: error instanceof Error ? error.message : "Metadata request failed",
    };
  }
}
```

- [ ] **Step 4: Run metadata tests**

Run:

```bash
pnpm test tests/lib/metadata.test.ts
```

Expected: all metadata tests pass.

- [ ] **Step 5: Commit metadata code**

Run:

```bash
git add src/lib/metadata.ts tests/lib/metadata.test.ts
git commit -m "feat: add link metadata fetching"
```

Expected: metadata fetching and fallback behavior are committed.

### Task 6: Add route handlers for read and write APIs

This task exposes the approved API shape. Route handlers validate input, check
passwords for mutations, and call repository functions.

**Files:**

- Create: `src/app/api/items/route.ts`
- Create: `src/app/api/items/[id]/route.ts`
- Create: `src/app/api/items/metadata/route.ts`
- Create: `tests/api/items-route.test.ts`
- Create: `tests/api/metadata-route.test.ts`

- [ ] **Step 1: Write metadata route tests**

Create `tests/api/metadata-route.test.ts` with:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/metadata", () => ({
  fetchLinkMetadata: vi.fn(),
}));

describe("POST /api/items/metadata", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns metadata for a valid URL", async () => {
    const { fetchLinkMetadata } = await import("@/lib/metadata");
    vi.mocked(fetchLinkMetadata).mockResolvedValue({
      ok: true,
      url: "https://example.com/",
      title: "Example",
      description: null,
      imageUrl: null,
      siteName: "example.com",
      sourceType: "other",
    });

    const { POST } = await import("@/app/api/items/metadata/route");
    const response = await POST(
      new Request("http://localhost/api/items/metadata", {
        method: "POST",
        body: JSON.stringify({ url: "https://example.com" }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ title: "Example" });
  });

  it("rejects invalid input", async () => {
    const { POST } = await import("@/app/api/items/metadata/route");
    const response = await POST(
      new Request("http://localhost/api/items/metadata", {
        method: "POST",
        body: JSON.stringify({ url: "bad-url" }),
      }),
    );

    expect(response.status).toBe(400);
  });
});
```

- [ ] **Step 2: Implement metadata route**

Create `src/app/api/items/metadata/route.ts` with:

```ts
import { NextResponse } from "next/server";
import { fetchLinkMetadata } from "@/lib/metadata";
import { metadataRequestSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = metadataRequestSchema.parse(body);
    const metadata = await fetchLinkMetadata(input.url);

    return NextResponse.json(metadata);
  } catch {
    return NextResponse.json(
      { message: "URL 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }
}
```

- [ ] **Step 3: Write item route tests**

Create `tests/api/items-route.test.ts` with:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/archive-repository", () => ({
  createArchiveItem: vi.fn(),
  listArchiveItems: vi.fn(),
  softDeleteArchiveItem: vi.fn(),
  updateArchiveItem: vi.fn(),
}));

const exampleItem = {
  id: "00000000-0000-0000-0000-000000000001",
  url: "https://example.com/",
  title: "Example",
  description: null,
  imageUrl: null,
  siteName: "example.com",
  sourceType: "other",
  note: null,
  authorName: "민수",
  entryDate: "2026-07-01",
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
} as const;

describe("items routes", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service";
    process.env.ARCHIVE_WRITE_PASSWORD = "secret";
  });

  it("lists items with query params", async () => {
    const repo = await import("@/lib/archive-repository");
    vi.mocked(repo.listArchiveItems).mockResolvedValue([exampleItem]);

    const { GET } = await import("@/app/api/items/route");
    const response = await GET(
      new Request(
        "http://localhost/api/items?date=2026-07-01&sourceType=all&limit=10",
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ items: [exampleItem] });
  });

  it("creates an item when the password is correct", async () => {
    const repo = await import("@/lib/archive-repository");
    vi.mocked(repo.createArchiveItem).mockResolvedValue(exampleItem);

    const { POST } = await import("@/app/api/items/route");
    const response = await POST(
      new Request("http://localhost/api/items", {
        method: "POST",
        body: JSON.stringify({
          url: "https://example.com",
          title: "Example",
          sourceType: "other",
          authorName: "민수",
          entryDate: "2026-07-01",
          password: "secret",
        }),
      }),
    );

    expect(response.status).toBe(201);
  });

  it("rejects create requests with a wrong password", async () => {
    const { POST } = await import("@/app/api/items/route");
    const response = await POST(
      new Request("http://localhost/api/items", {
        method: "POST",
        body: JSON.stringify({
          url: "https://example.com",
          title: "Example",
          sourceType: "other",
          authorName: "민수",
          entryDate: "2026-07-01",
          password: "wrong",
        }),
      }),
    );

    expect(response.status).toBe(401);
  });

  it("updates an item with the shared password", async () => {
    const repo = await import("@/lib/archive-repository");
    vi.mocked(repo.updateArchiveItem).mockResolvedValue(exampleItem);

    const { PATCH } = await import("@/app/api/items/[id]/route");
    const response = await PATCH(
      new Request("http://localhost/api/items/1", {
        method: "PATCH",
        body: JSON.stringify({
          url: "https://example.com",
          title: "Example",
          sourceType: "other",
          authorName: "민수",
          entryDate: "2026-07-01",
          password: "secret",
        }),
      }),
      { params: Promise.resolve({ id: "1" }) },
    );

    expect(response.status).toBe(200);
  });

  it("soft deletes an item with the shared password", async () => {
    const repo = await import("@/lib/archive-repository");
    vi.mocked(repo.softDeleteArchiveItem).mockResolvedValue(undefined);

    const { DELETE } = await import("@/app/api/items/[id]/route");
    const response = await DELETE(
      new Request("http://localhost/api/items/1", {
        method: "DELETE",
        body: JSON.stringify({ password: "secret" }),
      }),
      { params: Promise.resolve({ id: "1" }) },
    );

    expect(response.status).toBe(204);
  });
});
```

- [ ] **Step 4: Implement collection route**

Create `src/app/api/items/route.ts` with:

```ts
import { NextResponse } from "next/server";
import { createArchiveItem, listArchiveItems } from "@/lib/archive-repository";
import { getServerEnv } from "@/lib/env";
import { verifyWritePassword } from "@/lib/password";
import { itemListParamsSchema, upsertItemSchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const params = itemListParamsSchema.parse({
      date: url.searchParams.get("date") || undefined,
      query: url.searchParams.get("query") || undefined,
      sourceType: url.searchParams.get("sourceType") || undefined,
      limit: url.searchParams.get("limit") || undefined,
    });
    const items = await listArchiveItems(params);

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json(
      { message: "목록을 불러오지 못했습니다." },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = upsertItemSchema.parse(body);
    const env = getServerEnv();

    if (!verifyWritePassword(input.password, env.archiveWritePassword)) {
      return NextResponse.json(
        { message: "비밀번호가 올바르지 않습니다." },
        { status: 401 },
      );
    }

    const item = await createArchiveItem({
      url: input.url,
      title: input.title,
      description: input.description,
      imageUrl: input.imageUrl,
      siteName: input.siteName,
      sourceType: input.sourceType,
      note: input.note,
      authorName: input.authorName,
      entryDate: input.entryDate,
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "링크를 저장하지 못했습니다." },
      { status: 400 },
    );
  }
}
```

- [ ] **Step 5: Implement item route**

Create `src/app/api/items/[id]/route.ts` with:

```ts
import { NextResponse } from "next/server";
import {
  softDeleteArchiveItem,
  updateArchiveItem,
} from "@/lib/archive-repository";
import { getServerEnv } from "@/lib/env";
import { verifyWritePassword } from "@/lib/password";
import { upsertItemSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const input = upsertItemSchema.parse(body);
    const env = getServerEnv();

    if (!verifyWritePassword(input.password, env.archiveWritePassword)) {
      return NextResponse.json(
        { message: "비밀번호가 올바르지 않습니다." },
        { status: 401 },
      );
    }

    const item = await updateArchiveItem(id, {
      url: input.url,
      title: input.title,
      description: input.description,
      imageUrl: input.imageUrl,
      siteName: input.siteName,
      sourceType: input.sourceType,
      note: input.note,
      authorName: input.authorName,
      entryDate: input.entryDate,
    });

    return NextResponse.json({ item });
  } catch {
    return NextResponse.json(
      { message: "링크를 수정하지 못했습니다." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const env = getServerEnv();

    if (!verifyWritePassword(body?.password, env.archiveWritePassword)) {
      return NextResponse.json(
        { message: "비밀번호가 올바르지 않습니다." },
        { status: 401 },
      );
    }

    await softDeleteArchiveItem(id);

    return new Response(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { message: "링크를 삭제하지 못했습니다." },
      { status: 400 },
    );
  }
}
```

- [ ] **Step 6: Run API tests**

Run:

```bash
pnpm test tests/api/metadata-route.test.ts tests/api/items-route.test.ts
```

Expected: all route tests pass.

- [ ] **Step 7: Commit API routes**

Run:

```bash
git add src/app/api tests/api
git commit -m "feat: add archive api routes"
```

Expected: public read and password-protected write APIs are committed.

### Task 7: Add UI components for browsing links

This task creates the read-only browsing UI: date navigation, filters, link
cards, and recent links. Mutation forms are added in the next task.

**Files:**

- Create: `src/lib/api-client.ts`
- Create: `src/components/date-nav.tsx`
- Create: `src/components/filter-bar.tsx`
- Create: `src/components/link-card.tsx`
- Create: `src/components/recent-links.tsx`
- Create: `src/components/archive-app.tsx`
- Modify: `src/app/page.tsx`
- Create: `tests/components/archive-app.test.tsx`

- [ ] **Step 1: Create API client helpers**

Create `src/lib/api-client.ts` with:

```ts
import type {
  ArchiveItem,
  ArchiveItemInput,
  ItemListParams,
} from "@/types/archive";

function buildQuery(params: ItemListParams) {
  const searchParams = new URLSearchParams();

  if (params.date) searchParams.set("date", params.date);
  if (params.query) searchParams.set("query", params.query);
  if (params.sourceType) searchParams.set("sourceType", params.sourceType);
  if (params.limit) searchParams.set("limit", String(params.limit));

  return searchParams.toString();
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "요청을 처리하지 못했습니다.");
  }

  return data as T;
}

export async function fetchItems(params: ItemListParams) {
  const query = buildQuery(params);
  const response = await fetch(`/api/items${query ? `?${query}` : ""}`, {
    cache: "no-store",
  });
  const data = await parseJsonResponse<{ items: ArchiveItem[] }>(response);

  return data.items;
}

export async function fetchMetadata(url: string) {
  return parseJsonResponse<{
    ok: boolean;
    url: string;
    title?: string;
    description?: string | null;
    imageUrl?: string | null;
    siteName?: string | null;
    sourceType: ArchiveItem["sourceType"];
    message?: string;
  }>(
    await fetch("/api/items/metadata", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url }),
    }),
  );
}

export async function createItem(input: ArchiveItemInput & { password: string }) {
  const data = await parseJsonResponse<{ item: ArchiveItem }>(
    await fetch("/api/items", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    }),
  );

  return data.item;
}

export async function updateItem(
  id: string,
  input: ArchiveItemInput & { password: string },
) {
  const data = await parseJsonResponse<{ item: ArchiveItem }>(
    await fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    }),
  );

  return data.item;
}

export async function deleteItem(id: string, password: string) {
  const response = await fetch(`/api/items/${id}`, {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "링크를 삭제하지 못했습니다.");
  }
}
```

- [ ] **Step 2: Create date navigation**

Create `src/components/date-nav.tsx` with:

```tsx
import { addDays, getTodayKey } from "@/lib/date";

type DateNavProps = {
  date: string;
  onDateChange: (date: string) => void;
};

export function DateNav({ date, onDateChange }: DateNavProps) {
  return (
    <nav className="date-nav" aria-label="날짜 이동">
      <button type="button" onClick={() => onDateChange(addDays(date, -1))}>
        이전
      </button>
      <button type="button" onClick={() => onDateChange(getTodayKey())}>
        오늘
      </button>
      <button type="button" onClick={() => onDateChange(addDays(date, 1))}>
        다음
      </button>
      <strong>{date}</strong>
    </nav>
  );
}
```

- [ ] **Step 3: Create filter controls**

Create `src/components/filter-bar.tsx` with:

```tsx
import { SOURCE_TYPES, type SourceType } from "@/types/archive";

type FilterBarProps = {
  query: string;
  sourceType: SourceType | "all";
  onQueryChange: (query: string) => void;
  onSourceTypeChange: (sourceType: SourceType | "all") => void;
};

const LABELS: Record<SourceType | "all", string> = {
  all: "전체",
  youtube: "유튜브",
  shorts: "쇼츠",
  community: "커뮤니티",
  other: "기타",
};

export function FilterBar({
  query,
  sourceType,
  onQueryChange,
  onSourceTypeChange,
}: FilterBarProps) {
  return (
    <section className="filter-bar" aria-label="링크 필터">
      <input
        aria-label="검색어"
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />
      <select
        aria-label="타입 필터"
        value={sourceType}
        onChange={(event) =>
          onSourceTypeChange(event.target.value as SourceType | "all")
        }
      >
        {(["all", ...SOURCE_TYPES] as const).map((type) => (
          <option key={type} value={type}>
            {LABELS[type]}
          </option>
        ))}
      </select>
    </section>
  );
}
```

- [ ] **Step 4: Create link card and recent links**

Create `src/components/link-card.tsx` with:

```tsx
import type { ArchiveItem } from "@/types/archive";

type LinkCardProps = {
  item: ArchiveItem;
  onEdit?: (item: ArchiveItem) => void;
  onDelete?: (item: ArchiveItem) => void;
};

export function LinkCard({ item, onEdit, onDelete }: LinkCardProps) {
  const createdAt = new Date(item.createdAt).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article className="link-card">
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imageUrl} alt="" className="link-card__thumb" />
      ) : null}
      <div className="link-card__body">
        <a href={item.url} target="_blank" rel="noreferrer" className="link-title">
          {item.title}
        </a>
        <div className="link-meta">
          <span>{item.siteName || new URL(item.url).hostname}</span>
          <span>{item.sourceType}</span>
          <span>{item.authorName}</span>
          <span>{createdAt}</span>
        </div>
        {item.description ? <p>{item.description}</p> : null}
        {item.note ? <p className="link-note">{item.note}</p> : null}
        <div className="link-actions">
          {onEdit ? (
            <button type="button" onClick={() => onEdit(item)}>
              수정
            </button>
          ) : null}
          {onDelete ? (
            <button type="button" className="danger" onClick={() => onDelete(item)}>
              삭제
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
```

Create `src/components/recent-links.tsx` with:

```tsx
import type { ArchiveItem } from "@/types/archive";
import { LinkCard } from "@/components/link-card";

type RecentLinksProps = {
  items: ArchiveItem[];
};

export function RecentLinks({ items }: RecentLinksProps) {
  return (
    <section className="section-block" aria-labelledby="recent-links-title">
      <h2 id="recent-links-title">최근 링크</h2>
      <div className="link-list compact">
        {items.length ? (
          items.map((item) => <LinkCard key={item.id} item={item} />)
        ) : (
          <p className="empty-state">최근 등록된 링크가 없습니다.</p>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Create the archive app shell**

Create `src/components/archive-app.tsx` with:

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchItems } from "@/lib/api-client";
import { getTodayKey } from "@/lib/date";
import type { ArchiveItem, SourceType } from "@/types/archive";
import { DateNav } from "@/components/date-nav";
import { FilterBar } from "@/components/filter-bar";
import { LinkCard } from "@/components/link-card";
import { RecentLinks } from "@/components/recent-links";

export function ArchiveApp() {
  const [date, setDate] = useState(getTodayKey());
  const [query, setQuery] = useState("");
  const [sourceType, setSourceType] = useState<SourceType | "all">("all");
  const [items, setItems] = useState<ArchiveItem[]>([]);
  const [recentItems, setRecentItems] = useState<ArchiveItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const listParams = useMemo(
    () => ({ date, query, sourceType, limit: 50 }),
    [date, query, sourceType],
  );

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    setMessage(null);

    Promise.all([
      fetchItems(listParams),
      fetchItems({ sourceType: "all", limit: 5 }),
    ])
      .then(([nextItems, nextRecentItems]) => {
        if (!isActive) return;
        setItems(nextItems);
        setRecentItems(nextRecentItems);
      })
      .catch((error) => {
        if (!isActive) return;
        setMessage(error instanceof Error ? error.message : "목록을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [listParams]);

  return (
    <main className="page-shell">
      <header className="site-header">
        <div>
          <h1>단톡 링크 아카이브</h1>
          <p>오늘 본 재밌고 유익한 링크를 날짜별로 모읍니다.</p>
        </div>
        <button type="button" className="primary-button">
          등록
        </button>
      </header>

      {message ? <p className="status-message error">{message}</p> : null}

      <DateNav date={date} onDateChange={setDate} />
      <FilterBar
        query={query}
        sourceType={sourceType}
        onQueryChange={setQuery}
        onSourceTypeChange={setSourceType}
      />

      <section className="section-block" aria-labelledby="daily-links-title">
        <h2 id="daily-links-title">{date} 링크</h2>
        {isLoading ? <p className="empty-state">불러오는 중입니다.</p> : null}
        {!isLoading && items.length === 0 ? (
          <p className="empty-state">이 날짜에 등록된 링크가 없습니다.</p>
        ) : null}
        <div className="link-list">
          {items.map((item) => (
            <LinkCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <RecentLinks items={recentItems} />
    </main>
  );
}
```

- [ ] **Step 6: Render the archive app**

Replace `src/app/page.tsx` with:

```tsx
import { ArchiveApp } from "@/components/archive-app";

export default function HomePage() {
  return <ArchiveApp />;
}
```

- [ ] **Step 7: Add component tests**

Create `tests/components/archive-app.test.tsx` with:

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ArchiveApp } from "@/components/archive-app";

const item = {
  id: "1",
  url: "https://example.com",
  title: "Example title",
  description: "Example description",
  imageUrl: null,
  siteName: "Example",
  sourceType: "other",
  note: "좋았음",
  authorName: "민수",
  entryDate: "2026-07-01",
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
} as const;

describe("ArchiveApp", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("/api/items")) {
          return Response.json({ items: [item] });
        }

        return Response.json({}, { status: 404 });
      }),
    );
  });

  it("renders archive links and filters", async () => {
    render(<ArchiveApp />);

    expect(screen.getByRole("heading", { name: "단톡 링크 아카이브" })).toBeInTheDocument();
    expect(screen.getByLabelText("검색어")).toBeInTheDocument();
    expect(screen.getByLabelText("타입 필터")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText("Example title").length).toBeGreaterThan(0);
    });
  });
});
```

- [ ] **Step 8: Run component tests**

Run:

```bash
pnpm test tests/components/archive-app.test.tsx
```

Expected: the archive shell renders fetched items and filter controls.

- [ ] **Step 9: Commit browsing UI**

Run:

```bash
git add src/components src/lib/api-client.ts src/app/page.tsx tests/components
git commit -m "feat: add archive browsing ui"
```

Expected: read-only browsing UI is committed.

### Task 8: Add create, edit, and delete form flows

This task adds the write workflows. The same shared password gates create, edit,
and delete requests.

**Files:**

- Create: `src/components/item-form-dialog.tsx`
- Modify: `src/components/archive-app.tsx`
- Modify: `src/components/link-card.tsx`
- Modify: `tests/components/archive-app.test.tsx`

- [ ] **Step 1: Create the form dialog component**

Create `src/components/item-form-dialog.tsx` with:

```tsx
"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { createItem, fetchMetadata, updateItem } from "@/lib/api-client";
import { getTodayKey } from "@/lib/date";
import { detectSourceType } from "@/lib/source-type";
import type { ArchiveItem, SourceType } from "@/types/archive";

type ItemFormDialogProps = {
  mode: "create" | "edit";
  item?: ArchiveItem | null;
  date: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
};

type FormState = {
  url: string;
  title: string;
  description: string;
  imageUrl: string;
  siteName: string;
  sourceType: SourceType;
  note: string;
  authorName: string;
  entryDate: string;
  password: string;
};

const EMPTY_FORM: FormState = {
  url: "",
  title: "",
  description: "",
  imageUrl: "",
  siteName: "",
  sourceType: "other" as SourceType,
  note: "",
  authorName: "",
  entryDate: getTodayKey(),
  password: "",
};

export function ItemFormDialog({
  mode,
  item,
  date,
  isOpen,
  onClose,
  onSaved,
}: ItemFormDialogProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState<string | null>(null);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (mode === "edit" && item) {
      setForm({
        url: item.url,
        title: item.title,
        description: item.description || "",
        imageUrl: item.imageUrl || "",
        siteName: item.siteName || "",
        sourceType: item.sourceType,
        note: item.note || "",
        authorName: item.authorName,
        entryDate: item.entryDate,
        password: "",
      });
    } else {
      setForm({ ...EMPTY_FORM, entryDate: date });
    }

    setMessage(null);
  }, [date, isOpen, item, mode]);

  if (!isOpen) {
    return null;
  }

  function updateField<K extends keyof FormState>(name: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleFetchMetadata() {
    setMessage(null);
    setIsFetchingMetadata(true);

    try {
      const metadata = await fetchMetadata(form.url);

      if (!metadata.ok) {
        setForm((current) => ({
          ...current,
          sourceType: metadata.sourceType || detectSourceType(current.url),
        }));
        setMessage("미리보기를 가져오지 못했습니다. 제목을 직접 입력해 주세요.");
        return;
      }

      setForm((current) => ({
        ...current,
        url: metadata.url,
        title: metadata.title || current.title,
        description: metadata.description || "",
        imageUrl: metadata.imageUrl || "",
        siteName: metadata.siteName || "",
        sourceType: metadata.sourceType,
      }));
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "미리보기를 가져오지 못했습니다.",
      );
    } finally {
      setIsFetchingMetadata(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    try {
      const input = {
        url: form.url,
        title: form.title,
        description: form.description || null,
        imageUrl: form.imageUrl || null,
        siteName: form.siteName || null,
        sourceType: form.sourceType,
        note: form.note || null,
        authorName: form.authorName,
        entryDate: form.entryDate,
        password: form.password,
      };

      if (mode === "edit" && item) {
        await updateItem(item.id, input);
      } else {
        await createItem(input);
      }

      onSaved();
      onClose();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "저장하지 못했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="dialog" role="dialog" aria-modal="true" aria-label="링크 등록">
        <form onSubmit={handleSubmit}>
          <header className="dialog-header">
            <h2>{mode === "edit" ? "링크 수정" : "링크 등록"}</h2>
            <button type="button" onClick={onClose}>
              닫기
            </button>
          </header>

          {message ? <p className="status-message error">{message}</p> : null}

          <label>
            URL
            <input
              required
              type="url"
              value={form.url}
              onChange={(event) => updateField("url", event.target.value)}
            />
          </label>

          <button
            type="button"
            onClick={handleFetchMetadata}
            disabled={!form.url || isFetchingMetadata}
          >
            {isFetchingMetadata ? "가져오는 중" : "미리보기 가져오기"}
          </button>

          <label>
            제목
            <input
              required
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
            />
          </label>

          <label>
            닉네임
            <input
              required
              value={form.authorName}
              onChange={(event) => updateField("authorName", event.target.value)}
            />
          </label>

          <label>
            타입
            <select
              value={form.sourceType}
              onChange={(event) =>
                updateField("sourceType", event.target.value as SourceType)
              }
            >
              <option value="youtube">유튜브</option>
              <option value="shorts">쇼츠</option>
              <option value="community">커뮤니티</option>
              <option value="other">기타</option>
            </select>
          </label>

          <label>
            기준 날짜
            <input
              required
              type="date"
              value={form.entryDate}
              onChange={(event) => updateField("entryDate", event.target.value)}
            />
          </label>

          <label>
            메모
            <textarea
              rows={3}
              value={form.note}
              onChange={(event) => updateField("note", event.target.value)}
            />
          </label>

          <label>
            공용 비밀번호
            <input
              required
              type="password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
            />
          </label>

          <footer className="dialog-actions">
            <button type="button" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? "저장 중" : "저장"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Wire create, edit, and delete into `ArchiveApp`**

Modify `src/components/archive-app.tsx` so it imports mutation helpers and the
dialog:

```tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { deleteItem, fetchItems } from "@/lib/api-client";
import { ItemFormDialog } from "@/components/item-form-dialog";
```

Add state inside `ArchiveApp`:

```tsx
const [isDialogOpen, setIsDialogOpen] = useState(false);
const [editingItem, setEditingItem] = useState<ArchiveItem | null>(null);
```

Extract the loading logic into a reusable function inside `ArchiveApp`:

```tsx
const loadItems = useCallback(async () => {
  setIsLoading(true);
  setMessage(null);

  try {
    const [nextItems, nextRecentItems] = await Promise.all([
      fetchItems(listParams),
      fetchItems({ sourceType: "all", limit: 5 }),
    ]);
    setItems(nextItems);
    setRecentItems(nextRecentItems);
  } catch (error) {
    setMessage(error instanceof Error ? error.message : "목록을 불러오지 못했습니다.");
  } finally {
    setIsLoading(false);
  }
}, [listParams]);
```

Replace the existing `useEffect` body with:

```tsx
useEffect(() => {
  void loadItems();
}, [loadItems]);
```

Replace the header register button with:

```tsx
<button
  type="button"
  className="primary-button"
  onClick={() => {
    setEditingItem(null);
    setIsDialogOpen(true);
  }}
>
  등록
</button>
```

Pass edit and delete handlers to daily `LinkCard`:

```tsx
<LinkCard
  key={item.id}
  item={item}
  onEdit={(nextItem) => {
    setEditingItem(nextItem);
    setIsDialogOpen(true);
  }}
  onDelete={async (nextItem) => {
    const password = window.prompt("공용 비밀번호를 입력하세요.");
    if (!password) return;

    if (!window.confirm("이 링크를 삭제할까요?")) return;

    try {
      await deleteItem(nextItem.id, password);
      await loadItems();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "삭제하지 못했습니다.");
    }
  }}
/>
```

Render the dialog before `</main>`:

```tsx
<ItemFormDialog
  mode={editingItem ? "edit" : "create"}
  item={editingItem}
  date={date}
  isOpen={isDialogOpen}
  onClose={() => setIsDialogOpen(false)}
  onSaved={loadItems}
/>
```

Expected: users can open the form, create items, edit existing items, and delete
items after password prompts.

- [ ] **Step 3: Expand component tests for the write flow**

Add this test to `tests/components/archive-app.test.tsx`:

```tsx
import userEvent from "@testing-library/user-event";

it("opens the create dialog and preserves manual title fallback", async () => {
  const user = userEvent.setup();
  vi.mocked(fetch).mockImplementation(async (url: string, init?: RequestInit) => {
    if (url === "/api/items/metadata") {
      return Response.json({
        ok: false,
        url: "https://blocked.example.com/",
        sourceType: "other",
        message: "blocked",
      });
    }

    if (url === "/api/items" && init?.method === "POST") {
      return Response.json({ item }, { status: 201 });
    }

    return Response.json({ items: [item] });
  });

  render(<ArchiveApp />);
  await user.click(screen.getByRole("button", { name: "등록" }));
  await user.type(screen.getByLabelText("URL"), "https://blocked.example.com");
  await user.click(screen.getByRole("button", { name: "미리보기 가져오기" }));

  expect(
    await screen.findByText("미리보기를 가져오지 못했습니다. 제목을 직접 입력해 주세요."),
  ).toBeInTheDocument();
});
```

Expected: metadata failure keeps the dialog open and guides manual title input.

- [ ] **Step 4: Run write-flow tests**

Run:

```bash
pnpm test tests/components/archive-app.test.tsx
```

Expected: browsing and write-flow component tests pass.

- [ ] **Step 5: Commit write flows**

Run:

```bash
git add src/components tests/components
git commit -m "feat: add archive write flows"
```

Expected: create, edit, and delete UI flows are committed.

### Task 9: Apply mobile-first document-style UI polish

This task completes the namu.wiki-like visual direction and makes controls
usable in narrow mobile webviews.

**Files:**

- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace global CSS with complete mobile styles**

Replace `src/app/globals.css` with:

```css
:root {
  color-scheme: light;
  --page-bg: #ffffff;
  --text: #202124;
  --muted: #6b7280;
  --border: #d5d7dc;
  --soft: #f6f7f9;
  --link: #1f5fbf;
  --danger: #b42318;
  --focus: #1d4ed8;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  min-height: 100%;
  background: var(--page-bg);
  color: var(--text);
  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

button,
input,
select,
textarea {
  font: inherit;
}

button,
input,
select,
textarea {
  border: 1px solid var(--border);
  border-radius: 4px;
}

button {
  min-height: 40px;
  padding: 7px 10px;
  background: var(--soft);
  color: var(--text);
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

input,
select,
textarea {
  width: 100%;
  min-height: 40px;
  padding: 8px 9px;
  background: #ffffff;
  color: var(--text);
}

textarea {
  resize: vertical;
}

button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible,
a:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

a {
  color: var(--link);
}

.page-shell {
  width: min(100%, 760px);
  margin: 0 auto;
  padding: 16px 12px 40px;
}

.site-header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
  border-bottom: 1px solid var(--border);
  padding-bottom: 12px;
}

.site-header h1,
.section-block h2,
.dialog h2 {
  margin: 0;
  line-height: 1.25;
}

.site-header h1 {
  font-size: 24px;
}

.site-header p {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.5;
}

.primary-button {
  border-color: #1f5fbf;
  background: #1f5fbf;
  color: #ffffff;
}

.danger {
  color: var(--danger);
}

.status-message {
  margin: 12px 0 0;
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 9px 10px;
  background: var(--soft);
  font-size: 14px;
}

.status-message.error {
  border-color: #f2b8b5;
  color: var(--danger);
  background: #fff5f5;
}

.date-nav,
.filter-bar {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}

.date-nav {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.date-nav strong {
  grid-column: 1 / -1;
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 8px 9px;
  background: var(--soft);
  text-align: center;
}

.filter-bar {
  grid-template-columns: 1fr;
}

.section-block {
  margin-top: 18px;
  border-top: 1px solid var(--border);
  padding-top: 12px;
}

.section-block h2 {
  font-size: 18px;
}

.link-list {
  display: grid;
  gap: 10px;
  margin-top: 10px;
}

.link-list.compact .link-card {
  grid-template-columns: 1fr;
}

.link-card {
  display: grid;
  gap: 10px;
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 10px;
  background: #ffffff;
}

.link-card__thumb {
  width: 100%;
  max-height: 180px;
  object-fit: cover;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: var(--soft);
}

.link-title {
  display: inline-block;
  font-weight: 700;
  line-height: 1.4;
  word-break: break-word;
}

.link-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 5px 8px;
  margin-top: 5px;
  color: var(--muted);
  font-size: 12px;
}

.link-card p {
  margin: 8px 0 0;
  font-size: 14px;
  line-height: 1.5;
}

.link-note {
  border-left: 3px solid var(--border);
  padding-left: 8px;
}

.link-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.empty-state {
  margin: 10px 0 0;
  color: var(--muted);
  font-size: 14px;
}

.dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  overflow-y: auto;
  background: rgb(0 0 0 / 35%);
  padding: 12px;
}

.dialog {
  width: min(100%, 560px);
  margin: 20px auto;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: #ffffff;
  padding: 12px;
}

.dialog form,
.dialog label {
  display: grid;
  gap: 7px;
}

.dialog form {
  gap: 12px;
}

.dialog-header,
.dialog-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
}

.dialog h2 {
  font-size: 18px;
}

@media (min-width: 560px) {
  .filter-bar {
    grid-template-columns: 1fr 180px;
  }

  .link-card {
    grid-template-columns: 150px 1fr;
  }

  .link-card__thumb {
    height: 96px;
  }
}
```

Expected: mobile layout uses stable dimensions, readable spacing, and plain
document-style UI without decorative marketing sections.

- [ ] **Step 2: Verify CSS with build**

Run:

```bash
pnpm build
```

Expected: production build succeeds.

- [ ] **Step 3: Commit UI polish**

Run:

```bash
git add src/app/globals.css
git commit -m "style: polish mobile archive ui"
```

Expected: final MVP styling is committed.

### Task 10: Add e2e tests and deployment documentation

This task verifies the full product path and documents how to run and deploy
the app.

**Files:**

- Create: `tests/e2e/archive.spec.ts`
- Create: `README.md`
- Modify: `.env.example`

- [ ] **Step 1: Create e2e test**

Create `tests/e2e/archive.spec.ts` with:

```ts
import { expect, test } from "@playwright/test";

test("mobile archive browsing and manual metadata fallback", async ({ page }) => {
  await page.route("**/api/items?**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        items: [
          {
            id: "1",
            url: "https://example.com",
            title: "Example title",
            description: "Example description",
            imageUrl: null,
            siteName: "Example",
            sourceType: "other",
            note: "좋았음",
            authorName: "민수",
            entryDate: "2026-07-01",
            createdAt: "2026-07-01T00:00:00.000Z",
            updatedAt: "2026-07-01T00:00:00.000Z",
          },
        ],
      }),
    });
  });

  await page.route("**/api/items/metadata", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        ok: false,
        url: "https://blocked.example.com/",
        sourceType: "other",
        message: "blocked",
      }),
    });
  });

  await page.route("**/api/items", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          item: {
            id: "2",
            url: "https://blocked.example.com/",
            title: "Manual title",
            description: null,
            imageUrl: null,
            siteName: null,
            sourceType: "other",
            note: null,
            authorName: "지훈",
            entryDate: "2026-07-01",
            createdAt: "2026-07-01T00:00:00.000Z",
            updatedAt: "2026-07-01T00:00:00.000Z",
          },
        }),
      });
      return;
    }

    await route.continue();
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "단톡 링크 아카이브" })).toBeVisible();
  await expect(page.getByText("Example title").first()).toBeVisible();

  await page.getByRole("button", { name: "등록" }).click();
  await page.getByLabel("URL").fill("https://blocked.example.com");
  await page.getByRole("button", { name: "미리보기 가져오기" }).click();
  await expect(
    page.getByText("미리보기를 가져오지 못했습니다. 제목을 직접 입력해 주세요."),
  ).toBeVisible();

  await page.getByLabel("제목").fill("Manual title");
  await page.getByLabel("닉네임").fill("지훈");
  await page.getByLabel("공용 비밀번호").fill("secret");
  await page.getByRole("button", { name: "저장" }).click();
});
```

Expected: the e2e test covers mobile rendering, browsing, metadata fallback, and
the create form path.

- [ ] **Step 2: Create README**

Create `README.md` with:

```md
# 단톡 링크 아카이브

12명 규모의 카카오톡 단톡방에서 공유한 링크를 날짜별로 모으는 작은
아카이브입니다. 읽기는 공개이고, 링크 등록, 수정, 삭제는 공용 비밀번호로
제한합니다.

## 기술 스택

- Next.js App Router
- TypeScript
- Supabase Postgres
- Vercel
- Vitest
- Playwright

## 환경 변수

`.env.local`에 다음 값을 설정합니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-or-secret-key
ARCHIVE_WRITE_PASSWORD=change-this-password
```

`SUPABASE_SERVICE_ROLE_KEY`는 서버에서만 사용합니다. 이 값은 브라우저 코드에
노출하면 안 됩니다.

## Supabase 설정

Supabase SQL editor 또는 Supabase CLI로
`supabase/migrations/20260701000000_create_archive_items.sql`을 적용합니다.

## 로컬 실행

의존성을 설치하고 개발 서버를 실행합니다.

```bash
pnpm install
pnpm dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

## 검증

변경 후 다음 명령을 실행합니다.

```bash
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

## 배포

Vercel 프로젝트를 만들고 Git 저장소를 연결합니다. Vercel 환경 변수에
`.env.example`과 같은 키를 설정한 뒤 배포합니다.
```

Expected: a new developer can configure Supabase, run the app locally, and set
Vercel environment variables.

- [ ] **Step 3: Run full verification**

Run:

```bash
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

Expected: lint, unit tests, build, and mobile e2e tests all pass.

- [ ] **Step 4: Commit verification and docs**

Run:

```bash
git add tests/e2e README.md .env.example
git commit -m "test: add archive e2e coverage"
```

Expected: end-to-end coverage and deployment docs are committed.

## Final release checklist

Run this checklist after Task 10 is complete.

- [ ] Confirm `pnpm lint` passes.
- [ ] Confirm `pnpm test` passes.
- [ ] Confirm `pnpm build` passes.
- [ ] Confirm `pnpm test:e2e` passes.
- [ ] Confirm `.env.example` lists all required Vercel variables.
- [ ] Confirm `SUPABASE_SERVICE_ROLE_KEY` is never referenced in client
      components.
- [ ] Confirm create, update, and delete APIs reject a wrong password.
- [ ] Confirm metadata failure lets the user submit a manual title.
- [ ] Confirm the mobile viewport has no overlapping controls.
- [ ] Confirm the Supabase migration has been applied before production use.

## Execution notes

Use one task per commit. Keep the MVP scoped to links, public reads, shared
password writes, metadata preview, date navigation, search, filtering, and
mobile document-style UI. Product ideas outside this list belong in a separate
design update before implementation.
