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
import type { ArchiveFilterType, ArchiveItem } from '@/types/archive';

export function ArchiveApp() {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(() => getTodayKey());
  const [query, setQuery] = useState('');
  const [sourceType, setSourceType] = useState<ArchiveFilterType | 'all'>('all');
  const [message, setMessage] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ArchiveItem | null>(null);

  const isGlobalView = query.trim().length > 0 || sourceType !== 'all';
  const listParams = useMemo(
    () => ({
      date: isGlobalView ? undefined : date,
      query,
      sourceType,
      limit: 50,
    }),
    [date, isGlobalView, query, sourceType]
  );

  const itemsQuery = useQuery({
    queryKey: archiveQueryKeys.items(listParams),
    queryFn: () => fetchItems(listParams),
  });

  const items = itemsQuery.data ?? [];
  const isLoading = itemsQuery.isPending;
  const queryError = itemsQuery.error;
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
            <Text as='p'>링크와 사진, 동영상을 함께 모으는 단톡방 아카이브</Text>
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

      <section className='section-block' aria-labelledby='archive-items-title'>
        <h2 id='archive-items-title'>
          {isGlobalView ? '전체 아카이브 결과' : `${date} 아카이브`}
        </h2>
        {isLoading ? <p className='empty-state'>불러오는 중입니다.</p> : null}
        {!isLoading && items.length === 0 ? (
          <p className='empty-state'>
            {isGlobalView
              ? '조건에 맞는 아카이브 항목이 없습니다.'
              : '이 날짜에 등록된 항목이 없습니다.'}
          </p>
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
