import { describe, expect, it } from "vitest";
import {
  consumption,
  invoiceTotal,
  moveInDefaults,
  moveOutDefaults,
  periodicDefaults,
  revenueTotal,
} from "../defaults";
import { amountOf, contract, occupants, room, settings } from "./fixtures";

describe("consumption", () => {
  it("bằng hiệu hai mốc, không bao giờ âm", () => {
    expect(consumption(4184, 4300)).toBe(116);
    expect(consumption(100, 100)).toBe(0);
    expect(consumption(100, 60)).toBe(0);
  });
});

describe("HD-01 — hóa đơn nhận phòng", () => {
  const draft = moveInDefaults(contract, occupants, settings, { elec: 4184, water: 106 }, "2025-08-20");

  it("điện = nước = 0", () => {
    expect(amountOf(draft.items, "elec")).toBe(0);
    expect(amountOf(draft.items, "water")).toBe(0);
  });

  it("chỉ số đầu = chỉ số cuối = số chốt bàn giao", () => {
    expect(draft.elec_start).toBe(4184);
    expect(draft.elec_end).toBe(4184);
    expect(draft.elec_start).toBe(draft.elec_end);
    expect(draft.water_start).toBe(106);
    expect(draft.water_end).toBe(106);
  });

  it("không có kỳ điện nước, dịch vụ = kỳ hiện tại", () => {
    expect(draft.utility_period).toBeNull();
    expect(draft.service_period).toBe("2025-08");
  });

  it("dịch vụ kỳ hiện tại list đầy đủ dù khách chỉ ở vài ngày", () => {
    expect(amountOf(draft.items, "rent")).toBe(4400000);
    expect(amountOf(draft.items, "internet")).toBe(100000);
    expect(amountOf(draft.items, "common")).toBe(300000); // 150k × 2 người
  });

  it("có dòng Cọc, đánh cờ is_deposit (HD-15)", () => {
    const deposit = draft.items.find((i) => i.fee === "deposit")!;
    expect(deposit.amount).toBe(4400000);
    expect(deposit.is_deposit).toBe(true);
    expect(draft.items.some((i) => i.fee === "deposit_refund")).toBe(false);
  });

  it("HD-15: cọc không tính vào doanh thu", () => {
    expect(invoiceTotal(draft.items)).toBe(4800000 + 4400000);
    expect(revenueTotal(draft.items)).toBe(4800000);
  });
});

describe("HD-02 — hóa đơn định kỳ", () => {
  const draft = periodicDefaults(contract, occupants, settings,
    room(4184, 106),
    { elec: 4300, water: 112 },
    "2025-08-31",
  );

  it("chỉ số đầu = mốc hiện tại, chỉ số cuối = số chốt kỳ", () => {
    expect(draft.elec_start).toBe(4184);
    expect(draft.elec_end).toBe(4300);
    expect(draft.water_start).toBe(106);
    expect(draft.water_end).toBe(112);
  });

  it("kỳ điện nước và kỳ dịch vụ lệch nhau đúng 1 tháng (4.1)", () => {
    expect(draft.utility_period).toBe("2025-08");
    expect(draft.service_period).toBe("2025-09");
  });

  it("bắc cầu sang năm mới vẫn lệch đúng 1 tháng", () => {
    const d = periodicDefaults(contract, occupants, settings, room(0, 0), { elec: 0, water: 0 }, "2025-12-31");
    expect(d.utility_period).toBe("2025-12");
    expect(d.service_period).toBe("2026-01");
  });

  it("tiền điện nước tính theo tiêu thụ kỳ vừa kết thúc", () => {
    expect(amountOf(draft.items, "elec")).toBe(116 * 3800);
    expect(amountOf(draft.items, "water")).toBe(6 * 30000);
  });

  it("không có dòng cọc nào", () => {
    expect(draft.items.some((i) => i.is_deposit)).toBe(false);
  });
});

describe("HD-03 — hóa đơn trả phòng", () => {
  const draft = moveOutDefaults(contract, occupants, settings,
    room(4000, 100),
    { elec: 4180, water: 106 },
    "2025-09-20",
  );

  it("điện nước tính từ mốc đến ngày trả", () => {
    expect(amountOf(draft.items, "elec")).toBe(180 * 3800);
    expect(amountOf(draft.items, "water")).toBe(6 * 30000);
  });

  it("dòng dịch vụ mặc định 0 nhưng vẫn hiển thị đầy đủ", () => {
    expect(amountOf(draft.items, "rent")).toBe(0);
    expect(amountOf(draft.items, "internet")).toBe(0);
    expect(amountOf(draft.items, "common")).toBe(0);
  });

  it("không có kỳ dịch vụ (đã thu trước ở kỳ liền trước)", () => {
    expect(draft.utility_period).toBe("2025-09");
    expect(draft.service_period).toBeNull();
  });

  it("có dòng Hoàn cọc âm, đánh cờ is_deposit", () => {
    const refund = draft.items.find((i) => i.fee === "deposit_refund")!;
    expect(refund.amount).toBe(-4400000);
    expect(refund.is_deposit).toBe(true);
  });

  it("HD-15: hoàn cọc không trừ vào doanh thu", () => {
    expect(revenueTotal(draft.items)).toBe(180 * 3800 + 6 * 30000);
  });
});

describe("N7 — chỉ số và số tiền độc lập", () => {
  it("HD-12: sửa tiền điện lệch khỏi chỉ số vẫn hợp lệ, chỉ số không đổi", () => {
    // Kịch bản thay công tơ: mốc đã sửa thủ công về 0, chốt kỳ 60 số
    const draft = periodicDefaults(contract, occupants, settings,
      room(0, 0),
      { elec: 60, water: 0 },
      "2025-08-31",
    );
    expect(amountOf(draft.items, "elec")).toBe(60 * 3800);

    // Admin cộng thêm phần công tơ cũ vào tiền điện
    const edited = draft.items.map((i) =>
      i.fee === "elec" ? { ...i, amount: i.amount + 40 * 3800 } : i,
    );

    expect(amountOf(edited, "elec")).toBe(100 * 3800);
    // CHỈ SỐ VẪN GHI 0 → 60
    expect(draft.elec_start).toBe(0);
    expect(draft.elec_end).toBe(60);
  });
});
