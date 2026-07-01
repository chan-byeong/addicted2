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

    expect(metadata).toEqual({
      ok: false,
      url: "https://example.com/post",
      sourceType: "other",
      message: "Metadata request failed with 403",
    });
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

    expect(metadata).toEqual({
      ok: true,
      url: "https://www.youtube.com/shorts/abc123",
      title: "Short title",
      description: null,
      imageUrl: null,
      siteName: "www.youtube.com",
      sourceType: "shorts",
    });
  });

  it("falls back to the hostname when title metadata is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response("<html><head></head><body></body></html>", {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
      ),
    );

    const metadata = await fetchLinkMetadata("https://example.com/post");

    expect(metadata).toEqual({
      ok: true,
      url: "https://example.com/post",
      title: "example.com",
      description: null,
      imageUrl: null,
      siteName: "example.com",
      sourceType: "other",
    });
  });
});
