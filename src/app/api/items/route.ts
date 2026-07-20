import { NextResponse } from "next/server";

import {
  createArchiveItem,
  listArchiveItems,
} from "@/lib/archive-repository";
import {
  removeUploadedMedia,
  resolveUploadedMedia,
} from "@/lib/media-storage";
import { createItemSchema, itemListParamsSchema } from "@/lib/validation";

function toRequestParams(request: Request) {
  const url = new URL(request.url);

  return {
    date: url.searchParams.get("date") || undefined,
    query: url.searchParams.get("query") || undefined,
    sourceType: url.searchParams.get("sourceType") || undefined,
    limit: url.searchParams.get("limit") || undefined,
  };
}

export async function GET(request: Request) {
  try {
    const params = itemListParamsSchema.parse(toRequestParams(request));
    const items = await listArchiveItems(params);

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json(
      { message: "목록을 불러오지 못했습니다." },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  let uploadedMediaPath: string | null = null;

  try {
    const body = await request.json();
    const input = createItemSchema.parse(body);

    if (input.contentType !== "link") {
      uploadedMediaPath = input.storagePath;
      const mediaUrl = await resolveUploadedMedia(input.storagePath);
      const item = await createArchiveItem({
        contentType: input.contentType,
        url: mediaUrl,
        title: input.fileName,
        description: null,
        imageUrl: input.contentType === "image" ? mediaUrl : null,
        siteName: null,
        sourceType: "other",
        storagePath: input.storagePath,
        mediaMimeType: input.mimeType,
        mediaSize: input.fileSize,
        note: input.note,
        authorName: input.authorName,
        entryDate: input.entryDate,
      });

      return NextResponse.json({ item }, { status: 201 });
    }

    const item = await createArchiveItem({
      contentType: "link",
      url: input.url,
      title: input.title,
      description: input.description,
      imageUrl: input.imageUrl,
      siteName: input.siteName,
      sourceType: input.sourceType,
      storagePath: null,
      mediaMimeType: null,
      mediaSize: null,
      note: input.note,
      authorName: input.authorName,
      entryDate: input.entryDate,
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (uploadedMediaPath) {
      await removeUploadedMedia(uploadedMediaPath).catch(() => undefined);
    }

    console.warn("[items-api] create-failed", {
      contentType: uploadedMediaPath ? "media" : "link",
      errorName: error instanceof Error ? error.name : "UnknownError",
    });

    return NextResponse.json(
      { message: "아카이브 항목을 저장하지 못했습니다." },
      { status: 400 },
    );
  }
}
