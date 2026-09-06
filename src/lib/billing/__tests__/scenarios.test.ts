import { describe, expect, it } from "vitest";
import {
  applyMark,
  buildInvoiceCode,
  markSourceOf,
  moveInDefaults,
  moveOutDefaults,
  periodicDefaults,
} from "../index";
import { amountOf, contract, occupants, room, settings } from "./fixtures";

/** 4.7 — ba kịch bản kiểm chứng, chạy tuần tự đúng như tài liệu mô tả. */

describe("Kịch bản 1 — khách mới nhận phòng giữa kỳ", () => {
  it("20/8 nhận phòng chốt 4184/106 → HĐ-P201-DV/T8.25, mốc ← 4184/106", () => {
    let r = room(4000, 100);

    const moveIn = moveInDefaults(contract, occupants, settings, { elec: 4184, water: 106 }, "2025-08-20");
    expect(buildInvoiceCode(r.code, moveIn.type, moveIn.utility_period, moveIn.service_period)).toBe(
      "HĐ-P201-DV/T8.25",
    );
    expect(amountOf(moveIn.items, "elec")).toBe(0);
    expect(amountOf(moveIn.items, "water")).toBe(0);
    expect(amountOf(moveIn.items, "deposit")).toBe(4400000);

    r = applyMark(r, moveIn.elec_end, moveIn.water_end, markSourceOf("move_in"), "i1").room;
    expect([r.current_elec, r.current_water]).toEqual([4184, 106]);

    // 31/8 chốt kỳ, số 4300/112
    const periodic = periodicDefaults(contract, occupants, settings, r, { elec: 4300, water: 112 }, "2025-08-31");
    expect(
      buildInvoiceCode(r.code, periodic.type, periodic.utility_period, periodic.service_period),
    ).toBe("HĐ-P201-ĐN/T8.25-DV/T9.25");
    expect(periodic.elec_end - periodic.elec_start).toBe(116);
    expect(periodic.water_end - periodic.water_start).toBe(6);
    // HD-07: nhận phòng giữa kỳ không phải trường hợp đặc biệt — dịch vụ T9 đầy đủ
    expect(amountOf(periodic.items, "rent")).toBe(4400000);

    r = applyMark(r, periodic.elec_end, periodic.water_end, markSourceOf("periodic"), "i2").room;
    expect([r.current_elec, r.current_water]).toEqual([4300, 112]);
  });
});

describe("Kịch bản 2 — thay công tơ giữa kỳ, thu bù kỳ sau", () => {
  it("mốc sửa tay về 0, chốt 60 → tiền cao hơn 60 số nhưng chỉ số vẫn 0→60", () => {
    let r = room(100, 0);

    // 15/8 thay công tơ → admin sửa mốc thủ công về 0 (HD-11), ghi log
    const manual = applyMark(r, 0, 0, "manual", null, {
      effectiveDate: "2025-08-15",
      note: "Thay công tơ điện",
    });
    r = manual.room;
    expect(manual.log.prev_elec).toBe(100);
    expect(manual.log.source).toBe("manual");

    // 31/8 chốt kỳ, số 60
    const periodic = periodicDefaults(contract, occupants, settings, r, { elec: 60, water: 0 }, "2025-08-31");
    expect(periodic.elec_start).toBe(0);
    expect(periodic.elec_end).toBe(60);
    expect(amountOf(periodic.items, "elec")).toBe(60 * 3800);

    // HD-12: admin cộng phần công tơ cũ vào tiền điện; chỉ số KHÔNG sửa theo (N7)
    const items = periodic.items.map((i) =>
      i.fee === "elec" ? { ...i, amount: 100 * 3800 } : i,
    );
    expect(amountOf(items, "elec")).toBeGreaterThan(60 * 3800);
    expect(periodic.elec_start).toBe(0);
    expect(periodic.elec_end).toBe(60);

    r = applyMark(r, periodic.elec_end, periodic.water_end, markSourceOf("periodic"), "i3").room;
    expect(r.current_elec).toBe(60);
  });
});

describe("Kịch bản 3 — khách trả phòng", () => {
  it("mốc 4000/100, trả 20/9 chốt 4180/106 → HĐ-P201-ĐN/T9.25, dịch vụ 0", () => {
    let r = room(4000, 100);

    const out = moveOutDefaults(contract, occupants, settings, r, { elec: 4180, water: 106 }, "2025-09-20");
    expect(buildInvoiceCode(r.code, out.type, out.utility_period, out.service_period)).toBe(
      "HĐ-P201-ĐN/T9.25",
    );
    expect(out.elec_end - out.elec_start).toBe(180);
    expect(out.water_end - out.water_start).toBe(6);
    expect(amountOf(out.items, "elec")).toBe(180 * 3800);
    expect(amountOf(out.items, "water")).toBe(6 * 30000);
    // dịch vụ T9 đã thu trước ở HĐ 31/8 → mặc định 0
    expect(amountOf(out.items, "rent")).toBe(0);
    expect(amountOf(out.items, "internet")).toBe(0);
    expect(amountOf(out.items, "common")).toBe(0);
    // hoàn cọc do admin quyết, mặc định bằng cọc gốc
    expect(amountOf(out.items, "deposit_refund")).toBe(-4400000);

    r = applyMark(r, out.elec_end, out.water_end, markSourceOf("move_out"), "i4").room;
    expect([r.current_elec, r.current_water]).toEqual([4180, 106]);
  });
});

describe("HD-05 — tiêu thụ ngoài hóa đơn (phòng trống) không hiện ở đâu cả", () => {
  it("mốc do sửa tay đẩy lên, hóa đơn sau tính từ mốc mới, không truy ngược", () => {
    let r = room(4180, 106);
    // Chủ nhà dùng điện lúc phòng trống → admin cập nhật mốc, không sinh hóa đơn
    r = applyMark(r, 4210, 108, "manual", null, { note: "Phòng trống, chủ dùng" }).room;

    expect(r.current_elec).toBe(4210);

    const nextIn = moveInDefaults(contract, occupants, settings, { elec: 4210, water: 108 }, "2025-10-01");
    expect(nextIn.elec_start).toBe(4210);
    expect(amountOf(nextIn.items, "elec")).toBe(0);
  });
});
