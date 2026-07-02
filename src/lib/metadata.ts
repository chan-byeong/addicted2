import "server-only";

import * as cheerio from "cheerio";

import { detectSourceType } from "@/lib/source-type";
import type { SourceType } from "@/types/archive";

const METADATA_TIMEOUT_MS = 7000;

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
    const element = $(selector).first();
    const value = element.attr("content") || element.text();

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

function createTimeoutSignal(timeoutMs: number) {
  if (typeof AbortSignal.timeout === "function") {
    return {
      signal: AbortSignal.timeout(timeoutMs),
      cleanup() {},
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    cleanup() {
      clearTimeout(timeoutId);
    },
  };
}

function isYouTubeSourceType(sourceType: SourceType) {
  return sourceType === "youtube" || sourceType === "shorts";
}

function getStringField(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeHostname(hostname: string) {
  return hostname.replace(/^www\./, "");
}

function normalizeTitle(title: string, sourceType: SourceType) {
  if (sourceType === "community" && title.includes(" - ")) {
    return title.split(" - ")[0].trim();
  }

  return title;
}

function isFmkoreaHost(hostname: string) {
  const normalized = normalizeHostname(hostname);
  return normalized === "fmkorea.com" || normalized.endsWith(".fmkorea.com");
}

function extractCommunityFallback(
  $: cheerio.CheerioAPI,
  url: string,
  sourceType: SourceType,
) {
  if (sourceType !== "community") {
    return { title: null as string | null, imageUrl: null as string | null };
  }

  const hostname = normalizeHostname(new URL(url).hostname);

  if (!isFmkoreaHost(hostname)) {
    return { title: null, imageUrl: null };
  }

  const title =
    $(".np_18px_span").first().text().trim() ||
    $("h1.np_18px").first().text().trim() ||
    null;

  const imageUrl = absolutizeUrl($("article img").first().attr("src") ?? null, url);

  return { title: title || null, imageUrl };
}

const HTML_FETCH_HEADERS = {
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
};

async function fetchYouTubeOEmbedMetadata(
  url: string,
  sourceType: SourceType,
): Promise<LinkMetadataResult | null> {
  const oEmbedUrl = new URL("https://www.youtube.com/oembed");
  oEmbedUrl.searchParams.set("url", url);
  oEmbedUrl.searchParams.set("format", "json");

  const { signal, cleanup } = createTimeoutSignal(METADATA_TIMEOUT_MS);

  try {
    const response = await fetch(oEmbedUrl.toString(), {
      headers: {
        accept: "application/json",
      },
      signal,
    });

    if (!response.ok) {
      return null;
    }

    const metadata = (await response.json()) as Record<string, unknown>;
    const title = getStringField(metadata.title);

    if (!title) {
      return null;
    }

    return {
      ok: true,
      url,
      title,
      description: null,
      imageUrl: absolutizeUrl(getStringField(metadata.thumbnail_url), url),
      siteName: getStringField(metadata.provider_name) ?? "YouTube",
      sourceType,
    };
  } catch {
    return null;
  } finally {
    cleanup();
  }
}

async function fetchHtmlMetadata(
  url: string,
  sourceType: SourceType,
): Promise<LinkMetadataResult> {
  const { signal, cleanup } = createTimeoutSignal(METADATA_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: HTML_FETCH_HEADERS,
      redirect: "follow",
      signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        url,
        sourceType,
        message: `Metadata request failed with ${response.status}`,
      };
    }

    const contentType = response.headers.get("content-type") ?? "";
    const isHtml =
      contentType.includes("text/html") ||
      contentType.includes("application/xhtml+xml");

    if (!isHtml) {
      return {
        ok: false,
        url,
        sourceType,
        message: "Metadata response was not HTML",
      };
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const hostname = new URL(url).hostname;
    const normalizedHostname = normalizeHostname(hostname);
    const rawTitle =
      firstContent($, [
        'meta[property="og:title"]',
        'meta[name="twitter:title"]',
        'meta[property="twitter:title"]',
        "title",
      ]) ?? normalizedHostname;
    let title = normalizeTitle(rawTitle, sourceType);
    const description = firstContent($, [
      'meta[property="og:description"]',
      'meta[name="twitter:description"]',
      'meta[property="twitter:description"]',
      'meta[name="description"]',
    ]);
    let imageUrl = absolutizeUrl(
      firstContent($, [
        'meta[property="og:image"]',
        'meta[property="og:image:url"]',
        'meta[name="twitter:image"]',
        'meta[property="twitter:image"]',
        'meta[name="twitter:image:src"]',
      ]),
      url,
    );
    const siteName = firstContent($, ['meta[property="og:site_name"]']) ?? normalizedHostname;

    if (
      sourceType === "community" &&
      (title === normalizedHostname || !imageUrl)
    ) {
      const fallback = extractCommunityFallback($, url, sourceType);

      if (title === normalizedHostname && fallback.title) {
        title = fallback.title;
      }

      if (!imageUrl && fallback.imageUrl) {
        imageUrl = fallback.imageUrl;
      }
    }

    return {
      ok: true,
      url,
      title,
      description,
      imageUrl,
      siteName,
      sourceType,
    };
  } catch (error) {
    return {
      ok: false,
      url,
      sourceType,
      message: error instanceof Error ? error.message : "Metadata request failed",
    };
  } finally {
    cleanup();
  }
}

export async function fetchLinkMetadata(
  rawUrl: string,
): Promise<LinkMetadataResult> {
  let url: string;

  try {
    url = new URL(rawUrl).toString();
  } catch {
    return {
      ok: false,
      url: rawUrl,
      sourceType: detectSourceType(rawUrl),
      message: "Invalid URL",
    };
  }

  const sourceType = detectSourceType(url);

  if (isYouTubeSourceType(sourceType)) {
    const oEmbedMetadata = await fetchYouTubeOEmbedMetadata(url, sourceType);

    if (oEmbedMetadata) {
      return oEmbedMetadata;
    }
  }

  return fetchHtmlMetadata(url, sourceType);
}
