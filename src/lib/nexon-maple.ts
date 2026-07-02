import "server-only";

import { buildMapleCardStats } from "@/lib/maple-stats";
import { getNexonEnv } from "@/lib/env";
import type {
  MapleCharacterDetail,
  MapleEquipmentItem,
  MapleEquipmentOption,
  MapleStat,
} from "@/types/maple";

const NEXON_BASE_URL = "https://open.api.nexon.com";

type NexonErrorBody = {
  error?: {
    name?: string;
    message?: string;
  };
};

type NexonCharacterIdResponse = {
  ocid?: string;
};

type NexonBasicResponse = {
  date?: string | null;
  character_name?: string | null;
  world_name?: string | null;
  character_gender?: string | null;
  character_class?: string | null;
  character_class_level?: string | null;
  character_level?: number | null;
  character_exp_rate?: string | null;
  character_guild_name?: string | null;
  character_image?: string | null;
};

type NexonStatResponse = {
  date?: string | null;
  character_class?: string | null;
  final_stat?: Array<{
    stat_name?: string | null;
    stat_value?: string | null;
  }> | null;
  remain_ap?: number | null;
};

type NexonOptionResponse = {
  str?: string | null;
  dex?: string | null;
  int?: string | null;
  luk?: string | null;
  max_hp?: string | null;
  max_mp?: string | null;
  attack_power?: string | null;
  magic_power?: string | null;
  boss_damage?: string | null;
  ignore_monster_armor?: string | null;
  all_stat?: string | null;
  damage?: string | null;
};

type NexonEquipmentResponse = {
  date?: string | null;
  character_class?: string | null;
  preset_no?: number | null;
  item_equipment?: Array<{
    item_equipment_part?: string | null;
    item_equipment_slot?: string | null;
    item_name?: string | null;
    item_icon?: string | null;
    item_description?: string | null;
    item_total_option?: NexonOptionResponse | null;
    item_add_option?: NexonOptionResponse | null;
    item_starforce_option?: NexonOptionResponse | null;
    starforce?: string | null;
    scroll_upgrade?: string | null;
    potential_option_grade?: string | null;
    additional_potential_option_grade?: string | null;
    potential_option_1?: string | null;
    potential_option_2?: string | null;
    potential_option_3?: string | null;
    additional_potential_option_1?: string | null;
    additional_potential_option_2?: string | null;
    additional_potential_option_3?: string | null;
  }> | null;
};

export class NexonMapleError extends Error {
  status: number;
  nexonName?: string;

  constructor({
    message,
    status,
    nexonName,
  }: {
    message: string;
    status: number;
    nexonName?: string;
  }) {
    super(message);
    this.name = "NexonMapleError";
    this.status = status;
    this.nexonName = nexonName;
  }
}

function buildNexonUrl(path: string, params: Record<string, string | undefined>) {
  const url = new URL(path, NEXON_BASE_URL);

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  return url;
}

async function parseNexonError(response: Response) {
  const data = (await response.json().catch(() => ({}))) as NexonErrorBody;
  const message = data.error?.message || "메이플 정보를 불러오지 못했습니다.";

  return new NexonMapleError({
    message,
    status: response.status,
    nexonName: data.error?.name,
  });
}

async function fetchNexon<T>(path: string, params: Record<string, string | undefined>) {
  const { nexonOpenApiKey } = getNexonEnv();
  const response = await fetch(buildNexonUrl(path, params), {
    headers: {
      "x-nxopen-api-key": nexonOpenApiKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw await parseNexonError(response);
  }

  return (await response.json()) as T;
}

function nullableText(value: string | null | undefined) {
  return value && value.length > 0 ? value : null;
}

function mapOption(option: NexonOptionResponse | null | undefined): MapleEquipmentOption {
  return {
    str: nullableText(option?.str) ?? undefined,
    dex: nullableText(option?.dex) ?? undefined,
    int: nullableText(option?.int) ?? undefined,
    luk: nullableText(option?.luk) ?? undefined,
    maxHp: nullableText(option?.max_hp) ?? undefined,
    maxMp: nullableText(option?.max_mp) ?? undefined,
    attackPower: nullableText(option?.attack_power) ?? undefined,
    magicPower: nullableText(option?.magic_power) ?? undefined,
    bossDamage: nullableText(option?.boss_damage) ?? undefined,
    ignoreMonsterArmor: nullableText(option?.ignore_monster_armor) ?? undefined,
    allStat: nullableText(option?.all_stat) ?? undefined,
    damage: nullableText(option?.damage) ?? undefined,
  };
}

function mapStats(stats: NexonStatResponse["final_stat"]): MapleStat[] {
  return (stats ?? [])
    .map((stat) => ({
      name: nullableText(stat.stat_name) ?? "",
      value: nullableText(stat.stat_value) ?? "",
    }))
    .filter((stat) => stat.name.length > 0 && stat.value.length > 0);
}

function mapPotentialOptions(...options: Array<string | null | undefined>) {
  return options.filter((option): option is string => Boolean(nullableText(option)));
}

function mapEquipmentItem(
  item: NonNullable<NexonEquipmentResponse["item_equipment"]>[number],
): MapleEquipmentItem {
  return {
    part: nullableText(item.item_equipment_part) ?? "장비",
    slot: nullableText(item.item_equipment_slot) ?? "기타",
    name: nullableText(item.item_name) ?? "이름 없는 장비",
    icon: nullableText(item.item_icon),
    description: nullableText(item.item_description),
    starforce: nullableText(item.starforce),
    scrollUpgrade: nullableText(item.scroll_upgrade),
    potentialGrade: nullableText(item.potential_option_grade),
    additionalPotentialGrade: nullableText(item.additional_potential_option_grade),
    potentialOptions: mapPotentialOptions(
      item.potential_option_1,
      item.potential_option_2,
      item.potential_option_3,
    ),
    additionalPotentialOptions: mapPotentialOptions(
      item.additional_potential_option_1,
      item.additional_potential_option_2,
      item.additional_potential_option_3,
    ),
    totalOption: mapOption(item.item_total_option),
    addOption: mapOption(item.item_add_option),
    starforceOption: mapOption(item.item_starforce_option),
  };
}

export async function getMapleCharacterOcid(characterName: string) {
  const data = await fetchNexon<NexonCharacterIdResponse>("/maplestory/v1/id", {
    character_name: characterName,
  });

  if (!data.ocid) {
    throw new NexonMapleError({
      message: "캐릭터를 찾을 수 없습니다.",
      status: 404,
    });
  }

  return data.ocid;
}

export async function getMapleCharacterBasic(ocid: string) {
  const data = await fetchNexon<NexonBasicResponse>("/maplestory/v1/character/basic", {
    ocid,
  });

  return {
    date: nullableText(data.date),
    characterName: nullableText(data.character_name) ?? "",
    worldName: nullableText(data.world_name),
    characterGender: nullableText(data.character_gender),
    characterClass: nullableText(data.character_class),
    characterClassLevel: nullableText(data.character_class_level),
    characterLevel: data.character_level ?? null,
    characterExpRate: nullableText(data.character_exp_rate),
    characterGuildName: nullableText(data.character_guild_name),
    characterImage: nullableText(data.character_image),
  };
}

export async function getMapleCharacterCardStats(ocid: string) {
  const data = await fetchNexon<NexonStatResponse>("/maplestory/v1/character/stat", {
    ocid,
  });

  return buildMapleCardStats(mapStats(data.final_stat));
}

export async function getMapleCharacterDetail(
  ocid: string,
): Promise<MapleCharacterDetail> {
  const [basic, statData, equipmentData] = await Promise.all([
    getMapleCharacterBasic(ocid),
    fetchNexon<NexonStatResponse>("/maplestory/v1/character/stat", { ocid }),
    fetchNexon<NexonEquipmentResponse>("/maplestory/v1/character/item-equipment", {
      ocid,
    }),
  ]);

  return {
    ocid,
    basic,
    stat: {
      date: nullableText(statData.date),
      characterClass: nullableText(statData.character_class),
      finalStats: mapStats(statData.final_stat),
      remainAp: statData.remain_ap ?? null,
    },
    equipment: {
      date: nullableText(equipmentData.date),
      characterClass: nullableText(equipmentData.character_class),
      presetNo: equipmentData.preset_no ?? null,
      items: (equipmentData.item_equipment ?? []).map(mapEquipmentItem),
    },
  };
}
