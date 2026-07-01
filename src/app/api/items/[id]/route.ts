import { NextResponse } from "next/server";

import {
  softDeleteArchiveItem,
  updateArchiveItem,
} from "@/lib/archive-repository";
import { getServerEnv } from "@/lib/env";
import { verifyWritePassword } from "@/lib/password";
import { upsertItemSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function isNotFoundError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "kind" in error &&
    (error as { kind?: unknown }).kind === "not_found"
  );
}

function notFoundResponse() {
  return NextResponse.json(
    { message: "대상을 찾을 수 없습니다." },
    { status: 404 },
  );
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const input = upsertItemSchema.parse(body);
    const env = getServerEnv();

    if (!verifyWritePassword(input.password, env.archiveWritePassword)) {
      return NextResponse.json(
        { message: "비밀번호가 올바르지 않습니다." },
        { status: 401 },
      );
    }

    const item = await updateArchiveItem(id, {
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

    return NextResponse.json({ item });
  } catch (error) {
    if (isNotFoundError(error)) {
      return notFoundResponse();
    }

    return NextResponse.json(
      { message: "링크를 수정하지 못했습니다." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const env = getServerEnv();

    if (!verifyWritePassword(body?.password, env.archiveWritePassword)) {
      return NextResponse.json(
        { message: "비밀번호가 올바르지 않습니다." },
        { status: 401 },
      );
    }

    await softDeleteArchiveItem(id);

    return new Response(null, { status: 204 });
  } catch (error) {
    if (isNotFoundError(error)) {
      return notFoundResponse();
    }

    return NextResponse.json(
      { message: "링크를 삭제하지 못했습니다." },
      { status: 400 },
    );
  }
}
