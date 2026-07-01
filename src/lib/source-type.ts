import type { SourceType } from "@/types/archive";

const COMMUNITY_HOSTS = [
  "fmkorea.com",
  "theqoo.net",
  "instiz.net",
  "clien.net",
  "ruliweb.com",
  "dcinside.com",
  "ppomppu.co.kr",
  "humoruniv.com",
];

function hostMatches(hostname: string, domain: string) {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

export function detectSourceType(rawUrl: string): SourceType {
  try {
    const url = new URL(rawUrl);
    const hostname = url.hostname.replace(/^www\./, "");

    if (hostMatches(hostname, "youtube.com")) {
      return url.pathname.startsWith("/shorts") ? "shorts" : "youtube";
    }

    if (hostMatches(hostname, "youtu.be")) {
      return "youtube";
    }

    if (COMMUNITY_HOSTS.some((domain) => hostMatches(hostname, domain))) {
      return "community";
    }

    return "other";
  } catch {
    return "other";
  }
}
