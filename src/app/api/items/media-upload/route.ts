import { NextResponse } from "next/server";

import { createSignedMediaUpload } from "@/lib/media-storage";
import { mediaUploadRequestSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = mediaUploadRequestSchema.parse(body);
    const upload = await createSignedMediaUpload(input);

    return NextResponse.json(upload);
  } catch (error) {
    console.warn("[media-upload-api] request-failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
      reason: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { message: "파일 업로드를 준비하지 못했습니다." },
      { status: 400 },
    );
  }
}
