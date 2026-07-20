import { NextResponse } from "next/server";

import { fetchLinkMetadata } from "@/lib/metadata";
import { metadataRequestSchema } from "@/lib/validation";

function redactUrlForLog(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return "[invalid-url]";
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = metadataRequestSchema.parse(body);
    const metadata = await fetchLinkMetadata(input.url);

    if (!metadata.ok) {
      console.warn("[metadata-api] fetch-failed", {
        url: redactUrlForLog(metadata.url),
        sourceType: metadata.sourceType,
        reason: metadata.message,
      });
    }

    return NextResponse.json(metadata);
  } catch (error) {
    console.warn("[metadata-api] request-failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });

    return NextResponse.json(
      { message: "URL 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }
}
