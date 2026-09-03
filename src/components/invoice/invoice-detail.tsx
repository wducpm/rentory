"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Droplets, Pencil, Undo2, Wallet, Zap } from "lucide-react";
import { toast } from "sonner";
import { Money, Pill, SectionHeader } from "@/components/ui-kit";
import { ItemsEditor } from "@/components/invoice/items-editor";
import { ReceiptSheet } from "@/components/invoice/receipt-sheet";
import { NumberField } from "@/components/forms/number-field";
import { TextField } from "@/components/forms/text-field";
import { updateInvoice } from "@/lib/actions";
import {
  consumption,
  type FeeType,
  type InvoiceItem,
  type InvoiceType,
} from "@/lib/billing";
import { dateLabel, FEE_LABEL, periodsLine } from "@/lib/labels";

export type InvoiceView = {
  id: string;
  code: string;
  type: InvoiceType;
  issue_date: string;
  utility_period: string | null;
  service_period: string | null;
  elec_start: number;
  elec_end: number;
  water_start: number;
  water_end: number;
  note: string | null;
  items: InvoiceItem[];
  total: number;
  paid: number;
  status: "paid" | "due";
  unpaid: FeeType[];
};

export function InvoiceDetail({
  invoice,
  roomCode,
  tenantName,
  ownsMark,
  recognized,
  receipts,
}: {
  invoice: InvoiceView;
  roomCode: string;
  tenantName: string | null;
  ownsMark: boolean;
  recognized: { fee: FeeType; amount: number; receipt_date: string }[];
  receipts: {
    id: string;
    receipt_date: string;
    edited: boolean;
    items: { fee: FeeType; amount: number }[];
  }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const [collecting, setCollecting] = useState(false);

  const [issueDate, setIssueDate] = useState(invoice.issue_date);
  const [elecStart, setElecStart] = useState<number | "">(invoice.elec_start);
  const [elecEnd, setElecEnd] = useState<number | "">(invoice.elec_end);
  const [waterStart, setWaterStart] = useState<number | "">(invoice.water_start);
  const [waterEnd, setWaterEnd] = useState<number | "">(invoice.water_end);
  const [items, setItems] = useState<InvoiceItem[]>(invoice.items);

  const n = (v: number | "") => (v === "" ? 0 : Number(v));
  const rollback = n(elecEnd) < n(elecStart) || n(waterEnd) < n(waterStart);

  function save() {
    if (rollback) {
      toast.error("Chỉ số cuối nhỏ hơn chỉ số đầu (HD-09).");
      return;
    }
    start(async () => {
      const res = await updateInvoice({
        invoice_id: invoice.id,
        issue_date: issueDate,
        utility_period: invoice.utility_period,
        service_period: invoice.service_period,
        elec_start: n(elecStart),
        elec_end: n(elecEnd),
        water_start: n(waterStart),
        water_end: n(waterEnd),
        items,
        note: invoice.note,
      });

      if (res.ok) {
        toast.success(
          res.data.markMoved
            ? "Đã lưu. Mốc phòng cập nhật theo chỉ số cuối."
            : "Đã lưu. Đây không phải hóa đơn mới nhất nên mốc phòng giữ nguyên (HD-08a).",
        );
        setEditing(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function cancel() {
    setElecStart(invoice.elec_start);
    setElecEnd(invoice.elec_end);
    setWaterStart(invoice.water_start);
    setWaterEnd(invoice.water_end);
    setIssueDate(invoice.issue_date);
    setItems(invoice.items);
    setEditing(false);
  }

  const shownItems = editing ? items : invoice.items;
  const shownTotal = shownItems.reduce((s, i) => s + i.amount, 0);
  const remaining = invoice.total - invoice.paid;

  return (
    <div className="space-y-5 pb-32">
      {/* Đầu hóa đơn — HD-13 */}
      <section className="bg-card border-border rounded-2xl border p-4">
        {/* HD-13: mặt hóa đơn ghi rõ hai kỳ. Mã đã nằm ở tiêu đề màn nên
            không lặp lại ở đây. */}
        <div className="flex items-start gap-2">
          <p className="min-w-0 text-sm font-semibold">
            {periodsLine(invoice.utility_period, invoice.service_period)}
          </p>
          <Pill
            tone={invoice.status === "paid" ? "success" : "warning"}
            className="ml-auto"
          >
            {invoice.status === "paid" ? "Đã thu" : "Chưa thu"}
          </Pill>
        </div>

        <p className="text-muted-foreground mt-3 text-xs">
          P.{roomCode}
          {tenantName ? ` · ${tenantName}` : ""} · lập{" "}
          {editing ? "" : dateLabel(invoice.issue_date)}
        </p>
        {editing ? (
          <TextField
            id="inv-date"
            type="date"
            value={issueDate}
            onChange={setIssueDate}
            className="mt-2"
          />
        ) : null}

        {invoice.status === "due" && invoice.unpaid.length > 0 ? (
          <p className="text-warning mt-2 text-[11px] font-medium">
            Còn thiếu: {invoice.unpaid.map((f) => FEE_LABEL[f]).join(", ")}
          </p>
        ) : null}
      </section>

      {/* Chỉ số — N5 snapshot */}
      <section>
        <SectionHeader title="Chỉ số" />
        <div className="bg-card border-border grid gap-3 rounded-2xl border p-4 sm:grid-cols-2">
          <ReadingBlock
            icon={<Zap />}
            label="Điện"
            unit="số"
            start={elecStart}
            end={elecEnd}
            editing={editing}
            onStart={setElecStart}
            onEnd={setElecEnd}
            idPrefix="elec"
          />
          <ReadingBlock
            icon={<Droplets />}
            label="Nước"
            unit="khối"
            start={waterStart}
            end={waterEnd}
            editing={editing}
            onStart={setWaterStart}
            onEnd={setWaterEnd}
            idPrefix="water"
          />
          {rollback ? (
            <p className="text-destructive text-[11px] font-medium sm:col-span-2">
              Chỉ số cuối nhỏ hơn chỉ số đầu — không lưu được (HD-09).
            </p>
          ) : null}
          <p className="text-muted-foreground text-[11px] sm:col-span-2">
            {ownsMark
              ? "Hóa đơn này đang giữ mốc của phòng — sửa chỉ số cuối sẽ ghi đè mốc."
              : "Đã có ghi đè mốc mới hơn — sửa hóa đơn này không đụng tới mốc phòng (HD-08a)."}
          </p>
        </div>
      </section>

      {/* Dòng tiền — HD-06 sửa được cả sau khi lưu */}
      <section>
        <SectionHeader title="Các khoản" />
        {editing ? (
          <ItemsEditor items={items} onChange={setItems} idPrefix="inv" />
        ) : (
          <div className="bg-card border-border rounded-2xl border p-4">
            <ul className="space-y-2.5">
              {shownItems.map((item) => {
                const rec = recognized.find((r) => r.fee === item.fee);
                return (
                  <li key={item.fee} className="flex items-center gap-2 text-sm">
                    <span className="min-w-0 flex-1">
                      {FEE_LABEL[item.fee]}
                      {rec ? (
                        <span className="text-success ml-1.5 inline-flex items-center gap-0.5 text-[11px] font-medium">
                          <Check className="size-3" aria-hidden />
                          thu {dateLabel(rec.receipt_date)}
                        </span>
                      ) : item.amount !== 0 ? (
                        <span className="text-muted-foreground ml-1.5 text-[11px]">
                          chưa thu
                        </span>
                      ) : null}
                    </span>
                    <Money value={item.amount} signed className="font-semibold" />
                  </li>
                );
              })}
            </ul>

            <div className="border-border mt-3 space-y-1.5 border-t pt-3 text-sm">
              <p className="flex items-center">
                <span className="font-semibold">Tổng hóa đơn</span>
                <Money value={shownTotal} signed className="ml-auto text-lg font-bold" />
              </p>
              <p className="text-muted-foreground flex items-center text-xs">
                <span>Đã ghi nhận thu</span>
                <Money value={invoice.paid} className="ml-auto font-semibold" />
              </p>
              {remaining !== 0 ? (
                <p className="text-warning flex items-center text-xs font-semibold">
                  <span>Còn lại</span>
                  <Money value={remaining} className="ml-auto" />
                </p>
              ) : null}
            </div>
          </div>
        )}
      </section>

      {/* Lịch sử thu — TT-02 log riêng từng lần */}
      {receipts.length > 0 ? (
        <section>
          <SectionHeader title={`Lịch sử thu (${receipts.length})`} />
          <ul className="space-y-2">
            {receipts.map((r) => (
              <li
                key={r.id}
                className="bg-card border-border rounded-2xl border p-3"
              >
                <p className="flex items-center gap-2 text-xs font-semibold">
                  {dateLabel(r.receipt_date)}
                  {r.edited ? <Pill tone="neutral">đã sửa</Pill> : null}
                  <Money
                    value={r.items.reduce((s, i) => s + i.amount, 0)}
                    className="ml-auto"
                  />
                </p>
                <p className="text-muted-foreground mt-1 text-[11px]">
                  {r.items
                    .map((i) => `${FEE_LABEL[i.fee]} ${i.amount.toLocaleString("vi-VN")}đ`)
                    .join(" · ")}
                </p>
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground mt-2 px-1 text-[11px]">
            Số ghi nhận của mỗi khoản là bản ghi mới nhất, không cộng dồn (TT-03).
          </p>
        </section>
      ) : null}

      {/* Hành động */}
      {editing ? (
        <div className="fixed inset-x-0 bottom-16 z-20 border-t border-border bg-background/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-3xl gap-2 px-4 py-3 md:px-6">
            <button
              type="button"
              onClick={cancel}
              className="border-border focus-visible:ring-ring inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-xl border text-sm font-semibold focus-visible:ring-2 focus-visible:outline-none"
            >
              <Undo2 className="size-4" aria-hidden />
              Hủy
            </button>
            <button
              type="button"
              onClick={save}
              disabled={pending || rollback}
              className="bg-primary text-primary-foreground focus-visible:ring-ring inline-flex h-12 flex-[2] items-center justify-center rounded-xl text-sm font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-40"
            >
              {pending ? "Đang lưu…" : "Lưu hóa đơn"}
            </button>
          </div>
        </div>
      ) : (
        <div className="fixed inset-x-0 bottom-16 z-20 border-t border-border bg-background/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-3xl gap-2 px-4 py-3 md:px-6">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="border-border focus-visible:ring-ring inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-xl border text-sm font-semibold focus-visible:ring-2 focus-visible:outline-none"
            >
              <Pencil className="size-4" aria-hidden />
              Sửa
            </button>
            {/* HD-14: mọi hóa đơn ở bất kỳ đâu đều có CTA Thu tiền */}
            <button
              type="button"
              onClick={() => setCollecting(true)}
              className="bg-primary text-primary-foreground focus-visible:ring-ring inline-flex h-12 flex-[2] items-center justify-center gap-1.5 rounded-xl text-sm font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <Wallet className="size-4" aria-hidden />
              Thu tiền
            </button>
          </div>
        </div>
      )}

      <ReceiptSheet
        open={collecting}
        onOpenChange={setCollecting}
        invoiceId={invoice.id}
        items={invoice.items}
        recognized={recognized}
      />
    </div>
  );
}

function ReadingBlock({
  icon,
  label,
  unit,
  start,
  end,
  editing,
  onStart,
  onEnd,
  idPrefix,
}: {
  icon: React.ReactNode;
  label: string;
  unit: string;
  start: number | "";
  end: number | "";
  editing: boolean;
  onStart: (v: number | "") => void;
  onEnd: (v: number | "") => void;
  idPrefix: string;
}) {
  const used = consumption(Number(start || 0), Number(end || 0));

  return (
    <div>
      <p className="text-muted-foreground mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold">
        <span className="[&>svg]:size-3.5" aria-hidden>
          {icon}
        </span>
        {label}
      </p>

      {editing ? (
        <div className="grid grid-cols-2 gap-2">
          <NumberField id={`${idPrefix}-start`} label="Đầu" value={start} onChange={onStart} />
          <NumberField id={`${idPrefix}-end`} label="Cuối" value={end} onChange={onEnd} />
        </div>
      ) : (
        <p className="tabular text-sm font-semibold">
          {start} → {end}
        </p>
      )}

      <p className="text-muted-foreground mt-1 text-[11px]">
        Tiêu thụ <span className="tabular text-foreground font-semibold">{used}</span>{" "}
        {unit}
      </p>
    </div>
  );
}
