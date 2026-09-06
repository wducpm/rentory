import { describe, expect, it } from "vitest";
import { buildPrintModel, formatPrintAmount } from "../print";
import { moveInDefaults, moveOutDefaults, periodicDefaults } from "../defaults";
import { contract, occupants, room, settings } from "./fixtures";
import type { InvoiceItem } from "../types";

const base = {
  roomCode: "503",
  tenantName: "Hồ Thị Trang",
  occupants: 2,
  contractStart: "2026-07-01",
  contractEnd: "2027-06-30",
  note: "ĐỂ XE DƯỚI TẦNG HẦM",
};

const periodicItems: InvoiceItem[] = [
  { fee: "rent", amount: 4_200_000, is_deposit: false },
  { fee: "elec", amount: 277_400, is_deposit: false },
  { fee: "water", amount: 120_000, is_deposit: false },
  { fee: "internet", amount: 100_000, is_deposit: false },
  { fee: "common", amount: 150_000, is_deposit: false },
];

describe("Mục 7 — định dạng số theo mẫu in", () => {
  it("dấu phẩy ngăn nghìn + hậu tố VND", () => {
    expect(formatPrintAmount(4_200_000)).toBe("4,200,000 VND");
    expect(formatPrintAmount(0)).toBe("0 VND");
  });

  it("số âm (hoàn cọc) giữ dấu trừ trước con số", () => {
    expect(formatPrintAmount(-4_400_000)).toBe("-4,400,000 VND");
  });
});

describe("US-14 — hóa đơn định kỳ theo mẫu", () => {
  const m = buildPrintModel({
    ...base,
    type: "periodic",
    code: "HĐ-P503-ĐN/T8.26-DV/T9.26",
    utility_period: "2026-08",
    service_period: "2026-09",
    elec_start: 5033,
    elec_end: 5106,
    water_start: 290,
    water_end: 294,
    items: periodicItems,
  });

  it("AC-14.1: tiêu đề lấy theo kỳ DỊCH VỤ", () => {
    expect(m.title).toBe("HÓA ĐƠN THÁNG 9/2026");
  });

  it("mục 10 hạng mục 1: kèm dòng nhỏ ghi đủ hai kỳ (HD-13)", () => {
    expect(m.periodsLine).toBe("Điện nước T8/2026 · Dịch vụ T9/2026");
    expect(m.code).toBe("HĐ-P503-ĐN/T8-DV/T9");
  });

  it("AC-14.2: dòng phòng in hoa tên khách, kèm thời hạn hợp đồng", () => {
    expect(m.roomLine).toBe("P503 - HỒ THỊ TRANG");
    expect(m.contractTerm).toBe("01/07/2026 - 30/06/2027");
  });

  it("AC-14.2: điện nước có đầu / cuối / đã dùng / tổng", () => {
    expect(m.elec).toEqual({ start: 5033, end: 5106, used: 73, amount: 277_400 });
    expect(m.water).toEqual({ start: 290, end: 294, used: 4, amount: 120_000 });
  });

  it("AC-14.2: dịch vụ chung kèm số người", () => {
    expect(m.common).toEqual({ occupants: 2, amount: 150_000 });
    expect(m.internet).toBe(100_000);
  });

  it("AC-14.3: tiền phòng · tiền dịch vụ (4 khoản) · tổng cộng", () => {
    expect(m.totals.room).toBe(4_200_000);
    expect(m.totals.service).toBe(277_400 + 120_000 + 150_000 + 100_000);
    expect(m.totals.grand).toBe(4_847_400);
  });

  it("AC-14.4: ghi chú cuối hóa đơn lấy từ cấu hình tòa", () => {
    expect(m.note).toBe("ĐỂ XE DƯỚI TẦNG HẦM");
  });

  it("hợp đồng không thời hạn → chỉ hiện ngày bắt đầu", () => {
    const x = buildPrintModel({
      ...base,
      contractEnd: null,
      type: "periodic",
      code: "HĐ-P503-ĐN/T8.26-DV/T9.26",
      utility_period: "2026-08",
      service_period: "2026-09",
      elec_start: 0, elec_end: 0, water_start: 0, water_end: 0,
      items: periodicItems,
    });
    expect(x.contractTerm).toBe("Từ 01/07/2026");
  });
});

describe("Mục 7 — ba loại dùng chung mẫu, khác ở dòng bổ sung", () => {
  it("nhận phòng: điện nước 0, chỉ số đầu = cuối, thêm dòng CỌC", () => {
    const d = moveInDefaults(contract, occupants, settings, { elec: 4184, water: 106 }, "2025-08-20");
    const m = buildPrintModel({
      ...base, type: d.type, code: "HĐ-P201-DV/T8.25",
      utility_period: d.utility_period, service_period: d.service_period,
      elec_start: d.elec_start, elec_end: d.elec_end,
      water_start: d.water_start, water_end: d.water_end, items: d.items,
    });

    expect(m.elec.used).toBe(0);
    expect(m.elec.start).toBe(m.elec.end);
    expect(m.extraLines).toEqual([
      { fee: "deposit", label: "CỌC", amount: 4_400_000 },
    ]);
    expect(m.periodsLine).toBe("Dịch vụ T8/2025");
  });

  it("trả phòng: thêm dòng HOÀN CỌC âm, tiêu đề theo kỳ điện nước", () => {
    const d = moveOutDefaults(contract, occupants, settings, room(4000, 100), { elec: 4180, water: 106 }, "2025-09-20");
    const m = buildPrintModel({
      ...base, type: d.type, code: "HĐ-P201-ĐN/T9.25",
      utility_period: d.utility_period, service_period: d.service_period,
      elec_start: d.elec_start, elec_end: d.elec_end,
      water_start: d.water_start, water_end: d.water_end, items: d.items,
    });

    expect(m.title).toBe("HÓA ĐƠN THÁNG 9/2025");
    expect(m.extraLines).toEqual([
      { fee: "deposit_refund", label: "HOÀN CỌC", amount: -4_400_000 },
    ]);
    expect(m.totals.grand).toBeLessThan(0);
  });
});

describe("N7 — bản in lấy số đã snapshot, không tính lại từ chỉ số", () => {
  it("HD-12 thu bù: tiền điện cao hơn tiêu thụ, bản in giữ nguyên cả hai", () => {
    const d = periodicDefaults(contract, occupants, settings, room(0, 0), { elec: 60, water: 0 }, "2025-08-31");
    // admin cộng bù đoạn công tơ cũ vào tiền điện
    const items = d.items.map((i) =>
      i.fee === "elec" ? { ...i, amount: 100 * 3800 } : i,
    );

    const m = buildPrintModel({
      ...base, type: d.type, code: "HĐ-P201-ĐN/T8.25-DV/T9.25",
      utility_period: d.utility_period, service_period: d.service_period,
      elec_start: d.elec_start, elec_end: d.elec_end,
      water_start: d.water_start, water_end: d.water_end, items,
    });

    expect(m.elec.used).toBe(60);
    expect(m.elec.amount).toBe(380_000);
    // 380.000 ≠ 60 × 3.800 — hợp lệ, không được tự ép khớp
    expect(m.elec.amount).not.toBe(m.elec.used * 3800);
  });
});
