import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn utility", () => {
  it("merges class names correctly", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", true && "visible")).toBe("base visible");
  });

  it("handles undefined values", () => {
    expect(cn("base", undefined, "end")).toBe("base end");
  });

  it("deduplicates Tailwind classes", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });
});
