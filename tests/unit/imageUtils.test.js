import { describe, expect, it } from "vitest";
import { computeTargetSize } from "../../src/imageUtils";

describe("computeTargetSize", () => {
  it("keeps original size for max mode", () => {
    expect(computeTargetSize(6000, 3000, "max")).toEqual({ width: 6000, height: 3000 });
  });

  it("downscales large images for balanced mode", () => {
    expect(computeTargetSize(6000, 3000, "balanced")).toEqual({ width: 2048, height: 1024 });
  });

  it("does not upscale small images", () => {
    expect(computeTargetSize(1200, 900, "balanced")).toEqual({ width: 1200, height: 900 });
  });

  it("throws for invalid dimensions", () => {
    expect(() => computeTargetSize(0, 100, "balanced")).toThrow("Invalid image dimensions.");
  });
});
