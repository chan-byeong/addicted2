import { Input } from "@/components/retroui/Input";
import { Select } from "@/components/retroui/Select";
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
      <Input
        aria-label="검색어"
        placeholder="뭐 찾음?"
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />
      <Select
        value={sourceType}
        onValueChange={(value) =>
          onSourceTypeChange(value as SourceType | "all")
        }
      >
        <Select.Trigger aria-label="타입 필터" className="w-full">
          <Select.Value>{LABELS[sourceType]}</Select.Value>
        </Select.Trigger>
        <Select.Content>
          <Select.Group>
            {(["all", ...SOURCE_TYPES] as const).map((type) => (
              <Select.Item key={type} value={type}>
                {LABELS[type]}
              </Select.Item>
            ))}
          </Select.Group>
        </Select.Content>
      </Select>
    </section>
  );
}
