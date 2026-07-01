import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("opens the create dialog and preserves manual title fallback", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockImplementation(async (url, init) => {
      const href = String(url);

      if (href === "/api/items/metadata") {
        return Response.json({
          ok: false,
          url: "https://blocked.example.com/",
          sourceType: "other",
          message: "blocked",
        });
      }

      if (href === "/api/items" && init?.method === "POST") {
        return Response.json({ item }, { status: 201 });
      }

      return Response.json({ items: [item] });
    });

    render(<ArchiveApp />);
    await user.click(screen.getByRole("button", { name: "등록" }));
    await user.type(screen.getByLabelText("URL"), "https://blocked.example.com");
    await user.click(screen.getByRole("button", { name: "미리보기 가져오기" }));

    expect(
      await screen.findByText(
        "미리보기를 가져오지 못했습니다. 제목을 직접 입력해 주세요.",
      ),
    ).toBeInTheDocument();
  });
});
