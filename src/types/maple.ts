export type MapleCharacter = {
  id: string;
  ocid: string;
  characterName: string;
  worldName: string | null;
  characterClass: string | null;
  characterLevel: number | null;
  characterImage: string | null;
  combatPower: string | null;
  statAttackPower: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MapleCharacterRow = {
  id: string;
  ocid: string;
  character_name: string;
  world_name: string | null;
  character_class: string | null;
  character_level: number | null;
  character_image: string | null;
  created_at: string;
  updated_at: string;
};

export type MapleCharacterUpsertInput = {
  ocid: string;
  characterName: string;
  worldName?: string | null;
  characterClass?: string | null;
  characterLevel?: number | null;
  characterImage?: string | null;
};

export type MapleStat = {
  name: string;
  value: string;
};

export type MapleEquipmentOption = {
  str?: string;
  dex?: string;
  int?: string;
  luk?: string;
  maxHp?: string;
  maxMp?: string;
  attackPower?: string;
  magicPower?: string;
  bossDamage?: string;
  ignoreMonsterArmor?: string;
  allStat?: string;
  damage?: string;
};

export type MapleEquipmentItem = {
  part: string;
  slot: string;
  name: string;
  icon: string | null;
  description: string | null;
  starforce: string | null;
  scrollUpgrade: string | null;
  potentialGrade: string | null;
  additionalPotentialGrade: string | null;
  potentialOptions: string[];
  additionalPotentialOptions: string[];
  totalOption: MapleEquipmentOption;
  addOption: MapleEquipmentOption;
  starforceOption: MapleEquipmentOption;
};

export type MapleCharacterDetail = {
  ocid: string;
  basic: {
    date: string | null;
    characterName: string;
    worldName: string | null;
    characterGender: string | null;
    characterClass: string | null;
    characterClassLevel: string | null;
    characterLevel: number | null;
    characterExpRate: string | null;
    characterGuildName: string | null;
    characterImage: string | null;
  };
  stat: {
    date: string | null;
    characterClass: string | null;
    finalStats: MapleStat[];
    remainAp: number | null;
  };
  equipment: {
    date: string | null;
    characterClass: string | null;
    presetNo: number | null;
    items: MapleEquipmentItem[];
  };
};
