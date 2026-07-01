import * as cheerio from "cheerio";

import { detectSourceType } from "@/lib/source-type";
import type { SourceType } from "@/types/archive";

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
    return AbortSignal.timeout(timeoutMs);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  controller.signal.addEventListener(
    "abort",
    () => {
      clearTimeout(timeoutId);
    },
    { once: true },
  );

  return controller.signal;
}

export async function fetchLinkMetadata(
  rawUrl: string,
): Promise<LinkMetadataResult> {
  let url: string;

  try {
    url = new URL(rawUrl).toString();
  } catch (error) {
    return {
      ok: false,
      url: rawUrl,
      sourceType: detectSourceType(rawUrl),
      message: error instanceof Error ? error.message : "Invalid URL",
    };
  }

  const sourceType = detectSourceType(url);

  try {
    const response = await fetch(url, {
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "user-agent":
          "Mozilla/5.0 (compatible; CommunityLinkArchive/1.0; +https://example.com)",
      },
      signal: createTimeoutSignal(7000),
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
    const title =
      firstContent($, [
        'meta[property="og:title"]',
        'meta[name="twitter:title"]',
        "title",
      ]) ?? hostname;
    const description = firstContent($, [
      'meta[property="og:description"]',
      'meta[name="twitter:description"]',
      'meta[name="description"]',
    ]);
    const imageUrl = absolutizeUrl(
      firstContent($, [
        'meta[property="og:image"]',
        'meta[name="twitter:image"]',
      ]),
      url,
    );
    const siteName = firstContent($, ['meta[property="og:site_name"]']) ?? hostname;

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
  }
}
