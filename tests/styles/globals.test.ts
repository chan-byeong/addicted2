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

  it("keeps Maple character card portraits large enough for character art", () => {
    const css = readFileSync(
      path.join(process.cwd(), "src/app/globals.css"),
      "utf8",
    );

    expect(css).toContain("grid-template-columns: minmax(128px, 34vw) minmax(0, 1fr)");
    expect(css).toContain("width: min(34vw, 150px)");
    expect(css).toContain("grid-template-columns: 160px minmax(0, 1fr)");
  });
});
