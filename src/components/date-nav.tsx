import { addDays, getTodayKey } from "@/lib/date";

type DateNavProps = {
  date: string;
  onDateChange: (date: string) => void;
};

export function DateNav({ date, onDateChange }: DateNavProps) {
  return (
    <nav className="date-nav" aria-label="날짜 이동">
      <button type="button" onClick={() => onDateChange(addDays(date, -1))}>
        이전
      </button>
      <button type="button" onClick={() => onDateChange(getTodayKey())}>
        오늘
      </button>
      <button type="button" onClick={() => onDateChange(addDays(date, 1))}>
        다음
      </button>
      <strong>{date}</strong>
    </nav>
  );
}
