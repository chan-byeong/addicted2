import { describe, expect, it, vi } from "vitest";

import {
  ArchiveRepositoryError,
  filterArchiveItemsByQuery,
  listArchiveItems,
  matchesArchiveItemQuery,
  updateArchiveItem,
  toArchiveRepositoryError,
} from "@/lib/archive-repository";
import type { ArchiveItem } from "@/types/archive";

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(),
}));

const sampleItem = {
  id: "1",
  url: "https://example.com/Interesting-Post",
  title: "Useful Notes",
  description: "A short description",
  imageUrl: null,
  siteName: "Example Site",
  sourceType: "other",
  contentType: "link",
  storagePath: null,
  mediaMimeType: null,
  mediaSize: null,
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

describe("archive repository list scope", () => {
  function createListQuery() {
    const query = {
      select: vi.fn(),
      is: vi.fn(),
      order: vi.fn(),
      eq: vi.fn(),
      ilike: vi.fn(),
      limit: vi.fn(),
      then: vi.fn(),
    };

    query.select.mockReturnValue(query);
    query.is.mockReturnValue(query);
    query.order.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.ilike.mockReturnValue(query);
    query.limit.mockReturnValue(query);
    query.then.mockImplementation((resolve) =>
      Promise.resolve(resolve({ data: [], error: null })),
    );

    return query;
  }

  it("searches all dates when a text query is present", async () => {
    const query = createListQuery();
    const from = vi.fn().mockReturnValue(query);
    const { createServerSupabaseClient } = await import("@/lib/supabase/server");
    vi.mocked(createServerSupabaseClient).mockReturnValue({ from } as never);

    await listArchiveItems({
      date: "2026-07-20",
      query: "여행",
      sourceType: "all",
      limit: 50,
    });

    expect(query.eq).not.toHaveBeenCalledWith("entry_date", "2026-07-20");
    expect(query.ilike).toHaveBeenCalledWith("search_text", "%여행%");
  });

  it("filters uploaded images across all dates", async () => {
    const query = createListQuery();
    const from = vi.fn().mockReturnValue(query);
    const { createServerSupabaseClient } = await import("@/lib/supabase/server");
    vi.mocked(createServerSupabaseClient).mockReturnValue({ from } as never);

    await listArchiveItems({
      date: "2026-07-20",
      sourceType: "image",
      limit: 50,
    });

    expect(query.eq).not.toHaveBeenCalledWith("entry_date", "2026-07-20");
    expect(query.eq).toHaveBeenCalledWith("content_type", "image");
  });

  it("keeps the selected date for an unfiltered journal view", async () => {
    const query = createListQuery();
    const from = vi.fn().mockReturnValue(query);
    const { createServerSupabaseClient } = await import("@/lib/supabase/server");
    vi.mocked(createServerSupabaseClient).mockReturnValue({ from } as never);

    await listArchiveItems({
      date: "2026-07-20",
      sourceType: "all",
      limit: 50,
    });

    expect(query.eq).toHaveBeenCalledWith("entry_date", "2026-07-20");
    expect(query.ilike).not.toHaveBeenCalled();
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

  it("maps a no-row Supabase error from updateArchiveItem to not_found", async () => {
    const error = {
      message: "JSON object requested, multiple (or no) rows returned",
      code: "PGRST116",
      details: "0 rows",
      hint: "Use maybeSingle()",
    };
    const single = vi.fn().mockResolvedValue({ data: null, error });
    const select = vi.fn().mockReturnValue({ single });
    const is = vi.fn().mockReturnValue({ select });
    const eq = vi.fn().mockReturnValue({ is });
    const update = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ update });

    const { createServerSupabaseClient } = await import("@/lib/supabase/server");
    vi.mocked(createServerSupabaseClient).mockReturnValue({ from } as never);

    await expect(
      updateArchiveItem("item-1", { title: "Updated title" }),
    ).rejects.toMatchObject({
      kind: "not_found",
      message: "Archive item not found",
      code: "PGRST116",
      details: "0 rows",
      hint: "Use maybeSingle()",
    });
  });
});
