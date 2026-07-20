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

  it("preserves note whitespace and line breaks", () => {
    const note = "  첫 번째 줄\n두 번째 줄  ";
    const result = createItemSchema.parse({
      url: "https://example.com/a",
      title: "Example title",
      sourceType: "other",
      authorName: "민수",
      entryDate: "2026-07-01",
      note,
    });

    expect(result.note).toBe(note);
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

  it("parses uploaded image items", () => {
    const result = createItemSchema.parse({
      contentType: "image",
      storagePath: "2026-07/00000000-0000-4000-8000-000000000001.jpg",
      fileName: "photo.jpg",
      mimeType: "image/jpeg",
      fileSize: 1024,
      note: "여행 기록",
      authorName: "민수",
      entryDate: "2026-07-20",
    });

    expect(result).toMatchObject({
      contentType: "image",
      fileName: "photo.jpg",
      mimeType: "image/jpeg",
    });
  });

  it("rejects oversized videos", () => {
    expect(() =>
      createItemSchema.parse({
        contentType: "video",
        storagePath: "2026-07/00000000-0000-4000-8000-000000000001.mp4",
        fileName: "clip.mp4",
        mimeType: "video/mp4",
        fileSize: 50 * 1024 * 1024 + 1,
        authorName: "민수",
        entryDate: "2026-07-20",
      }),
    ).toThrow();
  });
});
