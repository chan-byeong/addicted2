import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DateNav } from "@/components/date-nav";

describe("DateNav", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("disables the next button on today's date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T12:00:00+09:00"));

    render(<DateNav date="2026-07-01" onDateChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "다음" })).toBeDisabled();
  });

  it("allows moving to the next date before today", () => {
    const onDateChange = vi.fn();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T12:00:00+09:00"));

    render(<DateNav date="2026-06-30" onDateChange={onDateChange} />);
    fireEvent.click(screen.getByRole("button", { name: "다음" }));

    expect(onDateChange).toHaveBeenCalledWith("2026-07-01");
  });
});
