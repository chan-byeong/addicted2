const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const KST_TIME_ZONE = "Asia/Seoul";
const DAY_IN_MS = 24 * 60 * 60 * 1000;

function getKstDateParts(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: KST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Unable to format date key");
  }

  return { year, month, day };
}

function parseDateKey(dateKey: string) {
  if (!DATE_KEY_PATTERN.test(dateKey)) {
    return null;
  }

  const [year, month, day] = dateKey.split("-").map(Number);
  const utcInstant = Date.UTC(year, month - 1, day) - 9 * 60 * 60 * 1000;
  const date = new Date(utcInstant);

  return formatDateKey(date) === dateKey ? date : null;
}

export function formatDateKey(date: Date) {
  const { year, month, day } = getKstDateParts(date);

  return `${year}-${month}-${day}`;
}

export function getTodayKey() {
  return formatDateKey(new Date());
}

export function isDateKey(value: string) {
  return parseDateKey(value) !== null;
}

export function addDays(dateKey: string, days: number) {
  const date = parseDateKey(dateKey);

  if (!date) {
    throw new Error(`Invalid date key: ${dateKey}`);
  }

  const nextDate = new Date(date.getTime() + days * DAY_IN_MS);

  return formatDateKey(nextDate);
}
