import { RoughAnnotation } from '@/components/rough-annotation';
import { Button } from '@/components/retroui/Button';
import { Card } from '@/components/retroui/Card';
import { addDays, getTodayKey } from '@/lib/date';

type DateNavProps = {
  date: string;
  onDateChange: (date: string) => void;
};

export function DateNav({ date, onDateChange }: DateNavProps) {
  const today = getTodayKey();
  const canGoNext = date < today;

  return (
    <nav className='date-nav' aria-label='날짜 이동'>
      <Card className='date-nav__panel'>
        <strong>
          <RoughAnnotation
            testId='date-annotation'
            type='box'
            // padding={[2, 6]}
            animationDuration={520}
          >
            {date}
          </RoughAnnotation>
        </strong>
        <div className='date-nav__actions'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            aria-label='이전'
            onClick={() => onDateChange(addDays(date, -1))}
          >
            ←
          </Button>
          <Button
            type='button'
            variant='outline'
            size='sm'
            aria-label='오늘'
            disabled={date === today}
            onClick={() => onDateChange(today)}
          >
            오늘
          </Button>
          <Button
            type='button'
            variant='outline'
            size='sm'
            aria-label='다음'
            disabled={!canGoNext}
            onClick={() => {
              if (canGoNext) onDateChange(addDays(date, 1));
            }}
          >
            →
          </Button>
        </div>
      </Card>
    </nav>
  );
}
