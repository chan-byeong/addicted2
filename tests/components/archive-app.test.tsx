import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ArchiveApp } from "@/components/archive-app";

const item = {
  id: "1",
  url: "https://example.com",
  title: "Example title",
  description: "Example description",
  imageUrl: null,
  siteName: "Example",
  sourceType: "other",
  note: "좋았음",
  authorName: "민수",
  entryDate: "2026-07-01",
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
} as const;

describe("ArchiveApp", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string | URL | Request) => {
        const href = String(url);

        if (href.includes("/api/items")) {
          return Response.json({ items: [item] });
        }

        return Response.json({}, { status: 404 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders archive links and filters", async () => {
    render(<ArchiveApp />);

    expect(
      screen.getByRole("heading", { name: "단톡 링크 아카이브" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("검색어")).toBeInTheDocument();
    expect(screen.getByLabelText("타입 필터")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText("Example title").length).toBeGreaterThan(0);
    });
  });
});
