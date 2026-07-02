import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { isMissingRequiredEnvError } from "@/lib/env";
import {
  getMapleCharacterBasic,
  getMapleCharacterCardStats,
  getMapleCharacterOcid,
  NexonMapleError,
} from "@/lib/nexon-maple";
import {
  isMissingMapleCharactersTableError,
  listMapleCharacters,
  upsertMapleCharacter,
} from "@/lib/maple-repository";
import { createMapleCharacterSchema } from "@/lib/validation";
import type { MapleCharacter } from "@/types/maple";

function logMapleApiError(kind: string, error: unknown) {
  console.error("[maple-api]", kind, error instanceof Error ? error.message : error);
}

function mapleErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof NexonMapleError) {
    logMapleApiError("nexon", error);

    return NextResponse.json(
      { message: error.message },
      { status: error.status === 404 ? 404 : error.status === 429 ? 429 : 502 },
    );
  }

  if (isMissingRequiredEnvError(error, "NEXON_OPEN_API_KEY")) {
    logMapleApiError("missing-nexon-key", error);

    return NextResponse.json(
      { message: "NEXON API 키가 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  if (isMissingMapleCharactersTableError(error)) {
    logMapleApiError("missing-maple-table", error);

    return NextResponse.json(
      { message: "메이플 캐릭터 테이블 migration이 필요합니다." },
      { status: 500 },
    );
  }

  if (error instanceof ZodError || error instanceof SyntaxError) {
    logMapleApiError("bad-request", error);

    return NextResponse.json(
      { message: "캐릭터 명을 확인해주세요." },
      { status: 400 },
    );
  }

  logMapleApiError("unexpected", error);

  return NextResponse.json({ message: fallbackMessage }, { status: 500 });
}

async function attachCardStats(character: MapleCharacter) {
  try {
    const cardStats = await getMapleCharacterCardStats(character.ocid);

    return {
      ...character,
      ...cardStats,
    };
  } catch (error) {
    logMapleApiError("nexon-card-stats", error);
    return character;
  }
}

export async function GET() {
  try {
    const characters = await listMapleCharacters();
    const charactersWithStats = await Promise.all(characters.map(attachCardStats));

    return NextResponse.json({ characters: charactersWithStats });
  } catch (error) {
    return mapleErrorResponse(error, "캐릭터 목록을 불러오지 못했습니다.");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = createMapleCharacterSchema.parse(body);
    const ocid = await getMapleCharacterOcid(input.characterName);
    const basic = await getMapleCharacterBasic(ocid);
    const character = await upsertMapleCharacter({
      ocid,
      characterName: basic.characterName || input.characterName,
      worldName: basic.worldName,
      characterClass: basic.characterClass,
      characterLevel: basic.characterLevel,
      characterImage: basic.characterImage,
    });

    return NextResponse.json({ character }, { status: 201 });
  } catch (error) {
    return mapleErrorResponse(error, "캐릭터를 등록하지 못했습니다.");
  }
}
