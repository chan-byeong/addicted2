import { expect, test, type Page } from "@playwright/test";

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

const today = "2026-07-01";

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
        password: string;
      };

      if (body.password !== "shared-pass") {
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ message: "공용 비밀번호가 올바르지 않습니다." }),
        });
        return;
      }

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

  await expect(page.getByRole("heading", { name: "단톡 링크 아카이브" })).toBeVisible();
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

test("creates a link after metadata fallback and shared password entry", async ({
  page,
}) => {
  const items: MockArchiveItem[] = [];
  await mockArchiveApi(page, items);

  await page.goto("/");
  await page.getByRole("button", { name: "등록" }).click();

  await page.getByLabel("URL").fill("https://www.youtube.com/shorts/demo");
  await page.getByRole("button", { name: "미리보기 가져오기" }).click();
  await expect(
    page.getByText("미리보기를 가져오지 못했습니다. 제목을 직접 입력해 주세요."),
  ).toBeVisible();

  await page.getByLabel("제목").fill("웃긴 쇼츠 모음");
  await page.getByLabel("닉네임").fill("병");
  await page.getByLabel("메모").fill("점심시간에 봄");
  await page.getByLabel("공용 비밀번호").fill("shared-pass");
  await page.getByRole("button", { name: "저장" }).click();

  await expect(page.getByRole("dialog")).toBeHidden();
  const dailyLinks = page.getByRole("region", { name: `${today} 링크` });
  await expect(
    dailyLinks.getByRole("link", { name: "웃긴 쇼츠 모음" }),
  ).toBeVisible();
  await expect(dailyLinks.getByText("점심시간에 봄")).toBeVisible();
});
