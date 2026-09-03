import { describe, expect, it } from "vitest";
import {
  invoiceStatus,
  paidTotal,
  recognizedAmount,
  unpaidFees,
} from "../recognized";
import type { InvoiceItem, Receipt } from "../types";

const items: InvoiceItem[] = [
  { fee: "rent", amount: 4400000, is_deposit: false },
  { fee: "elec", amount: 440800, is_deposit: false },
];

describe("TT-03 — số ghi nhận là bản ghi MỚI NHẤT, không cộng dồn", () => {
  const receipts: Receipt[] = [
    {
      id: "r1",
      receipt_date: "2025-09-01",
      created_at: "2025-09-01T10:00:00Z",
      items: [{ fee: "rent", amount: 2000000 }],
    },
    {
      id: "r2",
      receipt_date: "2025-09-05",
      created_at: "2025-09-05T10:00:00Z",
      items: [{ fee: "rent", amount: 4400000 }],
    },
  ];

  it("2 bản ghi cùng khoản → lấy bản mới nhất", () => {
    expect(recognizedAmount(receipts, "rent")).toBe(4400000);
  });

  it("tuyệt đối không cộng dồn 2.000.000 + 4.400.000", () => {
    expect(recognizedAmount(receipts, "rent")).not.toBe(6400000);
  });

  it("cùng ngày thì so tiếp created_at", () => {
    const sameDay: Receipt[] = [
      { id: "a", receipt_date: "2025-09-05", created_at: "2025-09-05T08:00:00Z", items: [{ fee: "rent", amount: 1 }] },
      { id: "b", receipt_date: "2025-09-05", created_at: "2025-09-05T09:00:00Z", items: [{ fee: "rent", amount: 2 }] },
    ];
    expect(recognizedAmount(sameDay, "rent")).toBe(2);
  });

  it("khoản chưa có bản ghi nào → null", () => {
    expect(recognizedAmount(receipts, "elec")).toBeNull();
  });

  it("paidTotal cộng số ghi nhận của từng khoản", () => {
    expect(paidTotal(items, receipts)).toBe(4400000);
  });
});

describe("TT-06 — trạng thái suy ra, không set tay", () => {
  it("còn khoản chưa có bản ghi → due, kèm danh sách khoản thiếu", () => {
    const receipts: Receipt[] = [
      { id: "r1", receipt_date: "2025-09-01", created_at: "2025-09-01T10:00:00Z", items: [{ fee: "rent", amount: 4400000 }] },
    ];
    expect(invoiceStatus(items, receipts)).toBe("due");
    expect(unpaidFees(items, receipts)).toEqual(["elec"]);
  });

  it("mọi khoản đều có bản ghi → paid", () => {
    const receipts: Receipt[] = [
      {
        id: "r1",
        receipt_date: "2025-09-01",
        created_at: "2025-09-01T10:00:00Z",
        items: [
          { fee: "rent", amount: 4400000 },
          { fee: "elec", amount: 440800 },
        ],
      },
    ];
    expect(invoiceStatus(items, receipts)).toBe("paid");
    expect(unpaidFees(items, receipts)).toEqual([]);
  });

  it("TT-05: thu thiếu vẫn tính là đã có bản ghi (số ghi nhận < số hóa đơn)", () => {
    const receipts: Receipt[] = [
      {
        id: "r1",
        receipt_date: "2025-09-01",
        created_at: "2025-09-01T10:00:00Z",
        items: [
          { fee: "rent", amount: 1000000 },
          { fee: "elec", amount: 440800 },
        ],
      },
    ];
    expect(invoiceStatus(items, receipts)).toBe("paid");
    expect(paidTotal(items, receipts)).toBe(1440800);
  });

  it("TT-06a: dòng 0đ không cần bản ghi thu (hóa đơn trả phòng)", () => {
    const moveOutItems: InvoiceItem[] = [
      { fee: "rent", amount: 0, is_deposit: false },
      { fee: "elec", amount: 684000, is_deposit: false },
    ];
    const receipts: Receipt[] = [
      { id: "r1", receipt_date: "2025-09-20", created_at: "2025-09-20T10:00:00Z", items: [{ fee: "elec", amount: 684000 }] },
    ];
    expect(invoiceStatus(moveOutItems, receipts)).toBe("paid");
  });

  it("chưa thu gì → due", () => {
    expect(invoiceStatus(items, [])).toBe("due");
    expect(unpaidFees(items, [])).toEqual(["rent", "elec"]);
  });
});
