import { describe, expect, it } from "vitest";
import { buildDownloadName } from "../../src/imageUtils";

describe("buildDownloadName", () => {
  it("converts extension to png with -no-bg suffix", () => {
    expect(buildDownloadName("avatar.png")).toBe("avatar-no-bg.png");
    expect(buildDownloadName("vacation.photo.jpg")).toBe("vacation.photo-no-bg.png");
  });

  it("uses fallback filename when source has no name", () => {
    expect(buildDownloadName("")).toBe("image-no-bg.png");
  });
});
