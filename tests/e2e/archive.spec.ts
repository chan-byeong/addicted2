import { expect, test, type Page } from "@playwright/test";

import { getTodayKey } from "../../src/lib/date";

type MockArchiveItem = {
  id: string;
  url: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  siteName: string | null;
  sourceType: "youtube" | "shorts" | "community" | "other";
  note: string | null;
  authorName: string;
  entryDate: string;
  createdAt: string;
  updatedAt: string;
};

const today = getTodayKey();

const baseItem: MockArchiveItem = {
  id: "item-1",
  url: "https://www.youtube.com/watch?v=abc123",
  title: "오늘의 추천 영상",
  description: "단톡방에서 같이 볼 만한 영상",
  imageUrl: null,
  siteName: "YouTube",
  sourceType: "youtube",
  note: "저녁에 보기",
  authorName: "병",
  entryDate: today,
  createdAt: "2026-07-01T08:00:00.000Z",
  updatedAt: "2026-07-01T08:00:00.000Z",
};

async function mockArchiveApi(page: Page, items: MockArchiveItem[]) {
  await page.route("**/api/items**", async (route) => {
    const request = route.request();
    const requestUrl = new URL(request.url());

    if (requestUrl.pathname === "/api/items/metadata") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          ok: false,
          url: "https://www.youtube.com/shorts/demo",
          sourceType: "shorts",
          message: "Metadata unavailable",
        }),
      });
      return;
    }

    if (requestUrl.pathname === "/api/items" && request.method() === "GET") {
      const query = requestUrl.searchParams.get("query")?.toLowerCase() || "";
      const sourceType = requestUrl.searchParams.get("sourceType") || "all";
      const date = requestUrl.searchParams.get("date");
      const limit = Number(requestUrl.searchParams.get("limit") || "50");
      const filtered = items
        .filter((item) => !date || item.entryDate === date)
        .filter((item) => sourceType === "all" || item.sourceType === sourceType)
        .filter((item) => {
          if (!query) return true;
          return [
            item.title,
            item.url,
            item.description,
            item.siteName,
            item.note,
            item.authorName,
          ]
            .filter(Boolean)
            .some((value) => value!.toLowerCase().includes(query));
        })
        .slice(0, limit);

      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ items: filtered }),
      });
      return;
    }

    if (requestUrl.pathname === "/api/items" && request.method() === "POST") {
      const body = request.postDataJSON() as {
        url: string;
        title: string;
        sourceType: MockArchiveItem["sourceType"];
        note?: string | null;
        authorName: string;
        entryDate: string;
      };

      const item: MockArchiveItem = {
        id: `item-${items.length + 1}`,
        url: body.url,
        title: body.title,
        description: null,
        imageUrl: null,
        siteName: null,
        sourceType: body.sourceType,
        note: body.note || null,
        authorName: body.authorName,
        entryDate: body.entryDate,
        createdAt: "2026-07-01T09:00:00.000Z",
        updatedAt: "2026-07-01T09:00:00.000Z",
      };

      items.unshift(item);
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ item }),
      });
      return;
    }

    await route.fallback();
  });
}

test("shows the date journal, filters, and recent links on mobile", async ({
  page,
}) => {
  await mockArchiveApi(page, [baseItem]);

  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Addicted2Community" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: `${today} 링크` })).toBeVisible();
  const dailyLinks = page.getByRole("region", { name: `${today} 링크` });
  await expect(
    dailyLinks.getByRole("link", { name: "오늘의 추천 영상" }),
  ).toBeVisible();
  await expect(dailyLinks.getByText("저녁에 보기")).toBeVisible();
  await expect(page.getByRole("heading", { name: "최근 링크" })).toBeVisible();

  await page.getByLabel("검색어").fill("없는 검색어");
  await expect(page.getByText("이 날짜에 등록된 링크가 없습니다.")).toBeVisible();
});

test("creates a link after metadata fallback without a shared password prompt", async ({
  page,
}) => {
  const items: MockArchiveItem[] = [];
  await mockArchiveApi(page, items);
  let prompted = false;
  page.on("dialog", async (dialog) => {
    prompted = true;
    await dialog.dismiss();
  });

  await page.goto("/");
  await page.getByRole("button", { name: "등록" }).click();

  await page.getByLabel("URL").fill("https://www.youtube.com/shorts/demo");
  await page.getByLabel("URL").blur();
  await expect(page.getByLabel("제목")).toBeVisible();
  await page.getByLabel("제목").fill("수동 입력 제목");
  await page.getByLabel("메모").fill("점심시간에 봄");
  await page.getByRole("button", { name: "저장" }).click();

  await expect(page.getByRole("dialog")).toBeHidden();
  expect(prompted).toBe(false);
  const dailyLinks = page.getByRole("region", { name: `${today} 링크` });
  await expect(
    dailyLinks.getByRole("link", { name: "수동 입력 제목" }),
  ).toBeVisible();
  await expect(dailyLinks.getByText("점심시간에 봄")).toBeVisible();
});
