import { describe, expect, it } from "vitest";
import { detectSourceType } from "@/lib/source-type";

describe("detectSourceType", () => {
  it("detects YouTube watch URLs", () => {
    expect(detectSourceType("https://www.youtube.com/watch?v=abc123")).toBe(
      "youtube",
    );
  });

  it("detects YouTube shorts URLs", () => {
    expect(detectSourceType("https://www.youtube.com/shorts/abc123")).toBe(
      "shorts",
    );
  });

  it("detects common Korean community URLs", () => {
    expect(detectSourceType("https://www.fmkorea.com/123")).toBe("community");
    expect(detectSourceType("https://theqoo.net/hot/123")).toBe("community");
  });

  it("uses other for unknown or invalid URLs", () => {
    expect(detectSourceType("https://example.com/post")).toBe("other");
    expect(detectSourceType("not a url")).toBe("other");
  });
});
