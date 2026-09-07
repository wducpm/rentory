"use client";

/**
 * Nháp chỉ số công tơ, lưu ngay trên máy admin.
 *
 * Bối cảnh thật: admin cầm điện thoại đi từng tầng đọc công tơ, sóng ở cầu
 * thang và tầng hầm chập chờn. Trước đây số nhập chỉ nằm trong bộ nhớ React —
 * tải lại trang, chuyển tab, hay điện thoại thu hồi tab là mất sạch, chưa kể
 * bấm "Lập hóa đơn" lúc mất mạng thì Server Action ném lỗi và cả màn hình sập.
 *
 * Giờ mỗi lần gõ đều ghi xuống localStorage theo kỳ dịch vụ. Nháp sống qua
 * reload và qua cả lúc mất mạng; chỉ xóa khi hóa đơn của phòng đó lập xong.
 */

const PREFIX = "rentory:meter-draft:";

export type MeterEntry = {
  elecStart: number | "";
  elecEnd: number | "";
  waterStart: number | "";
  waterEnd: number | "";
};

export type MeterDraft = {
  issueDate: string;
  entries: Record<string, MeterEntry>;
  savedAt: string;
};

const key = (servicePeriod: string) => `${PREFIX}${servicePeriod}`;

export function loadDraft(servicePeriod: string): MeterDraft | null {
  try {
    const raw = localStorage.getItem(key(servicePeriod));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MeterDraft;
    return parsed && typeof parsed === "object" && parsed.entries
      ? parsed
      : null;
  } catch {
    // Chế độ riêng tư hoặc trình duyệt chặn lưu trữ — coi như chưa có nháp
    return null;
  }
}

export function saveDraft(
  servicePeriod: string,
  draft: Omit<MeterDraft, "savedAt">,
) {
  try {
    // Không còn ô nào được nhập thì dọn luôn cho sạch
    if (Object.keys(draft.entries).length === 0) {
      localStorage.removeItem(key(servicePeriod));
      return;
    }
    localStorage.setItem(
      key(servicePeriod),
      JSON.stringify({ ...draft, savedAt: new Date().toISOString() }),
    );
  } catch {
    // Hết dung lượng hoặc bị chặn — không chặn thao tác của admin vì việc này
  }
}

export function clearDraft(servicePeriod: string) {
  try {
    localStorage.removeItem(key(servicePeriod));
  } catch {
    // không sao
  }
}
