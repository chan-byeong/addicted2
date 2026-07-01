export const SOURCE_TYPES = ["youtube", "shorts", "community", "other"] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];

export type ArchiveItem = {
  id: string;
  url: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  siteName: string | null;
  sourceType: SourceType;
  note: string | null;
  authorName: string;
  entryDate: string;
  createdAt: string;
  updatedAt: string;
};

export type ArchiveItemRow = {
  id: string;
  url: string;
  title: string;
  description: string | null;
  image_url: string | null;
  site_name: string | null;
  source_type: SourceType;
  note: string | null;
  author_name: string;
  entry_date: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type ArchiveItemInput = {
  url: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  siteName?: string | null;
  sourceType: SourceType;
  note?: string | null;
  authorName: string;
  entryDate: string;
};

export type ArchiveItemUpdateInput = Partial<ArchiveItemInput>;

export type ItemListParams = {
  date?: string;
  query?: string;
  sourceType?: SourceType | "all";
  limit?: number;
};
