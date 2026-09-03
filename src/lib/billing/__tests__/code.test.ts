import { describe, expect, it } from "vitest";
import {
  buildInvoiceCode,
  displayInvoiceCode,
  nextCodeSeq,
  parseInvoiceCode,
} from "../code";

describe("4.4 — mã hóa đơn lưu trong DB (luôn đủ năm)", () => {
  it("nhận phòng: chỉ có đoạn dịch vụ", () => {
    expect(buildInvoiceCode("201", "move_in", null, "2025-08")).toBe(
      "HĐ-P201-DV/T8.25",
    );
  });

  it("định kỳ: có cả hai đoạn, lệch nhau 1 tháng", () => {
    expect(buildInvoiceCode("201", "periodic", "2025-08", "2025-09")).toBe(
      "HĐ-P201-ĐN/T8.25-DV/T9.25",
    );
  });

  it("trả phòng: chỉ có đoạn điện nước", () => {
    expect(buildInvoiceCode("201", "move_out", "2025-09", null)).toBe(
      "HĐ-P201-ĐN/T9.25",
    );
  });

  it("hai kỳ khác năm vẫn lưu đủ năm ở cả hai đoạn", () => {
    expect(buildInvoiceCode("201", "periodic", "2025-12", "2026-01")).toBe(
      "HĐ-P201-ĐN/T12.25-DV/T1.26",
    );
  });

  it("trùng mã trong cùng kỳ → hậu tố thứ tự", () => {
    expect(buildInvoiceCode("201", "move_out", "2025-09", null, 2)).toBe(
      "HĐ-P201-ĐN/T9.25-2",
    );
    // seq 1 là mã gốc, không gắn hậu tố
    expect(buildInvoiceCode("201", "move_out", "2025-09", null, 1)).toBe(
      "HĐ-P201-ĐN/T9.25",
    );
  });

  it("thiếu kỳ bắt buộc thì ném lỗi", () => {
    expect(() => buildInvoiceCode("201", "periodic", null, "2025-09")).toThrow();
    expect(() => buildInvoiceCode("201", "move_in", null, null)).toThrow();
  });
});

describe("4.4 — nextCodeSeq", () => {
  it("mã gốc chưa dùng → 1", () => {
    expect(nextCodeSeq("HĐ-P201-ĐN/T9.25", [])).toBe(1);
  });

  it("đã có mã gốc → 2, đã có cả -2 → 3", () => {
    const base = "HĐ-P201-ĐN/T9.25";
    expect(nextCodeSeq(base, [base])).toBe(2);
    expect(nextCodeSeq(base, [base, `${base}-2`])).toBe(3);
  });
});

describe("4.4 — mã hiển thị: bỏ năm, trừ khi hai kỳ khác năm", () => {
  it("định kỳ cùng năm → bỏ năm cả hai đoạn", () => {
    expect(displayInvoiceCode("HĐ-P201-ĐN/T8.25-DV/T9.25")).toBe(
      "HĐ-P201-ĐN/T8-DV/T9",
    );
  });

  it("định kỳ khác năm → giữ đủ năm", () => {
    expect(displayInvoiceCode("HĐ-P201-ĐN/T12.25-DV/T1.26")).toBe(
      "HĐ-P201-ĐN/T12.25-DV/T1.26",
    );
  });

  it("nhận phòng / trả phòng chỉ một kỳ → luôn bỏ năm", () => {
    expect(displayInvoiceCode("HĐ-P201-DV/T8.25")).toBe("HĐ-P201-DV/T8");
    expect(displayInvoiceCode("HĐ-P201-ĐN/T9.25")).toBe("HĐ-P201-ĐN/T9");
  });

  it("giữ nguyên hậu tố thứ tự", () => {
    expect(displayInvoiceCode("HĐ-P201-ĐN/T9.25-2")).toBe("HĐ-P201-ĐN/T9-2");
  });

  it("mã sai định dạng thì ném lỗi", () => {
    expect(() => displayInvoiceCode("HD-201-T9")).toThrow();
  });
});

describe("parseInvoiceCode", () => {
  it("đọc lại đúng mọi đoạn", () => {
    expect(parseInvoiceCode("HĐ-P201-ĐN/T12.25-DV/T1.26-3")).toEqual({
      roomCode: "201",
      utility: { month: 12, yy: 25 },
      service: { month: 1, yy: 26 },
      seq: 3,
    });
  });
});
