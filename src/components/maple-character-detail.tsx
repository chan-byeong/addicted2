'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Button } from '@/components/retroui/Button';
import { Card } from '@/components/retroui/Card';
import { useMapleCharacter } from '@/hooks/use-maple-characters';
import { buildMapleSummaryStats } from '@/lib/maple-stats';
import type { MapleCharacterDetail, MapleEquipmentItem, MapleEquipmentOption } from '@/types/maple';

type MapleCharacterDetailProps = {
  ocid: string;
};

const OPTION_LABELS: Array<[keyof MapleEquipmentOption, string]> = [
  ['str', 'STR'],
  ['dex', 'DEX'],
  ['int', 'INT'],
  ['luk', 'LUK'],
  ['maxHp', 'HP'],
  ['maxMp', 'MP'],
  ['attackPower', '공격력'],
  ['magicPower', '마력'],
  ['bossDamage', '보공'],
  ['ignoreMonsterArmor', '방무'],
  ['allStat', '올스탯'],
  ['damage', '데미지'],
];

function getOptionRows(option: MapleEquipmentOption) {
  return OPTION_LABELS.map(([key, label]) => ({ label, value: option[key] })).filter(
    (row): row is { label: string; value: string } => Boolean(row.value)
  );
}

function EquipmentDetail({ item }: { item: MapleEquipmentItem }) {
  const totalOptionRows = getOptionRows(item.totalOption);
  const addOptionRows = getOptionRows(item.addOption);
  const starforceOptionRows = getOptionRows(item.starforceOption);

  return (
    <Card className='maple-equipment-detail'>
      <div className='maple-equipment-detail__heading'>
        <div>
          <p>{item.slot}</p>
          <h3>{item.name}</h3>
        </div>
        {item.icon ? (
          <img
            src={item.icon}
            alt={`${item.name} 아이콘`}
            onError={(event) => {
              event.currentTarget.hidden = true;
            }}
          />
        ) : null}
      </div>

      <dl className=''>
        <div>
          <dt>스타포스</dt>
          <dd>{item.starforce ? `${item.starforce}성` : '-'}</dd>
        </div>
        <div>
          <dt>주문서</dt>
          <dd>{item.scrollUpgrade || '-'}</dd>
        </div>
        <div>
          <dt>잠재</dt>
          <dd>{item.potentialGrade || '-'}</dd>
        </div>
        <div>
          <dt>에디</dt>
          <dd>{item.additionalPotentialGrade || '-'}</dd>
        </div>
      </dl>

      {item.potentialOptions.length > 0 ? (
        <div className='maple-equipment-detail__block'>
          <h4>잠재 옵션</h4>
          <ul>
            {item.potentialOptions.map((option) => (
              <li key={option}>{option}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {item.additionalPotentialOptions.length > 0 ? (
        <div className='maple-equipment-detail__block'>
          <h4>에디셔널 옵션</h4>
          <ul>
            {item.additionalPotentialOptions.map((option) => (
              <li key={option}>{option}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className='maple-equipment-detail__columns'>
        <OptionGroup title='최종 옵션' rows={totalOptionRows} />
        <OptionGroup title='추가 옵션' rows={addOptionRows} />
        <OptionGroup title='스타포스 옵션' rows={starforceOptionRows} />
      </div>
    </Card>
  );
}

function OptionGroup({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: string }>;
}) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <div className='maple-equipment-detail__block'>
      <h4>{title}</h4>
      <dl>
        {rows.map((row) => (
          <div key={`${title}-${row.label}`}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function MapleCharacterDetail({ ocid }: MapleCharacterDetailProps) {
  const [selectedEquipmentIndex, setSelectedEquipmentIndex] = useState(0);
  const characterQuery = useMapleCharacter(ocid);
  const character = characterQuery.data;
  const summaryStats = useMemo(
    () => (character ? buildMapleSummaryStats(character.stat.finalStats) : []),
    [character]
  );
  const selectedEquipment =
    character?.equipment.items[selectedEquipmentIndex] ?? character?.equipment.items[0] ?? null;

  if (characterQuery.isPending) {
    return (
      <main className='maple-page-shell wide'>
        <p className='maple-empty-state'>캐릭터 정보를 불러오는 중입니다.</p>
      </main>
    );
  }

  if (characterQuery.error || !character) {
    return (
      <main className='maple-page-shell wide'>
        <p className='maple-status-message error'>
          {characterQuery.error instanceof Error
            ? characterQuery.error.message
            : '캐릭터 정보를 불러오지 못했습니다.'}
        </p>
        <Button render={<Link href='/maple' />}>목록으로</Button>
      </main>
    );
  }

  return (
    <main className='maple-page-shell wide'>
      <nav className='maple-detail-nav'>
        {/* <Button variant="outline" render={<Link href="/maple" />}>
          목록
        </Button> */}
      </nav>

      <section className='maple-detail-layout' aria-labelledby='maple-detail-title'>
        <Card className='maple-profile-panel grid-cols-2 '>
          <div className='maple-profile-panel__image'>
            {character.basic.characterImage ? (
              <img
                src={character.basic.characterImage}
                alt={`${character.basic.characterName} 캐릭터 이미지`}
                onError={(event) => {
                  event.currentTarget.hidden = true;
                }}
              />
            ) : null}
          </div>
          <div className=''>
            <p>{character.basic.worldName || '월드 미확인'}</p>
            <h1 id='maple-detail-title'>{character.basic.characterName}</h1>
            <dl>
              <div>
                <dt>레벨</dt>
                <dd>{character.basic.characterLevel ?? '-'}</dd>
              </div>
              <div>
                <dt>직업</dt>
                <dd>{character.basic.characterClass || '-'}</dd>
              </div>
              <div>
                <dt>길드</dt>
                <dd>{character.basic.characterGuildName || '-'}</dd>
              </div>
              <div>
                <dt>경험치</dt>
                <dd>
                  {character.basic.characterExpRate ? `${character.basic.characterExpRate}%` : '-'}
                </dd>
              </div>
            </dl>
          </div>
        </Card>

        <Card className='maple-stat-panel'>
          <div className='maple-panel-heading'>
            <h2>스탯</h2>
            <span>{character.stat.date?.slice(0, 10) || '최신'}</span>
          </div>
          <dl className='maple-stat-grid'>
            {summaryStats.map((stat) => (
              <div key={stat.label}>
                <dt>{stat.label}</dt>
                <dd>{stat.value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </section>

      <section className='maple-equipment-section' aria-labelledby='maple-equipment-title'>
        <div className='maple-section__header'>
          <h2 id='maple-equipment-title'>장비</h2>
          <span>프리셋 {character.equipment.presetNo ?? '-'}</span>
        </div>

        <div className='maple-equipment-layout'>
          <Card className='maple-equipment-grid'>
            {character.equipment.items.map((item, index) => (
              <button
                key={`${item.slot}-${item.name}-${index}`}
                type='button'
                className={index === selectedEquipmentIndex ? 'is-selected' : ''}
                title={item.name}
                onClick={() => setSelectedEquipmentIndex(index)}
              >
                {item.icon ? (
                  <img
                    src={item.icon}
                    alt={`${item.name} 아이콘`}
                    onError={(event) => {
                      event.currentTarget.hidden = true;
                    }}
                  />
                ) : (
                  <span>{item.slot.slice(0, 2)}</span>
                )}
              </button>
            ))}
          </Card>

          {selectedEquipment ? <EquipmentDetail item={selectedEquipment} /> : null}
        </div>
      </section>
    </main>
  );
}
