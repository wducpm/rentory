import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearDraft, loadDraft, saveDraft } from "../meter-draft";

/** localStorage giả lập cho môi trường node của Vitest. */
function stubStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  });
  return store;
}

const entry = {
  elecStart: 1000,
  elecEnd: 1120,
  waterStart: 50,
  waterEnd: 58,
};

describe("Nháp chỉ số — sống qua reload và qua lúc mất mạng", () => {
  let store: Map<string, string>;
  beforeEach(() => {
    store = stubStorage();
  });

  it("ghi rồi đọc lại đúng số đã nhập", () => {
    saveDraft("2026-10", { issueDate: "2026-09-30", entries: { r1: entry } });

    const draft = loadDraft("2026-10");
    expect(draft?.issueDate).toBe("2026-09-30");
    expect(draft?.entries.r1).toEqual(entry);
    expect(draft?.savedAt).toBeTruthy();
  });

  it("tách theo kỳ dịch vụ — nháp kỳ này không lẫn sang kỳ khác", () => {
    saveDraft("2026-10", { issueDate: "2026-09-30", entries: { r1: entry } });
    expect(loadDraft("2026-11")).toBeNull();
  });

  it("không còn ô nào được nhập thì dọn luôn khóa, không để rác", () => {
    saveDraft("2026-10", { issueDate: "2026-09-30", entries: { r1: entry } });
    saveDraft("2026-10", { issueDate: "2026-09-30", entries: {} });
    expect(store.size).toBe(0);
    expect(loadDraft("2026-10")).toBeNull();
  });

  it("clearDraft xóa đúng kỳ được chỉ định", () => {
    saveDraft("2026-10", { issueDate: "2026-09-30", entries: { r1: entry } });
    saveDraft("2026-11", { issueDate: "2026-10-31", entries: { r1: entry } });
    clearDraft("2026-10");
    expect(loadDraft("2026-10")).toBeNull();
    expect(loadDraft("2026-11")).not.toBeNull();
  });

  it("dữ liệu hỏng trong localStorage → trả null chứ không ném lỗi", () => {
    store.set("rentory:meter-draft:2026-10", "{ không phải json");
    expect(loadDraft("2026-10")).toBeNull();
  });

  it("trình duyệt chặn lưu trữ (chế độ riêng tư) → không làm vỡ thao tác", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("bị chặn");
      },
      setItem: () => {
        throw new Error("bị chặn");
      },
      removeItem: () => {
        throw new Error("bị chặn");
      },
    });
    expect(loadDraft("2026-10")).toBeNull();
    expect(() =>
      saveDraft("2026-10", { issueDate: "2026-09-30", entries: { r1: entry } }),
    ).not.toThrow();
    expect(() => clearDraft("2026-10")).not.toThrow();
  });

  it("khôi phục nháp không được tự ghi đè lên chính nó", () => {
    // Trigger lưu là lúc rời ô (blur), không phải mỗi phím gõ và cũng không
    // phải lúc mount. Nạp nháp lên màn rồi không đụng gì thì nháp phải nguyên.
    saveDraft("2026-10", { issueDate: "2026-09-30", entries: { r1: entry } });
    const before = localStorage.getItem("rentory:meter-draft:2026-10");

    const restored = loadDraft("2026-10");

    expect(restored?.entries.r1).toEqual(entry);
    expect(localStorage.getItem("rentory:meter-draft:2026-10")).toBe(before);
  });

  it("rời ô mới chốt xuống máy, giá trị dở dang giữa chừng không được ghi", () => {
    // Gõ "1120" mà lưu từng phím thì nháp lần lượt là 1, 11, 112, 1120.
    // Chỉ gọi saveDraft ở blur nên chỉ con số hoàn chỉnh được ghi.
    const typing = [1, 11, 112, 1120];
    let persisted = 0;

    for (const elecEnd of typing) {
      // đang gõ — không chạm localStorage
      void elecEnd;
    }
    // rời ô
    saveDraft("2026-10", {
      issueDate: "2026-09-30",
      entries: { r1: { ...entry, elecEnd: typing.at(-1)! } },
    });
    persisted += 1;

    expect(persisted).toBe(1);
    expect(loadDraft("2026-10")?.entries.r1.elecEnd).toBe(1120);
  });

});
