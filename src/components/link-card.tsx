import { useId, useState } from 'react';

import { RoughAnnotation } from '@/components/rough-annotation';
import { Button } from '@/components/retroui/Button';
import { Card } from '@/components/retroui/Card';
import type { ArchiveItem } from '@/types/archive';

type LinkCardProps = {
  item: ArchiveItem;
  emphasizeTitle?: boolean;
  onEdit?: (item: ArchiveItem) => void;
  onDelete?: (item: ArchiveItem) => void;
};

const SOURCE_LABELS: Record<ArchiveItem['sourceType'], string> = {
  youtube: '유튜브',
  shorts: '쇼츠',
  community: '커뮤니티',
  other: '기타',
};

function getHostname(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function LinkCard({ item, emphasizeTitle = false, onEdit, onDelete }: LinkCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const [isNoteExpanded, setIsNoteExpanded] = useState(false);
  const noteId = useId();
  const createdAt = new Date(item.createdAt).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Card className='link-card' role='article'>
      {item.note ? (
        <button
          type='button'
          className='link-card__toggle'
          aria-expanded={isNoteExpanded}
          aria-controls={noteId}
          aria-label={`${item.title} 메모 ${isNoteExpanded ? '접기' : '펼치기'}`}
          onClick={() => setIsNoteExpanded((expanded) => !expanded)}
        />
      ) : null}
      {item.imageUrl && !imageFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.imageUrl}
          alt=""
          className="link-card__thumb"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className='link-card__glyph' aria-hidden='true'>
          <svg viewBox='0 0 72 72'>
            <path d='M18 42c0-13 7-24 19-25 11-1 18 8 17 20-1 15-10 22-22 20-9-1-14-7-14-15Z' />
            <path d='M31 32c5-3 10-3 15 0M28 43c6 6 16 7 23 0' />
          </svg>
        </div>
      )}
      <div className='link-card__body'>
        <a href={item.url} target='_blank' rel='noreferrer' className='link-title'>
          {emphasizeTitle ? (
            <RoughAnnotation type='underline'>{item.title}</RoughAnnotation>
          ) : (
            item.title
          )}
        </a>
        <div className='link-meta'>
          <span>{item.siteName || getHostname(item.url)}</span>
          <span>{SOURCE_LABELS[item.sourceType]}</span>
          <span>{item.authorName}</span>
          <span>{createdAt}</span>
        </div>
        {item.description ? <p>{item.description}</p> : null}
        {item.note ? (
          <p
            id={noteId}
            className={`link-note${isNoteExpanded ? ' is-expanded' : ''}`}
          >
            {item.note}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
