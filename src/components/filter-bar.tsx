import { Input } from '@/components/retroui/Input';
import { Select } from '@/components/retroui/Select';
import {
  ARCHIVE_FILTER_TYPES,
  type ArchiveFilterType,
} from '@/types/archive';

type FilterBarProps = {
  query: string;
  sourceType: ArchiveFilterType | 'all';
  onQueryChange: (query: string) => void;
  onSourceTypeChange: (sourceType: ArchiveFilterType | 'all') => void;
};

const LABELS: Record<ArchiveFilterType | 'all', string> = {
  all: '전체',
  youtube: '유튜브',
  shorts: '쇼츠',
  community: '커뮤니티',
  other: '기타',
  image: '사진',
  video: '동영상',
};

export function FilterBar({
  query,
  sourceType,
  onQueryChange,
  onSourceTypeChange,
}: FilterBarProps) {
  return (
    <section className='filter-bar' aria-label='아카이브 필터'>
      <Input
        aria-label='검색어'
        placeholder='전체 아카이브에서 찾기'
        type='search'
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />
      <Select
        value={sourceType}
        onValueChange={(value) =>
          onSourceTypeChange(value as ArchiveFilterType | 'all')
        }
      >
        <Select.Trigger aria-label='타입 필터' className='w-full'>
          <Select.Value>{LABELS[sourceType]}</Select.Value>
        </Select.Trigger>
        <Select.Content>
          <Select.Group>
            {(['all', ...ARCHIVE_FILTER_TYPES] as const).map((type) => (
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
