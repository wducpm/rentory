import { describe, expect, it } from "vitest";
import { applyMark, isLatestInvoice, latestInvoice, markSourceOf } from "../marks";
import { periodicDefaults } from "../defaults";
import { contract, room, settings } from "./fixtures";
import type { SavedInvoice } from "../types";

describe("HD-04 + N3 — lưu hóa đơn thì ghi đè mốc và ghi log", () => {
  it("mốc phòng nhận chỉ số cuối của hóa đơn", () => {
    const r = room(4184, 106);
    const draft = periodicDefaults(contract, settings, r, { elec: 4300, water: 112 }, "2025-08-31");

    const { room: after } = applyMark(
      r,
      draft.elec_end,
      draft.water_end,
      markSourceOf(draft.type),
      "inv-1",
      { effectiveDate: draft.issue_date },
    );

    expect(after.current_elec).toBe(draft.elec_end);
    expect(after.current_water).toBe(draft.water_end);
  });

  it("log giữ cả giá trị trước và sau, kèm nguồn ghi đè (N2)", () => {
    const { log } = applyMark(room(4184, 106), 4300, 112, "invoice_periodic", "inv-1", {
      effectiveDate: "2025-08-31",
    });
    expect(log).toMatchObject({
      prev_elec: 4184,
      prev_water: 106,
      elec: 4300,
      water: 112,
      source: "invoice_periodic",
      invoice_id: "inv-1",
      effective_date: "2025-08-31",
    });
  });

  it("HD-11 — sửa mốc thủ công (thay công tơ) ghi log nguồn manual có ghi chú", () => {
    const { room: after, log } = applyMark(room(100, 20), 0, 20, "manual", null, {
      effectiveDate: "2025-08-15",
      note: "Thay công tơ điện",
    });
    expect(after.current_elec).toBe(0);
    expect(log.source).toBe("manual");
    expect(log.invoice_id).toBeNull();
    expect(log.note).toBe("Thay công tơ điện");
    expect(log.prev_elec).toBe(100);
  });

  it("applyMark không mutate phòng gốc", () => {
    const r = room(4184, 106);
    applyMark(r, 4300, 112, "invoice_periodic");
    expect(r.current_elec).toBe(4184);
  });

  it("markSourceOf ánh xạ đúng 3 loại hóa đơn", () => {
    expect(markSourceOf("move_in")).toBe("invoice_move_in");
    expect(markSourceOf("periodic")).toBe("invoice_periodic");
    expect(markSourceOf("move_out")).toBe("invoice_move_out");
  });
});

describe("HD-08a — chỉ hóa đơn đang sở hữu mốc mới được ghi đè mốc khi sửa", () => {
  const older: SavedInvoice = {
    id: "old",
    issue_date: "2025-08-31",
    created_at: "2025-08-31T10:00:00Z",
    elec_end: 4300,
    water_end: 112,
    items: [],
  };
  const newer: SavedInvoice = {
    id: "new",
    issue_date: "2025-09-30",
    created_at: "2025-09-30T10:00:00Z",
    elec_end: 4450,
    water_end: 118,
    items: [],
  };
  const currentRoom = room(4450, 118); // mốc đang do `newer` sở hữu

  it("hóa đơn mới nhất → có đổi mốc", () => {
    expect(isLatestInvoice(newer, currentRoom)).toBe(true);
  });

  it("hóa đơn cũ hơn → KHÔNG đổi mốc (mốc không được nhảy lùi)", () => {
    expect(isLatestInvoice(older, currentRoom)).toBe(false);
  });

  it("sau khi sửa mốc thủ công thì không hóa đơn nào còn sở hữu mốc", () => {
    const manual = room(0, 118);
    expect(isLatestInvoice(newer, manual)).toBe(false);
    expect(isLatestInvoice(older, manual)).toBe(false);
  });

  it("so sánh chịu được numeric trả về dạng chuỗi từ Postgres", () => {
    const asText = { id: "r", code: "201", current_elec: "4450" as unknown as number, current_water: "118" as unknown as number };
    expect(isLatestInvoice(newer, asText)).toBe(true);
  });

  it("latestInvoice sắp theo issue_date rồi created_at", () => {
    expect(latestInvoice([older, newer])?.id).toBe("new");
    expect(latestInvoice([newer, older])?.id).toBe("new");
    expect(latestInvoice([])).toBeUndefined();
  });
});
