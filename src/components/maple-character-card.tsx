import Link from 'next/link';

import { Card } from '@/components/retroui/Card';
import type { MapleCharacter } from '@/types/maple';

type MapleCharacterCardProps = {
  character: MapleCharacter;
};

function formatUpdatedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '갱신 정보 없음';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getCardStats(character: MapleCharacter) {
  return [
    { label: '레벨', value: character.characterLevel?.toString() ?? '-' },
    { label: '직업', value: character.characterClass || '-' },
    character.combatPower ? { label: '전투력', value: character.combatPower } : null,
    character.statAttackPower ? { label: '스탯 공격력', value: character.statAttackPower } : null,
  ].filter((stat): stat is { label: string; value: string } => stat !== null);
}

export function MapleCharacterCard({ character }: MapleCharacterCardProps) {
  const stats = getCardStats(character);

  return (
    <Link
      href={`/maple/${encodeURIComponent(character.ocid)}`}
      className='maple-character-card-link'
    >
      <Card className='maple-character-card'>
        <div className='maple-character-card__portrait'>
          {character.characterImage ? (
            <img
              src={character.characterImage}
              alt={`${character.characterName} 캐릭터 이미지`}
              onError={(event) => {
                event.currentTarget.hidden = true;
              }}
            />
          ) : (
            <span aria-hidden='true'>?</span>
          )}
        </div>
        <div className='maple-character-card__body'>
          <div>
            <p className='maple-character-card__eyebrow'>{character.worldName || '월드 미확인'}</p>
            <h2>{character.characterName}</h2>
          </div>
          <dl className='maple-character-card__stats' data-testid='maple-character-card-stats'>
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt>{stat.label}</dt>
                <dd>{stat.value}</dd>
              </div>
            ))}
          </dl>
          <p className='maple-character-card__updated'>
            최근 갱신 {formatUpdatedAt(character.updatedAt)}
          </p>
        </div>
      </Card>
    </Link>
  );
}
