import { LinkCard } from "@/components/link-card";
import type { ArchiveItem } from "@/types/archive";

type RecentLinksProps = {
  items: ArchiveItem[];
};

export function RecentLinks({ items }: RecentLinksProps) {
  return (
    <section className="section-block" aria-labelledby="recent-links-title">
      <h2 id="recent-links-title">최근 링크</h2>
      <div className="link-list compact">
        {items.length ? (
          items.map((item) => <LinkCard key={item.id} item={item} />)
        ) : (
          <p className="empty-state">최근 등록된 링크가 없습니다.</p>
        )}
      </div>
    </section>
  );
}
