import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/maple-repository", () => ({
  isMissingMapleCharactersTableError: vi.fn(() => false),
  listMapleCharacters: vi.fn(),
  upsertMapleCharacter: vi.fn(),
}));

vi.mock("@/lib/nexon-maple", () => ({
  getMapleCharacterBasic: vi.fn(),
  getMapleCharacterCardStats: vi.fn(),
  getMapleCharacterOcid: vi.fn(),
  NexonMapleError: class NexonMapleError extends Error {
    status: number;

    constructor(message = "NEXON error", status = 500) {
      super(message);
      this.name = "NexonMapleError";
      this.status = status;
    }
  },
}));

const character = {
  id: "character-1",
  ocid: "ocid-1",
  characterName: "테스트캐릭",
  worldName: "스카니아",
  characterClass: "아델",
  characterLevel: 285,
  characterImage: "https://example.com/character.png",
  combatPower: null,
  statAttackPower: null,
  createdAt: "2026-07-02T00:00:00.000Z",
  updatedAt: "2026-07-02T00:00:00.000Z",
} as const;

describe("/api/maple/characters route", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service";
    process.env.NEXON_OPEN_API_KEY = "nexon";
  });

  it("adds card stat summaries to listed characters", async () => {
    const repo = await import("@/lib/maple-repository");
    const nexon = await import("@/lib/nexon-maple");
    vi.mocked(repo.listMapleCharacters).mockResolvedValue([character]);
    vi.mocked(nexon.getMapleCharacterCardStats).mockResolvedValue({
      combatPower: "87,654,321",
      statAttackPower: "1,234,567 ~ 2,345,678",
    });

    const { GET } = await import("@/app/api/maple/characters/route");
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      characters: [
        {
          ...character,
          combatPower: "87,654,321",
          statAttackPower: "1,234,567 ~ 2,345,678",
        },
      ],
    });
    expect(nexon.getMapleCharacterCardStats).toHaveBeenCalledWith("ocid-1");
  });

  it("keeps the character list available when card stat lookup fails", async () => {
    const repo = await import("@/lib/maple-repository");
    const nexon = await import("@/lib/nexon-maple");
    vi.mocked(repo.listMapleCharacters).mockResolvedValue([character]);
    vi.mocked(nexon.getMapleCharacterCardStats).mockRejectedValue(
      new Error("NEXON unavailable"),
    );

    const { GET } = await import("@/app/api/maple/characters/route");
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      characters: [character],
    });
  });
});
