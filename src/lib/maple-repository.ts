import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  MapleCharacter,
  MapleCharacterRow,
  MapleCharacterUpsertInput,
} from "@/types/maple";

type SupabaseErrorLike = {
  message: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
};

function isSupabaseErrorLike(error: unknown): error is SupabaseErrorLike {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as SupabaseErrorLike).message === "string"
  );
}

export class MapleRepositoryError extends Error {
  code?: string;
  details?: string;
  hint?: string;

  constructor({
    message,
    code,
    details,
    hint,
    cause,
  }: {
    message: string;
    code?: string;
    details?: string;
    hint?: string;
    cause?: unknown;
  }) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "MapleRepositoryError";
    this.code = code;
    this.details = details;
    this.hint = hint;
  }
}

export function isMissingMapleCharactersTableError(error: unknown) {
  return (
    error instanceof MapleRepositoryError &&
    (error.code === "42P01" ||
      error.code === "PGRST205" ||
      error.message.includes("maple_characters"))
  );
}

function toMapleRepositoryError(error: unknown, message?: string) {
  if (!isSupabaseErrorLike(error)) {
    return new MapleRepositoryError({
      message: message ?? "Maple repository operation failed",
      cause: error,
    });
  }

  return new MapleRepositoryError({
    message: message ?? error.message,
    code: error.code,
    details: error.details ?? undefined,
    hint: error.hint ?? undefined,
    cause: error,
  });
}

function mapMapleCharacter(row: MapleCharacterRow): MapleCharacter {
  return {
    id: row.id,
    ocid: row.ocid,
    characterName: row.character_name,
    worldName: row.world_name,
    characterClass: row.character_class,
    characterLevel: row.character_level,
    characterImage: row.character_image,
    combatPower: null,
    statAttackPower: null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toUpsertRow(input: MapleCharacterUpsertInput) {
  return {
    ocid: input.ocid,
    character_name: input.characterName,
    world_name: input.worldName ?? null,
    character_class: input.characterClass ?? null,
    character_level: input.characterLevel ?? null,
    character_image: input.characterImage ?? null,
  };
}

export async function listMapleCharacters() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("maple_characters")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    throw toMapleRepositoryError(error);
  }

  return (data as MapleCharacterRow[]).map(mapMapleCharacter);
}

export async function upsertMapleCharacter(input: MapleCharacterUpsertInput) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("maple_characters")
    .upsert(toUpsertRow(input), { onConflict: "ocid" })
    .select("*")
    .single();

  if (error) {
    throw toMapleRepositoryError(error);
  }

  return mapMapleCharacter(data as MapleCharacterRow);
}
