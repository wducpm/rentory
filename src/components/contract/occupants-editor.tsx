"use client";

import { useState } from "react";
import { Star, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NumberField } from "@/components/forms/number-field";
import { TextField } from "@/components/forms/text-field";
import { Checkbox } from "@/components/ui/checkbox";
import { resizeOccupants, type ContractOccupant } from "@/lib/billing";

/**
 * FR-205 · §9.4 — nhập **số người trước**, hệ thống sinh đúng số dòng tên + SĐT.
 *
 * BR-P14: đúng một người đại diện, mặc định là người đầu, đổi được.
 * BR-P16: giảm số người thì admin **chọn đích danh** người bị xóa, không tự
 *         cắt dòng cuối — cắt bừa sẽ xóa nhầm người còn ở lại.
 * BR-P17: họ tên bắt buộc mọi người; SĐT bắt buộc riêng người đại diện.
 * CCCD không bắt buộc — nhiều hợp đồng cũ chưa thu thập — nhưng có ô riêng
 * để không phải nhét vào ô tên như dữ liệu nhập tay trước đây.
 */
export function OccupantsEditor({
  occupants,
  onChange,
  idPrefix = "occ",
}: {
  occupants: ContractOccupant[];
  onChange: (next: ContractOccupant[]) => void;
  idPrefix?: string;
}) {
  // Khi giảm số người: giữ danh sách chờ để admin tick ai bị xóa
  const [removing, setRemoving] = useState<number | null>(null);
  const [picked, setPicked] = useState<Set<number>>(new Set());

  function setCount(next: number | "") {
    if (next === "" || next < 1) return;
    if (next >= occupants.length) {
      onChange(resizeOccupants(occupants, next));
      setRemoving(null);
      return;
    }
    // BR-P16: mở bước chọn người bị xóa
    setRemoving(next);
    setPicked(new Set());
  }

  function patch(index: number, patchValue: Partial<ContractOccupant>) {
    onChange(
      occupants.map((o, i) => (i === index ? { ...o, ...patchValue } : o)),
    );
  }

  function setPrimary(index: number) {
    onChange(occupants.map((o, i) => ({ ...o, is_primary: i === index })));
  }

  function confirmRemoval() {
    // AC-24.4: xóa mất người đại diện thì KHÔNG tự gán người thay — để trống
    // cho admin chọn đích danh, nút Lưu bị chặn tới khi chọn xong.
    onChange(occupants.filter((_, i) => !picked.has(i)));
    setRemoving(null);
    setPicked(new Set());
  }

  const toRemove = removing === null ? 0 : occupants.length - removing;
  const removingPrimary = [...picked].some((i) => occupants[i]?.is_primary);

  return (
    <div className="grid gap-3">
      <NumberField
        id={`${idPrefix}-count`}
        label="Số người ở"
        min={1}
        step="1"
        value={occupants.length}
        onChange={setCount}
        hint="Đổi số ở đây, hệ thống sinh đúng số dòng bên dưới"
      />

      {removing !== null ? (
        <div className="border-destructive/40 bg-destructive-soft/40 grid gap-2 rounded-xl border p-3">
          <p className="text-sm font-semibold">
            Chọn {toRemove} người rời đi
          </p>
          <ul className="grid gap-1.5">
            {occupants.map((o, i) => (
              <li key={i} className="flex items-center gap-2">
                <Checkbox
                  id={`${idPrefix}-rm-${i}`}
                  checked={picked.has(i)}
                  className="size-5"
                  onCheckedChange={(c) =>
                    setPicked((prev) => {
                      const next = new Set(prev);
                      if (c === true) next.add(i);
                      else next.delete(i);
                      return next;
                    })
                  }
                />
                <label htmlFor={`${idPrefix}-rm-${i}`} className="text-sm">
                  {o.full_name || `Người ${i + 1}`}
                  {o.is_primary ? (
                    <span className="text-muted-foreground ml-1.5 text-[11px]">
                      đại diện
                    </span>
                  ) : null}
                </label>
              </li>
            ))}
          </ul>

          {removingPrimary ? (
            <p className="text-warning text-[11px] font-medium">
              Đang xóa người đại diện — sau khi xác nhận phải chọn người đại
              diện mới trước khi lưu.
            </p>
          ) : null}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRemoving(null)}
              className="border-border h-11 flex-1 rounded-xl border text-xs font-semibold"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={picked.size !== toRemove}
              onClick={confirmRemoval}
              className="bg-destructive text-destructive-foreground h-11 flex-[2] rounded-xl text-xs font-semibold disabled:opacity-40"
            >
              Xóa {picked.size}/{toRemove} người
            </button>
          </div>
        </div>
      ) : null}

      {occupants.length > 0 && !occupants.some((o) => o.is_primary) ? (
        <p className="text-destructive text-xs font-medium">
          Chưa có người đại diện. Chọn một người bên dưới trước khi lưu.
        </p>
      ) : null}

      <ul className="grid gap-3">
        {occupants.map((o, i) => (
          <li
            key={i}
            className={cn(
              "border-border grid gap-2 rounded-xl border p-3",
              o.is_primary && "border-primary/40 bg-primary-soft/30",
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-[11px] font-semibold">
                Người {i + 1}
              </span>

              <button
                type="button"
                onClick={() => setPrimary(i)}
                aria-pressed={o.is_primary}
                className={cn(
                  "focus-visible:ring-ring ml-auto inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold focus-visible:ring-2 focus-visible:outline-none",
                  o.is_primary
                    ? "bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground border",
                )}
              >
                <Star className="size-3" aria-hidden />
                {o.is_primary ? "Đại diện" : "Đặt làm đại diện"}
              </button>

              {occupants.length > 1 ? (
                <button
                  type="button"
                  aria-label={`Xóa người ${i + 1}`}
                  onClick={() => {
                    setRemoving(occupants.length - 1);
                    setPicked(new Set([i]));
                  }}
                  className="border-border text-muted-foreground inline-flex size-8 shrink-0 items-center justify-center rounded-lg border"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              ) : null}
            </div>

            <TextField
              id={`${idPrefix}-name-${i}`}
              label="Họ tên"
              value={o.full_name}
              onChange={(v) => patch(i, { full_name: v })}
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <TextField
                id={`${idPrefix}-phone-${i}`}
                type="tel"
                label={o.is_primary ? "Điện thoại *" : "Điện thoại"}
                value={o.phone ?? ""}
                onChange={(v) => patch(i, { phone: v })}
              />
              <TextField
                id={`${idPrefix}-cccd-${i}`}
                label="CCCD"
                value={o.national_id ?? ""}
                // Chỉ giữ chữ số: CCCD/CMND toàn số, dán từ nơi khác hay lẫn
                // dấu cách hoặc gạch nối
                onChange={(v) => patch(i, { national_id: v.replace(/\D/g, "") })}
                placeholder="12 chữ số"
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
