'use client';

import { RoughAnnotation } from '@/components/rough-annotation';
import { Button } from '@/components/retroui/Button';
import { Card } from '@/components/retroui/Card';
import { Text } from '@/components/retroui/Text';

export default function MaplePage() {
  return (
    <main className='page-shell'>
      <header className='site-header'>
        <Card className='site-header__top'>
          <div className='site-header__copy'>
            <Text as='h1'>
              <RoughAnnotation
                testId='brand-annotation'
                color='#ffdb33'
                className='bg-linear-to-r text-emer from-orange-400 to-amber-300 bg-clip-text text-transparent'
              >
                Addicted2Maple
              </RoughAnnotation>
            </Text>
            <Text as='p'>상식인이 되기 위한 메이플 챌린저스 서버</Text>
          </div>
        </Card>
      </header>
    </main>
  );
}
