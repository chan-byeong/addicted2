import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { LinkCard } from "@/components/link-card";
import type { ArchiveItem } from "@/types/archive";

const item = {
  id: "1",
  url: "https://example.com/article",
  title: "긴 메모가 있는 링크",
  description: null,
  imageUrl: null,
  siteName: "Example",
  sourceType: "other",
  note: "  첫 번째 줄\n두 번째 줄을 포함한 긴 메모  ",
  authorName: "민수",
  entryDate: "2026-07-20",
  createdAt: "2026-07-20T10:00:00.000Z",
  updatedAt: "2026-07-20T10:00:00.000Z",
} satisfies ArchiveItem;

describe("LinkCard", () => {
  it("expands and collapses the full note when the card is clicked", async () => {
    const user = userEvent.setup();
    render(<LinkCard item={item} />);

    const toggle = screen.getByRole("button", {
      name: "긴 메모가 있는 링크 메모 펼치기",
    });
    const note = screen.getByText(/첫 번째 줄/);

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(note).not.toHaveClass("is-expanded");
    expect(note.textContent).toBe(item.note);

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveAccessibleName("긴 메모가 있는 링크 메모 접기");
    expect(note).toHaveClass("is-expanded");

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(note).not.toHaveClass("is-expanded");
  });

  it("keeps the title as a direct external link", async () => {
    const user = userEvent.setup();
    render(<LinkCard item={item} />);

    const toggle = screen.getByRole("button", {
      name: "긴 메모가 있는 링크 메모 펼치기",
    });
    const titleLink = screen.getByRole("link", { name: item.title });

    expect(titleLink).toHaveAttribute("href", item.url);
    expect(titleLink).toHaveAttribute("target", "_blank");

    await user.click(titleLink);

    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});
