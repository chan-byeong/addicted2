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

  it("returns a recoverable failure when fetch throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );

    const metadata = await fetchLinkMetadata("https://example.com/post");

    expect(metadata).toEqual({
      ok: false,
      url: "https://example.com/post",
      sourceType: "other",
      message: "network down",
    });
  });

  it("returns a recoverable failure for non-HTML responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response("{}", {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    const metadata = await fetchLinkMetadata("https://example.com/post");

    expect(metadata).toEqual({
      ok: false,
      url: "https://example.com/post",
      sourceType: "other",
      message: "Metadata response was not HTML",
    });
  });

  it("returns a stable failure for invalid URLs", async () => {
    const metadata = await fetchLinkMetadata("not a url");

    expect(metadata).toEqual({
      ok: false,
      url: "not a url",
      sourceType: "other",
      message: "Invalid URL",
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
      siteName: "youtube.com",
      sourceType: "shorts",
    });
  });

  it("uses YouTube oEmbed metadata for shorts URLs", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        title: "Short oEmbed title",
        provider_name: "YouTube",
        thumbnail_url: "https://i.ytimg.com/vi/abc123/hqdefault.jpg",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const metadata = await fetchLinkMetadata(
      "https://www.youtube.com/shorts/abc123",
    );

    const [firstFetchUrl] = fetchMock.mock.calls[0] as unknown as [
      string | URL | Request,
    ];
    const requestUrl = new URL(String(firstFetchUrl));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(`${requestUrl.origin}${requestUrl.pathname}`).toBe(
      "https://www.youtube.com/oembed",
    );
    expect(requestUrl.searchParams.get("url")).toBe(
      "https://www.youtube.com/shorts/abc123",
    );
    expect(requestUrl.searchParams.get("format")).toBe("json");
    expect(metadata).toEqual({
      ok: true,
      url: "https://www.youtube.com/shorts/abc123",
      title: "Short oEmbed title",
      description: null,
      imageUrl: "https://i.ytimg.com/vi/abc123/hqdefault.jpg",
      siteName: "YouTube",
      sourceType: "shorts",
    });
  });

  it("uses YouTube oEmbed metadata for watch URLs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          title: "Watch oEmbed title",
          provider_name: "YouTube",
          thumbnail_url: "https://i.ytimg.com/vi/watch123/hqdefault.jpg",
        }),
      ),
    );

    const metadata = await fetchLinkMetadata(
      "https://www.youtube.com/watch?v=watch123",
    );

    expect(metadata).toEqual({
      ok: true,
      url: "https://www.youtube.com/watch?v=watch123",
      title: "Watch oEmbed title",
      description: null,
      imageUrl: "https://i.ytimg.com/vi/watch123/hqdefault.jpg",
      siteName: "YouTube",
      sourceType: "youtube",
    });
  });

  it("falls back to HTML parsing when YouTube oEmbed fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("not found", { status: 404 }))
      .mockResolvedValueOnce(
        new Response(
          `
            <html>
              <head>
                <meta property="og:title" content="Fallback title" />
                <meta property="og:site_name" content="YouTube" />
              </head>
            </html>
          `,
          {
            status: 200,
            headers: { "content-type": "text/html" },
          },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const metadata = await fetchLinkMetadata(
      "https://www.youtube.com/watch?v=fallback123",
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(metadata).toEqual({
      ok: true,
      url: "https://www.youtube.com/watch?v=fallback123",
      title: "Fallback title",
      description: null,
      imageUrl: null,
      siteName: "YouTube",
      sourceType: "youtube",
    });
  });

  it("extracts Instagram reel metadata while keeping source type as other", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          `
            <html>
              <head>
                <meta property="og:title" content="&#064;myunsigkim on Instagram" />
                <meta property="og:description" content="725 likes, 56 comments - myunsigkim on June 29, 2026" />
                <meta property="og:image" content="https://instagram.test/reel.jpg?size=640&amp;format=jpg" />
                <meta property="og:site_name" content="Instagram" />
                <title>Login • Instagram</title>
              </head>
              <body>Log in to Instagram</body>
            </html>
          `,
          {
            status: 200,
            headers: { "content-type": "text/html; charset=utf-8" },
          },
        ),
      ),
    );

    const metadata = await fetchLinkMetadata(
      "https://www.instagram.com/reel/DaLxD0byplY/?igsh=MTdrenFyYmhra2d5",
    );

    expect(metadata).toEqual({
      ok: true,
      url: "https://www.instagram.com/reel/DaLxD0byplY/?igsh=MTdrenFyYmhra2d5",
      title: "@myunsigkim on Instagram",
      description: "725 likes, 56 comments - myunsigkim on June 29, 2026",
      imageUrl: "https://instagram.test/reel.jpg?size=640&format=jpg",
      siteName: "Instagram",
      sourceType: "other",
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

  it("extracts fmkorea metadata including property twitter tags", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          `
            <html>
              <head>
                <title>진자림 근황.jpg - 포텐 터짐 최신순 - 에펨코리아</title>
                <meta property="og:title" content="진자림 근황.jpg" />
                <meta property="og:description" content="개인방송 은퇴한다고 함" />
                <meta property="og:site_name" content="에펨코리아" />
                <meta property="twitter:title" content="진자림 근황.jpg" />
                <meta property="twitter:description" content="개인방송 은퇴한다고 함" />
                <meta property="twitter:image" content="https://image.fmkorea.com/files/attach/new5/thumb.png" />
                <meta property="og:image" content="https://image.fmkorea.com/files/attach/new5/thumb.png" />
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

    const metadata = await fetchLinkMetadata(
      "https://www.fmkorea.com/best/10033820683",
    );

    expect(metadata).toEqual({
      ok: true,
      url: "https://www.fmkorea.com/best/10033820683",
      title: "진자림 근황.jpg",
      description: "개인방송 은퇴한다고 함",
      imageUrl: "https://image.fmkorea.com/files/attach/new5/thumb.png",
      siteName: "에펨코리아",
      sourceType: "community",
    });
  });

  it("normalizes community page titles and falls back to fmkorea article content", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          `
            <html>
              <head>
                <title>진자림 근황.jpg - 포텐 터짐 최신순 - 에펨코리아</title>
              </head>
              <body>
                <article>
                  <h1 class="np_18px"><span class="np_18px_span">진자림 근황.jpg</span></h1>
                  <img src="//image.fmkorea.com/files/attach/new5/article.jpg" />
                </article>
              </body>
            </html>
          `,
          {
            status: 200,
            headers: { "content-type": "text/html; charset=utf-8" },
          },
        ),
      ),
    );

    const metadata = await fetchLinkMetadata(
      "https://www.fmkorea.com/best/10033820683",
    );

    expect(metadata).toEqual({
      ok: true,
      url: "https://www.fmkorea.com/best/10033820683",
      title: "진자림 근황.jpg",
      description: null,
      imageUrl: "https://image.fmkorea.com/files/attach/new5/article.jpg",
      siteName: "fmkorea.com",
      sourceType: "community",
    });
  });

  it("reads alternate image selectors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          `
            <html>
              <head>
                <meta property="og:title" content="OG title" />
                <meta property="og:image:url" content="/alt-image.jpg" />
                <meta name="twitter:image:src" content="/twitter-image.jpg" />
              </head>
            </html>
          `,
          {
            status: 200,
            headers: { "content-type": "text/html" },
          },
        ),
      ),
    );

    const metadata = await fetchLinkMetadata("https://example.com/post");

    expect(metadata).toEqual({
      ok: true,
      url: "https://example.com/post",
      title: "OG title",
      description: null,
      imageUrl: "https://example.com/alt-image.jpg",
      siteName: "example.com",
      sourceType: "other",
    });
  });
});
