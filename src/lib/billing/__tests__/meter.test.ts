import { describe, expect, it } from "vitest";
import {
  compareRoomCodeDesc,
  lastDayOfMonth,
  roomCodeOrder,
  sortForMeterReading,
} from "../meter";

describe("BR-M01 — thứ tự đọc công tơ: giảm dần theo số phòng", () => {
  it("AC-11.1: P201…P802 xếp thành P802 → P201", () => {
    const rooms = [
      "201", "202", "203", "301", "302", "303",
      "701", "702", "703", "801", "802",
    ].map((code) => ({ code }));

    expect(sortForMeterReading(rooms).map((r) => r.code)).toEqual([
      "802", "801", "703", "702", "701",
      "303", "302", "301", "203", "202", "201",
    ]);
  });

  it("so theo giá trị số, không so chuỗi", () => {
    // So chuỗi thì "1001" < "802"; so số thì 1001 > 802
    expect(sortForMeterReading([{ code: "802" }, { code: "1001" }]).map((r) => r.code))
      .toEqual(["1001", "802"]);
  });

  it("mã có chữ vẫn lấy được phần số", () => {
    expect(roomCodeOrder("A302")).toBe(302);
    expect(compareRoomCodeDesc("A302", "201")).toBeLessThan(0);
  });

  it("không mutate mảng gốc", () => {
    const rooms = [{ code: "201" }, { code: "802" }];
    sortForMeterReading(rooms);
    expect(rooms.map((r) => r.code)).toEqual(["201", "802"]);
  });
});

describe("FR-101 — ngày chốt mặc định là ngày cuối tháng", () => {
  it("tháng 31 ngày", () => {
    expect(lastDayOfMonth(new Date(2026, 7, 3))).toBe("2026-08-31");
  });

  it("tháng 30 ngày", () => {
    expect(lastDayOfMonth(new Date(2026, 8, 15))).toBe("2026-09-30");
  });

  it("tháng 2 năm nhuận", () => {
    expect(lastDayOfMonth(new Date(2028, 1, 10))).toBe("2028-02-29");
  });

  it("tháng 2 năm thường", () => {
    expect(lastDayOfMonth(new Date(2026, 1, 10))).toBe("2026-02-28");
  });
});
