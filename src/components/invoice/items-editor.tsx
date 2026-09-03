"use client";

import { NumberField } from "@/components/forms/number-field";
import { Money } from "@/components/ui-kit";
import { FEE_LABEL } from "@/lib/labels";
import type { InvoiceItem } from "@/lib/billing";

/**
 * HD-06 + N6 — mọi số tiền sửa được, cả trước và sau khi lưu.
 * N7 — sửa tiền ở đây KHÔNG đụng tới chỉ số.
 */
export function ItemsEditor({
  items,
  onChange,
  idPrefix = "item",
}: {
  items: InvoiceItem[];
  onChange: (items: InvoiceItem[]) => void;
  idPrefix?: string;
}) {
  const total = items.reduce((s, i) => s + i.amount, 0);

  function setAmount(fee: string, amount: number) {
    onChange(items.map((i) => (i.fee === fee ? { ...i, amount } : i)));
  }

  return (
    <div className="bg-card border-border rounded-2xl border p-4">
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.fee} className="flex items-center gap-3">
            <label
              htmlFor={`${idPrefix}-${item.fee}`}
              className="min-w-0 flex-1 text-sm font-medium"
            >
              {FEE_LABEL[item.fee]}
              {item.is_deposit ? (
                <span className="text-muted-foreground ml-1.5 text-[11px] font-normal">
                  không tính doanh thu
                </span>
              ) : null}
            </label>
            <NumberField
              id={`${idPrefix}-${item.fee}`}
              value={item.amount}
              min={item.fee === "deposit_refund" ? -100_000_000 : 0}
              step="1000"
              suffix="đ"
              className="w-40 shrink-0"
              onChange={(v) => setAmount(item.fee, v === "" ? 0 : Number(v))}
            />
          </li>
        ))}
      </ul>

      <p className="border-border mt-3 flex items-center border-t pt-3 text-sm">
        <span className="font-semibold">Tổng</span>
        <Money value={total} signed className="ml-auto text-lg font-bold" />
      </p>
    </div>
  );
}
