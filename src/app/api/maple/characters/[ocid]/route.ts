import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { isMissingRequiredEnvError } from "@/lib/env";
import {
  getMapleCharacterDetail,
  NexonMapleError,
} from "@/lib/nexon-maple";
import { mapleOcidSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{
    ocid: string;
  }>;
};

function detailErrorResponse(error: unknown) {
  if (error instanceof NexonMapleError) {
    console.error("[maple-api] nexon", error.message);

    return NextResponse.json(
      { message: error.message },
      { status: error.status === 404 ? 404 : error.status === 429 ? 429 : 502 },
    );
  }

  if (isMissingRequiredEnvError(error, "NEXON_OPEN_API_KEY")) {
    console.error("[maple-api] missing-nexon-key", error.message);

    return NextResponse.json(
      { message: "NEXON API 키가 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  if (error instanceof ZodError) {
    console.error("[maple-api] bad-ocid", error.message);

    return NextResponse.json(
      { message: "캐릭터 식별자를 확인해주세요." },
      { status: 400 },
    );
  }

  console.error(
    "[maple-api] unexpected",
    error instanceof Error ? error.message : error,
  );

  return NextResponse.json(
    { message: "캐릭터 정보를 불러오지 못했습니다." },
    { status: 500 },
  );
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { ocid } = await context.params;
    const normalizedOcid = mapleOcidSchema.parse(ocid);
    const character = await getMapleCharacterDetail(normalizedOcid);

    return NextResponse.json({ character });
  } catch (error) {
    return detailErrorResponse(error);
  }
}
