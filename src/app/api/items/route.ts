import { NextResponse } from "next/server";

import {
  createArchiveItem,
  listArchiveItems,
} from "@/lib/archive-repository";
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
  try {
    const body = await request.json();
    const input = createItemSchema.parse(body);

    const item = await createArchiveItem({
      url: input.url,
      title: input.title,
      description: input.description,
      imageUrl: input.imageUrl,
      siteName: input.siteName,
      sourceType: input.sourceType,
      note: input.note,
      authorName: input.authorName,
      entryDate: input.entryDate,
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "링크를 저장하지 못했습니다." },
      { status: 400 },
    );
  }
}
