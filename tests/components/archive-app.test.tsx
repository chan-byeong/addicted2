import { render, screen, waitFor, within } from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ArchiveApp } from "@/components/archive-app";
import { getTodayKey } from "@/lib/date";
import type { ArchiveItem } from "@/types/archive";

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
} satisfies ArchiveItem;

function renderArchiveApp() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ArchiveApp />
    </QueryClientProvider>,
  );
}

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
    renderArchiveApp();

    expect(
      screen.getByRole("heading", { name: "Addicted2Community" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("brand-annotation")).toHaveTextContent(
      "Addicted2Community",
    );
    expect(screen.getByTestId("date-annotation")).toBeInTheDocument();
    expect(screen.getByLabelText("검색어")).toBeInTheDocument();
    expect(screen.getByLabelText("타입 필터")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText("Example title").length).toBeGreaterThan(0);
    });
  });

  it("opens the create dialog with URL, note, and optional title on metadata failure", async () => {
    const user = userEvent.setup();

    renderArchiveApp();
    await user.click(screen.getByRole("button", { name: "등록" }));

    expect(screen.getByLabelText("URL")).toBeInTheDocument();
    expect(screen.getByLabelText("메모")).toBeInTheDocument();
    expect(screen.queryByLabelText("제목")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("닉네임")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("타입")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("기준 날짜")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("공용 비밀번호")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("URL"), "https://www.youtube.com/shorts/demo");
    await user.tab();

    await waitFor(() => {
      expect(screen.getByLabelText("제목")).toBeInTheDocument();
    });
  });

  it("reuses cached metadata for repeated saves of the same URL", async () => {
    const user = userEvent.setup();
    const items: ArchiveItem[] = [];
    let metadataRequests = 0;

    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
        const href = String(url);
        const method = init?.method || "GET";

        if (href.includes("/api/items/metadata")) {
          metadataRequests += 1;
          return Response.json({
            ok: true,
            url: "https://www.youtube.com/shorts/demo",
            title: "캐시된 쇼츠 제목",
            description: null,
            imageUrl: "https://img.youtube.test/demo.jpg",
            siteName: "YouTube",
            sourceType: "shorts",
          });
        }

        if (href.includes("/api/items") && method === "POST") {
          const body = JSON.parse(String(init?.body)) as {
            url: string;
            title: string;
            description?: string | null;
            imageUrl?: string | null;
            siteName?: string | null;
            sourceType: ArchiveItem["sourceType"];
            note?: string | null;
            authorName: string;
            entryDate: string;
          };
          const nextItem: ArchiveItem = {
            id: `item-${items.length + 1}`,
            url: body.url,
            title: body.title,
            description: body.description || null,
            imageUrl: body.imageUrl || null,
            siteName: body.siteName || null,
            sourceType: body.sourceType,
            note: body.note || null,
            authorName: body.authorName,
            entryDate: body.entryDate,
            createdAt: "2026-07-01T09:00:00.000Z",
            updatedAt: "2026-07-01T09:00:00.000Z",
          };
          items.unshift(nextItem);

          return Response.json({ item: nextItem }, { status: 201 });
        }

        if (href.includes("/api/items")) {
          return Response.json({ items });
        }

        return Response.json({}, { status: 404 });
      }),
    );

    renderArchiveApp();

    for (const note of ["처음 저장", "다시 저장"]) {
      await user.click(screen.getByRole("button", { name: "등록" }));
      await user.clear(screen.getByLabelText("URL"));
      await user.type(screen.getByLabelText("URL"), "https://www.youtube.com/shorts/demo");
      await user.tab();
      await waitFor(() => {
        expect(screen.getByLabelText("링크 미리보기")).toBeInTheDocument();
      });
      await user.clear(screen.getByLabelText("메모"));
      await user.type(screen.getByLabelText("메모"), note);
      await user.click(screen.getByRole("button", { name: "저장" }));

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    }

    expect(metadataRequests).toBe(1);
    const dailyLinks = screen.getByRole("region", {
      name: `${getTodayKey()} 링크`,
    });
    expect(
      within(dailyLinks).getAllByRole("link", { name: "캐시된 쇼츠 제목" }),
    ).toHaveLength(2);
  });
});
