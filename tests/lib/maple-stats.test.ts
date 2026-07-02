import { describe, expect, it } from "vitest";

import { buildMapleCardStats, buildMapleSummaryStats } from "@/lib/maple-stats";
import type { MapleStat } from "@/types/maple";

const finalStats = [
  { name: "전투력", value: "87,654,321" },
  { name: "최소 스탯공격력", value: "1,234,567" },
  { name: "최대 스탯공격력", value: "2,345,678" },
  { name: "HP", value: "99,999" },
] satisfies MapleStat[];

describe("maple stat helpers", () => {
  it("builds card stats from combat power and stat attack range", () => {
    expect(buildMapleCardStats(finalStats)).toEqual({
      combatPower: "87,654,321",
      statAttackPower: "1,234,567 ~ 2,345,678",
    });
  });

  it("uses a single stat attack value when only one side of the range is present", () => {
    expect(
      buildMapleCardStats([{ name: "최대 스탯 공격력", value: "9,999" }]),
    ).toEqual({
      combatPower: null,
      statAttackPower: "9,999",
    });
  });

  it("builds detail summary stats with fallbacks", () => {
    expect(buildMapleSummaryStats(finalStats).slice(0, 4)).toEqual([
      { label: "전투력", value: "87,654,321" },
      { label: "스탯 공격력", value: "1,234,567 ~ 2,345,678" },
      { label: "HP", value: "99,999" },
      { label: "MP", value: "-" },
    ]);
  });
});
