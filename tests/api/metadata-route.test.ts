import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/metadata", () => ({
  fetchLinkMetadata: vi.fn(),
}));

describe("POST /api/items/metadata", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
    await expect(response.json()).resolves.toEqual({
      ok: true,
      url: "https://example.com/",
      title: "Example",
      description: null,
      imageUrl: null,
      siteName: "example.com",
      sourceType: "other",
    });
  });

  it("returns a recoverable failure when metadata fetch fails", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { fetchLinkMetadata } = await import("@/lib/metadata");
    vi.mocked(fetchLinkMetadata).mockResolvedValue({
      ok: false,
      url: "https://example.com/post?token=secret#comments",
      sourceType: "other",
      message: "Metadata request failed with 403",
    });

    const { POST } = await import("@/app/api/items/metadata/route");
    const response = await POST(
      new Request("http://localhost/api/items/metadata", {
        method: "POST",
        body: JSON.stringify({ url: "https://example.com/post" }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      url: "https://example.com/post?token=secret#comments",
      sourceType: "other",
      message: "Metadata request failed with 403",
    });
    expect(warnSpy).toHaveBeenCalledWith("[metadata-api] fetch-failed", {
      url: "https://example.com/post",
      sourceType: "other",
      reason: "Metadata request failed with 403",
    });
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
    await expect(response.json()).resolves.toEqual({
      message: "URL 형식이 올바르지 않습니다.",
    });
  });
});
