"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { DateNav } from "@/components/date-nav";
import { FilterBar } from "@/components/filter-bar";
import { LinkCard } from "@/components/link-card";
import { RecentLinks } from "@/components/recent-links";
import { fetchItems } from "@/lib/api-client";
import { getTodayKey } from "@/lib/date";
import type { ArchiveItem, SourceType } from "@/types/archive";

export function ArchiveApp() {
  const [date, setDate] = useState(() => getTodayKey());
  const [query, setQuery] = useState("");
  const [sourceType, setSourceType] = useState<SourceType | "all">("all");
  const [items, setItems] = useState<ArchiveItem[]>([]);
  const [recentItems, setRecentItems] = useState<ArchiveItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const listParams = useMemo(
    () => ({ date, query, sourceType, limit: 50 }),
    [date, query, sourceType],
  );

  const loadItems = useCallback(async (isActive: () => boolean) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const [nextItems, nextRecentItems] = await Promise.all([
        fetchItems(listParams),
        fetchItems({ sourceType: "all", limit: 5 }),
      ]);
      if (!isActive()) return;
      setItems(nextItems);
      setRecentItems(nextRecentItems);
    } catch (error) {
      if (!isActive()) return;
      setMessage(
        error instanceof Error ? error.message : "목록을 불러오지 못했습니다.",
      );
    } finally {
      if (isActive()) setIsLoading(false);
    }
  }, [listParams]);

  useEffect(() => {
    let isActive = true;
    const timeoutId = window.setTimeout(() => {
      void loadItems(() => isActive);
    }, 0);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [loadItems]);

  return (
    <main className="page-shell">
      <header className="site-header">
        <div>
          <h1>단톡 링크 아카이브</h1>
          <p>오늘 본 재밌고 유익한 링크를 날짜별로 모읍니다.</p>
        </div>
        <button type="button" className="primary-button">
          등록
        </button>
      </header>

      {message ? <p className="status-message error">{message}</p> : null}

      <DateNav date={date} onDateChange={setDate} />
      <FilterBar
        query={query}
        sourceType={sourceType}
        onQueryChange={setQuery}
        onSourceTypeChange={setSourceType}
      />

      <section className="section-block" aria-labelledby="daily-links-title">
        <h2 id="daily-links-title">{date} 링크</h2>
        {isLoading ? <p className="empty-state">불러오는 중입니다.</p> : null}
        {!isLoading && items.length === 0 ? (
          <p className="empty-state">이 날짜에 등록된 링크가 없습니다.</p>
        ) : null}
        <div className="link-list">
          {items.map((item) => (
            <LinkCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <RecentLinks items={recentItems} />
    </main>
  );
}
