import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/archive-repository", () => ({
  createArchiveItem: vi.fn(),
  listArchiveItems: vi.fn(),
  softDeleteArchiveItem: vi.fn(),
  updateArchiveItem: vi.fn(),
}));

vi.mock("@/lib/media-storage", () => ({
  removeUploadedMedia: vi.fn(),
  resolveUploadedMedia: vi.fn(),
}));

const exampleItem = {
  id: "00000000-0000-0000-0000-000000000001",
  url: "https://example.com/",
  title: "Example",
  description: null,
  imageUrl: null,
  siteName: "example.com",
  sourceType: "other",
  contentType: "link",
  storagePath: null,
  mediaMimeType: null,
  mediaSize: null,
  note: null,
  authorName: "민수",
  entryDate: "2026-07-01",
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
} as const;

describe("/api/items routes", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service";
    process.env.ARCHIVE_WRITE_PASSWORD = "secret";
  });

  it("lists items with parsed query params", async () => {
    const repo = await import("@/lib/archive-repository");
    vi.mocked(repo.listArchiveItems).mockResolvedValue([exampleItem]);

    const { GET } = await import("@/app/api/items/route");
    const response = await GET(
      new Request(
        "http://localhost/api/items?date=2026-07-01&query=example&sourceType=all&limit=10",
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ items: [exampleItem] });
    expect(repo.listArchiveItems).toHaveBeenCalledWith({
      date: "2026-07-01",
      query: "example",
      sourceType: "all",
      limit: 10,
    });
  });

  it("creates an item without a shared password", async () => {
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
        }),
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ item: exampleItem });
    expect(repo.createArchiveItem).toHaveBeenCalledWith({
      contentType: "link",
      url: "https://example.com/",
      title: "Example",
      description: null,
      imageUrl: null,
      siteName: null,
      sourceType: "other",
      storagePath: null,
      mediaMimeType: null,
      mediaSize: null,
      note: null,
      authorName: "민수",
      entryDate: "2026-07-01",
    });
  });

  it("does not validate shared password values on create requests", async () => {
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
          password: "wrong",
        }),
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ item: exampleItem });
  });

  it("creates an uploaded image item", async () => {
    const repo = await import("@/lib/archive-repository");
    const mediaStorage = await import("@/lib/media-storage");
    const imageItem = {
      ...exampleItem,
      url: "https://example.supabase.co/storage/image.jpg",
      title: "여행 사진.jpg",
      imageUrl: "https://example.supabase.co/storage/image.jpg",
      siteName: null,
      contentType: "image",
      storagePath: "2026-07/00000000-0000-4000-8000-000000000001.jpg",
      mediaMimeType: "image/jpeg",
      mediaSize: 1024,
    } as const;
    vi.mocked(mediaStorage.resolveUploadedMedia).mockResolvedValue(imageItem.url);
    vi.mocked(repo.createArchiveItem).mockResolvedValue(imageItem);

    const { POST } = await import("@/app/api/items/route");
    const response = await POST(
      new Request("http://localhost/api/items", {
        method: "POST",
        body: JSON.stringify({
          contentType: "image",
          storagePath: imageItem.storagePath,
          fileName: imageItem.title,
          mimeType: imageItem.mediaMimeType,
          fileSize: imageItem.mediaSize,
          note: "여행 기록",
          authorName: "민수",
          entryDate: "2026-07-20",
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(mediaStorage.resolveUploadedMedia).toHaveBeenCalledWith(
      imageItem.storagePath,
    );
    expect(repo.createArchiveItem).toHaveBeenCalledWith({
      contentType: "image",
      url: imageItem.url,
      title: "여행 사진.jpg",
      description: null,
      imageUrl: imageItem.url,
      siteName: null,
      sourceType: "other",
      storagePath: imageItem.storagePath,
      mediaMimeType: "image/jpeg",
      mediaSize: 1024,
      note: "여행 기록",
      authorName: "민수",
      entryDate: "2026-07-20",
    });
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
    await expect(response.json()).resolves.toEqual({ item: exampleItem });
    expect(repo.updateArchiveItem).toHaveBeenCalledWith("1", {
      url: "https://example.com/",
      title: "Example",
      description: null,
      imageUrl: null,
      siteName: null,
      sourceType: "other",
      note: null,
      authorName: "민수",
      entryDate: "2026-07-01",
    });
  });

  it("returns 404 when update target is missing", async () => {
    const repo = await import("@/lib/archive-repository");
    const error = { kind: "not_found", message: "Archive item not found" };
    vi.mocked(repo.updateArchiveItem).mockRejectedValue(error);

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

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      message: "대상을 찾을 수 없습니다.",
    });
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
    expect(repo.softDeleteArchiveItem).toHaveBeenCalledWith("1");
  });

  it("returns 404 when delete target is missing", async () => {
    const repo = await import("@/lib/archive-repository");
    const error = { kind: "not_found", message: "Archive item not found" };
    vi.mocked(repo.softDeleteArchiveItem).mockRejectedValue(error);

    const { DELETE } = await import("@/app/api/items/[id]/route");
    const response = await DELETE(
      new Request("http://localhost/api/items/1", {
        method: "DELETE",
        body: JSON.stringify({ password: "secret" }),
      }),
      { params: Promise.resolve({ id: "1" }) },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      message: "대상을 찾을 수 없습니다.",
    });
  });
});
