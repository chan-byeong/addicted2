import { describe, expect, it } from "vitest";
import { addDays, formatDateKey, getTodayKey, isDateKey } from "@/lib/date";

describe("date helpers", () => {
  it("formats a date as a local YYYY-MM-DD key", () => {
    expect(formatDateKey(new Date("2026-07-01T12:00:00+09:00"))).toBe(
      "2026-07-01",
    );
  });

  it("formats dates using KST semantics instead of host timezone", () => {
    expect(formatDateKey(new Date("2026-06-30T15:30:00Z"))).toBe("2026-07-01");
  });

  it("adds days without changing the input string", () => {
    expect(addDays("2026-07-01", -1)).toBe("2026-06-30");
    expect(addDays("2026-07-01", 1)).toBe("2026-07-02");
  });

  it("validates date keys", () => {
    expect(isDateKey("2026-07-01")).toBe(true);
    expect(isDateKey("2026-7-1")).toBe(false);
    expect(isDateKey("2026-02-30")).toBe(false);
    expect(isDateKey("2028-02-29")).toBe(true);
    expect(isDateKey("not-a-date")).toBe(false);
  });

  it("rejects invalid date keys when adding days", () => {
    expect(() => addDays("2026-02-30", 1)).toThrow(
      "Invalid date key: 2026-02-30",
    );
  });

  it("returns a date key for today", () => {
    expect(getTodayKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
