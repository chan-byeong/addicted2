import type { MapleStat } from "@/types/maple";

export type MapleCardStats = {
  combatPower: string | null;
  statAttackPower: string | null;
};

export type MapleSummaryStat = {
  label: string;
  value: string;
};

const STAT_CANDIDATES = {
  combatPower: ["전투력"],
  minStatAttack: ["최소 스탯공격력", "최소 스탯 공격력"],
  maxStatAttack: ["최대 스탯공격력", "최대 스탯 공격력"],
  hp: ["HP", "최대 HP"],
  mp: ["MP", "최대 MP"],
  str: ["STR"],
  dex: ["DEX"],
  int: ["INT"],
  luk: ["LUK"],
  damage: ["데미지"],
  finalDamage: ["최종 데미지"],
  bossDamage: ["보스 몬스터 데미지"],
  ignoreDefense: ["방어율 무시", "몬스터 방어율 무시"],
  attackPower: ["공격력"],
  magicPower: ["마력"],
} as const;

function normalizeStatName(name: string) {
  return name.replace(/\s/g, "").toLowerCase();
}

function findStat(stats: MapleStat[], candidates: readonly string[]) {
  const normalizedCandidates = candidates.map(normalizeStatName);
  const stat = stats.find((item) =>
    normalizedCandidates.some((candidate) =>
      normalizeStatName(item.name).includes(candidate),
    ),
  );

  return stat?.value || null;
}

function buildStatAttackPower(stats: MapleStat[]) {
  const minAttack = findStat(stats, STAT_CANDIDATES.minStatAttack);
  const maxAttack = findStat(stats, STAT_CANDIDATES.maxStatAttack);

  if (minAttack && maxAttack) {
    return `${minAttack} ~ ${maxAttack}`;
  }

  return minAttack || maxAttack;
}

export function buildMapleCardStats(stats: MapleStat[]): MapleCardStats {
  return {
    combatPower: findStat(stats, STAT_CANDIDATES.combatPower),
    statAttackPower: buildStatAttackPower(stats),
  };
}

export function buildMapleSummaryStats(stats: MapleStat[]): MapleSummaryStat[] {
  const cardStats = buildMapleCardStats(stats);

  return [
    { label: "전투력", value: cardStats.combatPower || "-" },
    { label: "스탯 공격력", value: cardStats.statAttackPower || "-" },
    { label: "HP", value: findStat(stats, STAT_CANDIDATES.hp) || "-" },
    { label: "MP", value: findStat(stats, STAT_CANDIDATES.mp) || "-" },
    { label: "STR", value: findStat(stats, STAT_CANDIDATES.str) || "-" },
    { label: "DEX", value: findStat(stats, STAT_CANDIDATES.dex) || "-" },
    { label: "INT", value: findStat(stats, STAT_CANDIDATES.int) || "-" },
    { label: "LUK", value: findStat(stats, STAT_CANDIDATES.luk) || "-" },
    { label: "데미지", value: findStat(stats, STAT_CANDIDATES.damage) || "-" },
    { label: "최종 데미지", value: findStat(stats, STAT_CANDIDATES.finalDamage) || "-" },
    { label: "보스 데미지", value: findStat(stats, STAT_CANDIDATES.bossDamage) || "-" },
    { label: "방어율 무시", value: findStat(stats, STAT_CANDIDATES.ignoreDefense) || "-" },
    { label: "공격력", value: findStat(stats, STAT_CANDIDATES.attackPower) || "-" },
    { label: "마력", value: findStat(stats, STAT_CANDIDATES.magicPower) || "-" },
  ];
}
