import { describe, expect, it } from "vitest";
import {
  createItemSchema,
  itemListParamsSchema,
  metadataRequestSchema,
  upsertItemSchema,
} from "@/lib/validation";

describe("validation schemas", () => {
  it("parses create item input without a password", () => {
    const result = createItemSchema.parse({
      url: "https://example.com/a",
      title: "Example title",
      sourceType: "other",
      authorName: "민수",
      entryDate: "2026-07-01",
    });

    expect(result.title).toBe("Example title");
    expect(result.url).toBe("https://example.com/a");
  });

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
    expect(result.url).toBe("https://example.com/a");
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

  it("normalizes metadata requests", () => {
    expect(
      metadataRequestSchema.parse({ url: "https://example.com" }).url,
    ).toBe("https://example.com/");
  });

  it("normalizes nullable fields to null when omitted or blank", () => {
    const result = upsertItemSchema.parse({
      url: "https://example.com/a",
      title: "Example title",
      sourceType: "other",
      authorName: "민수",
      entryDate: "2026-07-01",
      password: "secret",
      description: "   ",
      note: null,
      imageUrl: "   ",
      siteName: undefined,
    });

    expect(result.description).toBeNull();
    expect(result.note).toBeNull();
    expect(result.imageUrl).toBeNull();
    expect(result.siteName).toBeNull();
  });

  it("rejects malformed nullable URLs through zod parsing", () => {
    const result = upsertItemSchema.safeParse({
      url: "https://example.com/a",
      title: "Example title",
      sourceType: "other",
      authorName: "민수",
      entryDate: "2026-07-01",
      password: "secret",
      imageUrl: "not a url",
    });

    expect(result.success).toBe(false);
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
