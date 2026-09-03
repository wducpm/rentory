import { describe, expect, it } from "vitest";
import { buildingSlugFromHost } from "../tenant";

const FALLBACK = "190nguyentrai";

describe("2.5 — host → slug tòa nhà", () => {
  it("subdomain thật → lấy đúng slug", () => {
    expect(buildingSlugFromHost("190nguyentrai.ducpm.work")).toBe("190nguyentrai");
    expect(buildingSlugFromHost("toa2.ducpm.work")).toBe("toa2");
  });

  it("bỏ qua port và không phân biệt hoa thường", () => {
    expect(buildingSlugFromHost("190NguyenTrai.ducpm.work:3000")).toBe("190nguyentrai");
  });

  it("localhost → fallback (thiếu thì local dev chết)", () => {
    expect(buildingSlugFromHost("localhost:3000")).toBe(FALLBACK);
    expect(buildingSlugFromHost("127.0.0.1:3000")).toBe(FALLBACK);
  });

  it("*.vercel.app → fallback (Preview)", () => {
    expect(buildingSlugFromHost("rentory-git-m3-ducpm103.vercel.app")).toBe(FALLBACK);
  });

  it("apex domain và www → fallback", () => {
    expect(buildingSlugFromHost("ducpm.work")).toBe(FALLBACK);
    expect(buildingSlugFromHost("www.ducpm.work")).toBe(FALLBACK);
  });

  it("không có host → fallback", () => {
    expect(buildingSlugFromHost(null)).toBe(FALLBACK);
  });
});
