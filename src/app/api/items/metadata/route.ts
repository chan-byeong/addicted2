import { NextResponse } from "next/server";

import { fetchLinkMetadata } from "@/lib/metadata";
import { metadataRequestSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = metadataRequestSchema.parse(body);
    const metadata = await fetchLinkMetadata(input.url);

    return NextResponse.json(metadata);
  } catch {
    return NextResponse.json(
      { message: "URL 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }
}
