import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MapleCharacterCard } from "@/components/maple-character-card";
import type { MapleCharacter } from "@/types/maple";

const character = {
  id: "character-1",
  ocid: "ocid-1",
  characterName: "테스트캐릭",
  worldName: "스카니아",
  characterClass: "아델",
  characterLevel: 285,
  characterImage: "https://example.com/character.png",
  combatPower: "87,654,321",
  statAttackPower: "1,234,567 ~ 2,345,678",
  createdAt: "2026-07-02T00:00:00.000Z",
  updatedAt: "2026-07-02T00:00:00.000Z",
} satisfies MapleCharacter;

describe("MapleCharacterCard", () => {
  it("renders combat power and stat attack power on the card", () => {
    render(<MapleCharacterCard character={character} />);

    const stats = screen.getByTestId("maple-character-card-stats");

    expect(within(stats).getByText("전투력")).toBeInTheDocument();
    expect(within(stats).getByText("87,654,321")).toBeInTheDocument();
    expect(within(stats).getByText("스탯 공격력")).toBeInTheDocument();
    expect(within(stats).getByText("1,234,567 ~ 2,345,678")).toBeInTheDocument();
  });
});
