"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { NumberField } from "@/components/forms/number-field";
import { TextField } from "@/components/forms/text-field";
import { Money } from "@/components/ui-kit";
import { createReceipt } from "@/lib/actions";
import type { FeeType, InvoiceItem } from "@/lib/billing";
import { dateLabel, FEE_LABEL, todayIso } from "@/lib/labels";

type Line = { fee: FeeType; checked: boolean; amount: number | "" };

/**
 * S-05 — sheet Thu tiền.
 * TT-01: ngày thu + các khoản được tick, mỗi khoản mang số tiền sửa được.
 * TT-05: khoản đã thu vẫn tick lại được, tạo bản ghi mới — không disable.
 */
export function ReceiptSheet({
  open,
  onOpenChange,
  invoiceId,
  items,
  recognized,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  items: InvoiceItem[];
  recognized: { fee: FeeType; amount: number; receipt_date: string }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [date, setDate] = useState(todayIso());
  const [lines, setLines] = useState<Line[]>([]);

  useEffect(() => {
    if (!open) return;
    setDate(todayIso());
    setLines(
      items.map((i) => ({
        fee: i.fee,
        // Mặc định tick những khoản chưa có bản ghi thu và khác 0
        checked: i.amount !== 0 && !recognized.some((r) => r.fee === i.fee),
        amount: i.amount,
      })),
    );
  }, [open, items, recognized]);

  const picked = lines.filter((l) => l.checked);
  const total = picked.reduce(
    (s, l) => s + (l.amount === "" ? 0 : Number(l.amount)),
    0,
  );

  function submit() {
    if (picked.length === 0) {
      toast.error("Chưa chọn khoản nào để thu");
      return;
    }
    start(async () => {
      const res = await createReceipt({
        invoice_id: invoiceId,
        receipt_date: date,
        items: picked.map((l) => ({
          fee: l.fee,
          amount: l.amount === "" ? 0 : Math.round(Number(l.amount)),
        })),
      });

      if (res.ok) {
        toast.success(`Đã ghi nhận thu ${total.toLocaleString("vi-VN")}đ`);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Thu tiền</SheetTitle>
          <SheetDescription>
            Tick khoản cần thu và sửa số tiền nếu khách trả khác số trên hóa đơn.
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-3 px-4 pb-4">
          <TextField
            id="receipt-date"
            type="date"
            label="Ngày thu"
            value={date}
            onChange={setDate}
          />

          <ul className="space-y-2">
            {lines.map((line, idx) => {
              const rec = recognized.find((r) => r.fee === line.fee);
              return (
                <li
                  key={line.fee}
                  className="border-border flex items-center gap-3 rounded-xl border p-3"
                >
                  <Checkbox
                    id={`fee-${line.fee}`}
                    checked={line.checked}
                    className="size-5"
                    onCheckedChange={(c) =>
                      setLines((prev) =>
                        prev.map((l, i) =>
                          i === idx ? { ...l, checked: c === true } : l,
                        ),
                      )
                    }
                  />
                  <label
                    htmlFor={`fee-${line.fee}`}
                    className="min-w-0 flex-1 text-sm font-medium"
                  >
                    {FEE_LABEL[line.fee]}
                    {rec ? (
                      <span className="text-success block text-[11px] font-normal">
                        đã ghi nhận <Money value={rec.amount} /> ngày{" "}
                        {dateLabel(rec.receipt_date)}
                      </span>
                    ) : null}
                  </label>
                  <NumberField
                    id={`amount-${line.fee}`}
                    value={line.amount}
                    min={-100_000_000}
                    step="1000"
                    suffix="đ"
                    className="w-36 shrink-0"
                    disabled={!line.checked}
                    onChange={(v) =>
                      setLines((prev) =>
                        prev.map((l, i) => (i === idx ? { ...l, amount: v } : l)),
                      )
                    }
                  />
                </li>
              );
            })}
          </ul>

          <p className="flex items-center text-sm">
            <span className="font-semibold">Tổng thu lần này</span>
            <Money value={total} signed className="ml-auto text-lg font-bold" />
          </p>

          <p className="text-muted-foreground text-[11px]">
            Ghi sai thì thu lại khoản đó với số đúng — bản ghi mới nhất là số
            được ghi nhận, không cộng dồn (TT-03, TT-04).
          </p>

          <button
            type="button"
            onClick={submit}
            disabled={pending || picked.length === 0}
            className="bg-primary text-primary-foreground focus-visible:ring-ring h-12 w-full rounded-xl text-sm font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-40"
          >
            {pending ? "Đang ghi…" : `Ghi nhận thu ${picked.length} khoản`}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
