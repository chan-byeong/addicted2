import type { ItemListParams } from "@/types/archive";

export const archiveQueryKeys = {
  itemsRoot: ["items"] as const,
  items(params: ItemListParams) {
    return ["items", normalizeItemListParams(params)] as const;
  },
  metadata(url: string) {
    return ["metadata", url.trim()] as const;
  },
};

export const mapleQueryKeys = {
  charactersRoot: ["maple", "characters"] as const,
  characters() {
    return ["maple", "characters"] as const;
  },
  character(ocid: string) {
    return ["maple", "characters", ocid.trim()] as const;
  },
};

function normalizeItemListParams(params: ItemListParams) {
  return {
    date: params.date || undefined,
    query: params.query || undefined,
    sourceType: params.sourceType || undefined,
    limit: params.limit || undefined,
  };
}
