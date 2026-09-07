import { describe, expect, it } from "vitest";
import {
  CONTRACT_EXPIRY_WARNING_DAYS,
  daysUntil,
  isExpiringSoon,
  occupantCount,
  primaryName,
  primaryOccupant,
  resizeOccupants,
  roomStatus,
  validateOccupants,
} from "../occupants";
import { periodicDefaults } from "../defaults";
import { contract, occupants, room, settings } from "./fixtures";
import type { ContractOccupant } from "../types";

const person = (
  full_name: string,
  is_primary = false,
  phone: string | null = null,
  national_id: string | null = null,
): ContractOccupant => ({ full_name, phone, national_id, is_primary });

describe("CR-02 · BR-P14 — người đại diện", () => {
  it("lấy đúng người được đánh dấu, không phải người đầu danh sách", () => {
    const list = [person("A"), person("B", true, "09")];
    expect(primaryOccupant(list)?.full_name).toBe("B");
    expect(primaryName(list)).toBe("B");
  });

  it("dữ liệu khuyết cờ đại diện → lấy người đầu để UI không vỡ", () => {
    expect(primaryName([person("A"), person("B")])).toBe("A");
  });

  it("không có ai → hiển thị gạch ngang", () => {
    expect(primaryName([])).toBe("—");
  });
});

describe("CR-02 · BR-P15 — số người = số dòng", () => {
  it("đếm theo danh sách chứ không theo cột lưu sẵn", () => {
    expect(occupantCount(occupants)).toBe(2);
  });

  it("dịch vụ chung tính theo occupants.length", () => {
    const d = periodicDefaults(
      contract,
      occupants,
      settings,
      room(0, 0),
      { elec: 0, water: 0 },
      "2026-08-31",
    );
    expect(d.items.find((i) => i.fee === "common")!.amount).toBe(150_000 * 2);
  });

  it("AC-24.1: thêm một người → hóa đơn lập sau tính theo 3 người", () => {
    const three = [...occupants, person("Người thứ ba")];
    const d = periodicDefaults(
      contract,
      three,
      settings,
      room(0, 0),
      { elec: 0, water: 0 },
      "2026-08-31",
    );
    expect(d.items.find((i) => i.fee === "common")!.amount).toBe(150_000 * 3);
  });
});

describe("CR-03 · BR-P17 — ràng buộc trường người ở", () => {
  it("AC-21.8: thiếu họ tên bất kỳ ai → báo lỗi đúng dòng", () => {
    const issues = validateOccupants([person("A", true, "09"), person("")]);
    expect(issues).toContainEqual({
      index: 1,
      field: "full_name",
      message: "Chưa nhập họ tên",
    });
  });

  it("AC-21.9: thiếu SĐT người đại diện → chặn", () => {
    const issues = validateOccupants([person("A", true)]);
    expect(issues.some((i) => i.field === "phone")).toBe(true);
  });

  it("AC-21.9: thiếu SĐT người ở cùng → vẫn hợp lệ", () => {
    expect(validateOccupants([person("A", true, "09"), person("B")])).toEqual([]);
  });

  it("không có ai hoặc có hai người đại diện → chặn", () => {
    expect(validateOccupants([]).length).toBeGreaterThan(0);
    expect(
      validateOccupants([person("A", true, "09"), person("B", true, "08")]).length,
    ).toBeGreaterThan(0);
  });
});

describe("FR-205 — đổi số người ở", () => {
  it("tăng số người → thêm dòng trống ở cuối, giữ nguyên dòng cũ", () => {
    const next = resizeOccupants([person("A", true, "09")], 3);
    expect(next).toHaveLength(3);
    expect(next[0].full_name).toBe("A");
    expect(next[1].full_name).toBe("");
  });

  it("danh sách rỗng → người đầu tiên tự thành đại diện (AC-21.3)", () => {
    expect(resizeOccupants([], 2)[0].is_primary).toBe(true);
  });

  it("AC-24.4: cắt bớt làm mất người đại diện → KHÔNG tự gán, để admin chọn", () => {
    const next = resizeOccupants([person("A"), person("B", true, "09")], 1);
    expect(next).toHaveLength(1);
    expect(next[0].is_primary).toBe(false);
    // và validate phải chặn cho tới khi admin chọn
    expect(validateOccupants(next).length).toBeGreaterThan(0);
  });
});

describe("CR-01 · BR-P04 — trạng thái phòng suy từ hợp đồng", () => {
  it("có hợp đồng hiệu lực → Đang thuê, không có → Trống", () => {
    expect(roomStatus(true)).toBe("occupied");
    expect(roomStatus(false)).toBe("vacant");
  });

  it("chỉ còn hai trạng thái, không có maintenance", () => {
    expect([roomStatus(true), roomStatus(false)]).not.toContain("maintenance");
  });
});

describe("CR-06 · FR-208 — ngưỡng cảnh báo hết hạn là 15 ngày", () => {
  it("hằng số khai báo đúng một chỗ", () => {
    expect(CONTRACT_EXPIRY_WARNING_DAYS).toBe(15);
  });

  it("AC-25.1: còn 10 ngày → có cảnh báo", () => {
    expect(isExpiringSoon("2026-09-15", "2026-09-05")).toBe(true);
  });

  it("AC-25.2: còn 20 ngày → chưa cảnh báo", () => {
    expect(isExpiringSoon("2026-09-25", "2026-09-05")).toBe(false);
  });

  it("đúng mốc 15 ngày → đã cảnh báo", () => {
    expect(isExpiringSoon("2026-09-20", "2026-09-05")).toBe(true);
  });

  it("AC-25.3: quá hạn vẫn cảnh báo, số ngày âm", () => {
    expect(isExpiringSoon("2026-09-01", "2026-09-05")).toBe(true);
    expect(daysUntil("2026-09-01", "2026-09-05")).toBe(-4);
  });

  it("hợp đồng không thời hạn → không cảnh báo", () => {
    expect(isExpiringSoon(null, "2026-09-05")).toBe(false);
    expect(daysUntil(null, "2026-09-05")).toBeNull();
  });
});
