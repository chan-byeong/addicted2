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
      screen.getByRole("heading", { name: "Addicted2" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("brand-annotation")).toHaveTextContent(
      "Addicted2",
    );
    expect(screen.getByTestId("date-annotation")).toBeInTheDocument();
    expect(screen.getByLabelText("검색어")).toBeInTheDocument();
    expect(screen.getByLabelText("타입 필터")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText("Example title").length).toBeGreaterThan(0);
    });
  });

  it("opens the create dialog with only URL and note fields", async () => {
    const user = userEvent.setup();

    render(<ArchiveApp />);
    await user.click(screen.getByRole("button", { name: "등록" }));

    expect(screen.getByLabelText("URL")).toBeInTheDocument();
    expect(screen.getByLabelText("메모")).toBeInTheDocument();
    expect(screen.queryByLabelText("제목")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("닉네임")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("타입")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("기준 날짜")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("공용 비밀번호")).not.toBeInTheDocument();
  });
});
