import { SOURCE_TYPES, type SourceType } from "@/types/archive";

type FilterBarProps = {
  query: string;
  sourceType: SourceType | "all";
  onQueryChange: (query: string) => void;
  onSourceTypeChange: (sourceType: SourceType | "all") => void;
};

const LABELS: Record<SourceType | "all", string> = {
  all: "전체",
  youtube: "유튜브",
  shorts: "쇼츠",
  community: "커뮤니티",
  other: "기타",
};

export function FilterBar({
  query,
  sourceType,
  onQueryChange,
  onSourceTypeChange,
}: FilterBarProps) {
  return (
    <section className="filter-bar" aria-label="링크 필터">
      <input
        aria-label="검색어"
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />
      <select
        aria-label="타입 필터"
        value={sourceType}
        onChange={(event) =>
          onSourceTypeChange(event.target.value as SourceType | "all")
        }
      >
        {(["all", ...SOURCE_TYPES] as const).map((type) => (
          <option key={type} value={type}>
            {LABELS[type]}
          </option>
        ))}
      </select>
    </section>
  );
}
