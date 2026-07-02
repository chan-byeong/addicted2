import type {
  ArchiveItem,
  ArchiveItemInput,
  ItemListParams,
} from "@/types/archive";
import type {
  MapleCharacter,
  MapleCharacterDetail,
} from "@/types/maple";

function buildQuery(params: ItemListParams) {
  const searchParams = new URLSearchParams();

  if (params.date) searchParams.set("date", params.date);
  if (params.query) searchParams.set("query", params.query);
  if (params.sourceType) searchParams.set("sourceType", params.sourceType);
  if (params.limit) searchParams.set("limit", String(params.limit));

  return searchParams.toString();
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof data === "object" &&
        data !== null &&
        "message" in data &&
        typeof data.message === "string"
        ? data.message
        : "요청을 처리하지 못했습니다.",
    );
  }

  return data as T;
}

export async function fetchItems(params: ItemListParams) {
  const query = buildQuery(params);
  const response = await fetch(`/api/items${query ? `?${query}` : ""}`, {
    cache: "no-store",
  });
  const data = await parseJsonResponse<{ items: ArchiveItem[] }>(response);

  return data.items;
}

export async function fetchMetadata(url: string) {
  return parseJsonResponse<{
    ok: boolean;
    url: string;
    title?: string;
    description?: string | null;
    imageUrl?: string | null;
    siteName?: string | null;
    sourceType: ArchiveItem["sourceType"];
    message?: string;
  }>(
    await fetch("/api/items/metadata", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url }),
    }),
  );
}

export async function createItem(input: ArchiveItemInput) {
  const data = await parseJsonResponse<{ item: ArchiveItem }>(
    await fetch("/api/items", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    }),
  );

  return data.item;
}

export async function updateItem(
  id: string,
  input: ArchiveItemInput & { password: string },
) {
  const data = await parseJsonResponse<{ item: ArchiveItem }>(
    await fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    }),
  );

  return data.item;
}

export async function deleteItem(id: string, password: string) {
  const response = await fetch(`/api/items/${id}`, {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data === "object" &&
        data !== null &&
        "message" in data &&
        typeof data.message === "string"
        ? data.message
        : "링크를 삭제하지 못했습니다.",
    );
  }
}

export async function fetchMapleCharacters() {
  const data = await parseJsonResponse<{ characters: MapleCharacter[] }>(
    await fetch("/api/maple/characters", {
      cache: "no-store",
    }),
  );

  return data.characters;
}

export async function registerMapleCharacter(characterName: string) {
  const data = await parseJsonResponse<{ character: MapleCharacter }>(
    await fetch("/api/maple/characters", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ characterName }),
    }),
  );

  return data.character;
}

export async function fetchMapleCharacter(ocid: string) {
  const data = await parseJsonResponse<{ character: MapleCharacterDetail }>(
    await fetch(`/api/maple/characters/${encodeURIComponent(ocid)}`, {
      cache: "no-store",
    }),
  );

  return data.character;
}
