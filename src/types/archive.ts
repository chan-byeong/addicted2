export const SOURCE_TYPES = ["youtube", "shorts", "community", "other"] as const;
export const CONTENT_TYPES = ["link", "image", "video"] as const;
export const ARCHIVE_FILTER_TYPES = [
  ...SOURCE_TYPES,
  "image",
  "video",
] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];
export type ContentType = (typeof CONTENT_TYPES)[number];
export type ArchiveFilterType = (typeof ARCHIVE_FILTER_TYPES)[number];

export type ArchiveItem = {
  id: string;
  url: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  siteName: string | null;
  sourceType: SourceType;
  contentType: ContentType;
  storagePath: string | null;
  mediaMimeType: string | null;
  mediaSize: number | null;
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
  content_type: ContentType;
  storage_path: string | null;
  media_mime_type: string | null;
  media_size: number | null;
  note: string | null;
  author_name: string;
  entry_date: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type ArchiveItemInput = {
  contentType?: ContentType;
  url: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  siteName?: string | null;
  sourceType: SourceType;
  storagePath?: string | null;
  mediaMimeType?: string | null;
  mediaSize?: number | null;
  note?: string | null;
  authorName: string;
  entryDate: string;
};

export type ArchiveItemUpdateInput = Partial<ArchiveItemInput>;

type CreateArchiveItemBase = {
  note?: string | null;
  authorName: string;
  entryDate: string;
};

export type CreateLinkItemRequest = CreateArchiveItemBase & {
  contentType?: "link";
  url: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  siteName?: string | null;
  sourceType: SourceType;
};

export type CreateMediaItemRequest = CreateArchiveItemBase & {
  contentType: "image" | "video";
  storagePath: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
};

export type CreateArchiveItemRequest =
  | CreateLinkItemRequest
  | CreateMediaItemRequest;

export type ItemListParams = {
  date?: string;
  query?: string;
  sourceType?: ArchiveFilterType | "all";
  limit?: number;
};
