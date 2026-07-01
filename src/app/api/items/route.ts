import { NextResponse } from "next/server";

import {
  createArchiveItem,
  listArchiveItems,
} from "@/lib/archive-repository";
import { getServerEnv } from "@/lib/env";
import { verifyWritePassword } from "@/lib/password";
import { itemListParamsSchema, upsertItemSchema } from "@/lib/validation";

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
    const input = upsertItemSchema.parse(body);
    const env = getServerEnv();

    if (!verifyWritePassword(input.password, env.archiveWritePassword)) {
      return NextResponse.json(
        { message: "비밀번호가 올바르지 않습니다." },
        { status: 401 },
      );
    }

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
