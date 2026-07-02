import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("global design tokens", () => {
  it("uses Pretendard and does not reference Gaegu font assets", () => {
    const css = readFileSync(
      path.join(process.cwd(), "src/app/globals.css"),
      "utf8",
    );

    expect(css).toContain("@fontsource/pretendard/400.css");
    expect(css).toContain("@fontsource/pretendard/500.css");
    expect(css).toContain("@fontsource/pretendard/600.css");
    expect(css).toContain("@fontsource/pretendard/700.css");
    expect(css).toContain('--font-sans: "Pretendard"');
    expect(css).not.toMatch(/gaegu/i);
  });
});
