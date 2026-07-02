'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';

import { MapleCharacterCard } from '@/components/maple-character-card';
import { RoughAnnotation } from '@/components/rough-annotation';
import { Button } from '@/components/retroui/Button';
import { Card } from '@/components/retroui/Card';
import { Input } from '@/components/retroui/Input';
import { Text } from '@/components/retroui/Text';
import { useMapleCharacters, useRegisterMapleCharacter } from '@/hooks/use-maple-characters';

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function MapleApp() {
  const [characterName, setCharacterName] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const charactersQuery = useMapleCharacters();
  const registerCharacter = useRegisterMapleCharacter();
  const characters = charactersQuery.data ?? [];
  const queryError = charactersQuery.error
    ? getErrorMessage(charactersQuery.error, '캐릭터 목록을 불러오지 못했습니다.')
    : null;
  const statusMessage = message || queryError;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const normalizedName = characterName.trim();
    if (!normalizedName) {
      setMessage('캐릭터 명을 입력하세요.');
      return;
    }

    try {
      const character = await registerCharacter.mutateAsync(normalizedName);
      setCharacterName('');
      setMessage(`${character.characterName} 캐릭터를 등록했습니다.`);
    } catch (error) {
      setMessage(getErrorMessage(error, '캐릭터를 등록하지 못했습니다.'));
    }
  }

  return (
    <main className='maple-page-shell'>
      <header className='maple-hero'>
        <Card className='maple-hero__panel'>
          <div className='maple-hero__copy'>
            <Text as='h1'>
              <RoughAnnotation
                testId='maple-brand-annotation'
                color='#f59e0b'
                className='maple-gradient-text'
              >
                Addicted2Maple
              </RoughAnnotation>
            </Text>
            <Text as='p'>캐릭터 이름으로 등록하고 장비와 스탯을 빠르게 확인합니다.</Text>
          </div>
        </Card>
      </header>

      <Card className='maple-register-card'>
        <form onSubmit={handleSubmit} className='maple-register-form'>
          <label htmlFor='maple-character-name'>캐릭터 명</label>
          <div className='maple-register-form__row'>
            <Input
              id='maple-character-name'
              value={characterName}
              maxLength={30}
              placeholder='니 캐릭터 닉넴'
              autoComplete='off'
              onChange={(event) => setCharacterName(event.target.value)}
            />
            <Button type='submit' disabled={registerCharacter.isPending}>
              {registerCharacter.isPending ? '등록 중' : '등록'}
            </Button>
          </div>
        </form>
      </Card>

      {statusMessage ? (
        <p
          className={
            statusMessage.includes('등록했습니다')
              ? 'maple-status-message success'
              : 'maple-status-message error'
          }
        >
          {statusMessage}
        </p>
      ) : null}

      <section className='maple-section' aria-labelledby='maple-character-list-title'>
        <div className='maple-section__header'>
          <h2 id='maple-character-list-title'>등록 캐릭터</h2>
          <span>{characters.length}명</span>
        </div>

        {charactersQuery.isPending ? (
          <p className='maple-empty-state'>캐릭터 목록을 불러오는 중입니다.</p>
        ) : null}

        {!charactersQuery.isPending && characters.length === 0 ? (
          <p className='maple-empty-state'>아직 등록된 캐릭터가 없습니다.</p>
        ) : null}

        <div className='maple-character-list'>
          {characters.map((character) => (
            <MapleCharacterCard key={character.ocid} character={character} />
          ))}
        </div>
      </section>
    </main>
  );
}
