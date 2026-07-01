import type { ArchiveItem } from "@/types/archive";

type LinkCardProps = {
  item: ArchiveItem;
  onEdit?: (item: ArchiveItem) => void;
  onDelete?: (item: ArchiveItem) => void;
};

function getHostname(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function LinkCard({ item, onEdit, onDelete }: LinkCardProps) {
  const createdAt = new Date(item.createdAt).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article className="link-card">
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imageUrl} alt="" className="link-card__thumb" />
      ) : null}
      <div className="link-card__body">
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="link-title"
        >
          {item.title}
        </a>
        <div className="link-meta">
          <span>{item.siteName || getHostname(item.url)}</span>
          <span>{item.sourceType}</span>
          <span>{item.authorName}</span>
          <span>{createdAt}</span>
        </div>
        {item.description ? <p>{item.description}</p> : null}
        {item.note ? <p className="link-note">{item.note}</p> : null}
        <div className="link-actions">
          {onEdit ? (
            <button type="button" onClick={() => onEdit(item)}>
              수정
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              className="danger"
              onClick={() => onDelete(item)}
            >
              삭제
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
