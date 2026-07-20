import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/media-storage", () => ({
  createSignedMediaUpload: vi.fn(),
}));

describe("POST /api/items/media-upload", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("creates a signed upload for a supported image", async () => {
    const mediaStorage = await import("@/lib/media-storage");
    vi.mocked(mediaStorage.createSignedMediaUpload).mockResolvedValue({
      path: "2026-07/00000000-0000-4000-8000-000000000001.jpg",
      token: "signed-token",
    });

    const { POST } = await import("@/app/api/items/media-upload/route");
    const response = await POST(
      new Request("http://localhost/api/items/media-upload", {
        method: "POST",
        body: JSON.stringify({
          contentType: "image",
          fileName: "photo.jpg",
          mimeType: "image/jpeg",
          fileSize: 1024,
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      path: "2026-07/00000000-0000-4000-8000-000000000001.jpg",
      token: "signed-token",
    });
  });

  it("rejects a mismatched media type", async () => {
    const { POST } = await import("@/app/api/items/media-upload/route");
    const response = await POST(
      new Request("http://localhost/api/items/media-upload", {
        method: "POST",
        body: JSON.stringify({
          contentType: "image",
          fileName: "clip.mp4",
          mimeType: "video/mp4",
          fileSize: 1024,
        }),
      }),
    );

    expect(response.status).toBe(400);
  });
});
