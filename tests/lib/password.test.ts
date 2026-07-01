import { describe, expect, it } from "vitest";
import { verifyWritePassword } from "@/lib/password";

describe("verifyWritePassword", () => {
  it("accepts the exact shared password", () => {
    expect(verifyWritePassword("open-sesame", "open-sesame")).toBe(true);
  });

  it("rejects missing and incorrect passwords", () => {
    expect(verifyWritePassword("", "open-sesame")).toBe(false);
    expect(verifyWritePassword(undefined, "open-sesame")).toBe(false);
    expect(verifyWritePassword("wrong", "open-sesame")).toBe(false);
  });
});
