import { describe, expect, it } from "vitest";

import {
  ArchiveRepositoryError,
  filterArchiveItemsByQuery,
  matchesArchiveItemQuery,
  toArchiveRepositoryError,
} from "@/lib/archive-repository";
import type { ArchiveItem } from "@/types/archive";

const sampleItem = {
  id: "1",
  url: "https://example.com/Interesting-Post",
  title: "Useful Notes",
  description: "A short description",
  imageUrl: null,
  siteName: "Example Site",
  sourceType: "other",
  note: "Shared from the group",
  authorName: "민수",
  entryDate: "2026-07-01",
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
} satisfies ArchiveItem;

describe("archive repository search helpers", () => {
  it("matches queries across title, description, note, url, and site name", () => {
    expect(matchesArchiveItemQuery(sampleItem, "useful")).toBe(true);
    expect(matchesArchiveItemQuery(sampleItem, "SHORT")).toBe(true);
    expect(matchesArchiveItemQuery(sampleItem, "shared")).toBe(true);
    expect(matchesArchiveItemQuery(sampleItem, "interesting-post")).toBe(true);
    expect(matchesArchiveItemQuery(sampleItem, "example site")).toBe(true);
    expect(matchesArchiveItemQuery(sampleItem, "missing")).toBe(false);
  });

  it("filters a list case-insensitively", () => {
    expect(filterArchiveItemsByQuery([sampleItem], "useful")).toHaveLength(1);
    expect(filterArchiveItemsByQuery([sampleItem], "missing")).toHaveLength(0);
  });
});

describe("ArchiveRepositoryError", () => {
  it("preserves Supabase error metadata", () => {
    const error = new ArchiveRepositoryError({
      kind: "supabase",
      message: "Row failed",
      code: "PGRST999",
      details: "details",
      hint: "hint",
    });

    expect(error.kind).toBe("supabase");
    expect(error.code).toBe("PGRST999");
    expect(error.details).toBe("details");
    expect(error.hint).toBe("hint");
    expect(error.name).toBe("ArchiveRepositoryError");
  });

  it("maps a no-row Supabase error to not_found", () => {
    const error = toArchiveRepositoryError(
      {
        message: "JSON object requested, multiple (or no) rows returned",
        code: "PGRST116",
        details: "0 rows",
        hint: null,
      },
      "not_found",
      "Archive item not found",
    );

    expect(error.kind).toBe("not_found");
    expect(error.message).toBe("Archive item not found");
    expect(error.code).toBe("PGRST116");
    expect(error.details).toBe("0 rows");
  });
});
