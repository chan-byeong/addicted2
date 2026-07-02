'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { DateNav } from '@/components/date-nav';
import { FilterBar } from '@/components/filter-bar';
import { ItemFormDialog } from '@/components/item-form-dialog';
import { LinkCard } from '@/components/link-card';
import { RoughAnnotation } from '@/components/rough-annotation';
import { Button } from '@/components/retroui/Button';
import { Card } from '@/components/retroui/Card';
import { Text } from '@/components/retroui/Text';
import { fetchItems } from '@/lib/api-client';
import { getTodayKey } from '@/lib/date';
import { archiveQueryKeys } from '@/lib/query-keys';
import type { ArchiveItem, SourceType } from '@/types/archive';

export function ArchiveApp() {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(() => getTodayKey());
  const [query, setQuery] = useState('');
  const [sourceType, setSourceType] = useState<SourceType | 'all'>('all');
  const [message, setMessage] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ArchiveItem | null>(null);

  const listParams = useMemo(
    () => ({ date, query, sourceType, limit: 50 }),
    [date, query, sourceType]
  );

  const recentParams = useMemo(() => ({ sourceType: 'all' as const, limit: 5 }), []);

  const itemsQuery = useQuery({
    queryKey: archiveQueryKeys.items(listParams),
    queryFn: () => fetchItems(listParams),
  });

  const recentItemsQuery = useQuery({
    queryKey: archiveQueryKeys.items(recentParams),
    queryFn: () => fetchItems(recentParams),
  });

  const items = itemsQuery.data ?? [];
  const recentItems = recentItemsQuery.data ?? [];
  const isLoading = itemsQuery.isPending || recentItemsQuery.isPending;
  const queryError = itemsQuery.error || recentItemsQuery.error;
  const statusMessage =
    message ||
    (queryError instanceof Error
      ? queryError.message
      : queryError
      ? '목록을 불러오지 못했습니다.'
      : null);

  const refreshItems = useCallback(async () => {
    setMessage(null);
    await queryClient.invalidateQueries({
      queryKey: archiveQueryKeys.itemsRoot,
    });
  }, [queryClient]);

  return (
    <main className='page-shell'>
      <header className='site-header'>
        <Card className='site-header__top'>
          <div className='site-header__copy'>
            <Text as='h1'>
              <RoughAnnotation testId='brand-annotation'>Addicted2Community</RoughAnnotation>
            </Text>
            <Text as='p'>상식인으로 거듭나기위한 커뮤/쇼츠/릴스 아카이브</Text>
          </div>
          <Button
            type='button'
            size='sm'
            onClick={() => {
              setEditingItem(null);
              setIsDialogOpen(true);
            }}
          >
            등록
          </Button>
        </Card>
      </header>

      {statusMessage ? <p className='status-message error'>{statusMessage}</p> : null}

      <DateNav date={date} onDateChange={setDate} />
      <FilterBar
        query={query}
        sourceType={sourceType}
        onQueryChange={setQuery}
        onSourceTypeChange={setSourceType}
      />

      <section className='section-block' aria-labelledby='daily-links-title'>
        <h2 id='daily-links-title'>{date} 링크</h2>
        {isLoading ? <p className='empty-state'>불러오는 중입니다.</p> : null}
        {!isLoading && items.length === 0 ? (
          <p className='empty-state'>이 날짜에 등록된 링크가 없습니다.</p>
        ) : null}
        <div className='link-list'>
          {items.map((item, index) => (
            <LinkCard
              key={item.id}
              item={item}
              emphasizeTitle={index === 0}
              // onEdit={(nextItem) => {
              //   setEditingItem(nextItem);
              //   setIsDialogOpen(true);
              // }}
              // onDelete={async (nextItem) => {
              //   const password = window.prompt('공용 비밀번호를 입력하세요.');
              //   if (!password) return;

              //   if (!window.confirm('이 링크를 삭제할까요?')) return;

              //   try {
              //     await deleteItem(nextItem.id, password);
              //     await refreshItems();
              //   } catch (error) {
              //     setMessage(error instanceof Error ? error.message : '삭제하지 못했습니다.');
              //   }
              // }}
            />
          ))}
        </div>
      </section>

      {isDialogOpen ? (
        <ItemFormDialog
          key={editingItem ? `edit-${editingItem.id}` : `create-${date}`}
          mode={editingItem ? 'edit' : 'create'}
          item={editingItem}
          date={date}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSaved={refreshItems}
        />
      ) : null}
    </main>
  );
}
