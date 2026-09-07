"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Droplets,
  Gauge,
  TriangleAlert,
  Wallet,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { NumberField } from "@/components/forms/number-field";
import { TextField } from "@/components/forms/text-field";
import { EmptyState, Money, Pill } from "@/components/ui-kit";
import { createReceipt } from "@/lib/actions";
import {
  consumption,
  displayInvoiceCode,
  formatVnd,
  nextPeriod,
  prevPeriod,
  type FeeType,
  type InvoiceItem,
  type InvoiceType,
} from "@/lib/billing";
import {
  dateLabel,
  FEE_LABEL,
  INVOICE_TYPE_LABEL,
  periodLabel,
  periodsLine,
  todayIso,
} from "@/lib/labels";

export type PeriodInvoiceView = {
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
  items: InvoiceItem[];
  total: number;
  paid: number;
  status: "paid" | "due";
  recognized: { fee: FeeType; amount: number; receipt_date: string }[];
};

/**
 * S-11 — hóa đơn của một phòng theo kỳ tháng.
 *
 * Kỳ = tháng gọi tên hóa đơn: hóa đơn tháng M gồm điện nước tháng M−1 và dịch
 * vụ tháng M. Kỳ chưa chốt số thì màn này KHÔNG tự lập hóa đơn — việc lập nằm
 * ở tab Chỉ số, chốt cả tòa một lượt (FR-101).
 *
 * TT-01: mỗi khoản một checkbox và một ô tiền sửa được.
 * TT-05: khoản đã thu vẫn tick lại được, tạo bản ghi mới — không disable.
 * Khoản không tick vẫn nằm nguyên trên hóa đơn để thu tiếp ở lần sau.
 */
export function PeriodInvoice({
  roomId,
  roomCode,
  tenantName,
  period,
  invoices,
  overdue,
  months,
}: {
  roomId: string;
  roomCode: string;
  tenantName: string | null;
  period: string;
  invoices: PeriodInvoiceView[];
  overdue: { month: string; id: string; unpaid: number }[];
  months: string[];
}) {
  const router = useRouter();

  function go(p: string) {
    router.push(`/rooms/${roomId}/invoice?period=${p}`);
  }

  return (
    <div className="space-y-4">
      {/* Chọn kỳ — mỗi tháng một kỳ */}
      <section className="bg-card border-border rounded-2xl border p-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => go(prevPeriod(period))}
            aria-label="Kỳ trước"
            className="border-border focus-visible:ring-ring inline-flex size-10 shrink-0 items-center justify-center rounded-xl border focus-visible:ring-2 focus-visible:outline-none"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>

          <label className="min-w-0 flex-1 text-center">
            <span className="sr-only">Kỳ hóa đơn</span>
            <input
              type="month"
              value={period}
              onChange={(e) => e.target.value && go(e.target.value)}
              className="tabular border-input bg-card focus-visible:ring-ring h-10 w-full rounded-xl border px-3 text-center text-sm font-semibold focus-visible:ring-2 focus-visible:outline-none"
            />
          </label>

          <button
            type="button"
            onClick={() => go(nextPeriod(period))}
            aria-label="Kỳ sau"
            className="border-border focus-visible:ring-ring inline-flex size-10 shrink-0 items-center justify-center rounded-xl border focus-visible:ring-2 focus-visible:outline-none"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>

        <p className="text-muted-foreground mt-2 text-center text-[11px]">
          Hóa đơn {periodLabel(period)} — điện nước {periodLabel(prevPeriod(period))}
          , dịch vụ {periodLabel(period)}
        </p>
      </section>

      {/* Cảnh báo: kỳ đã qua mà còn nợ */}
      {overdue.length > 0 ? (
        <div className="bg-destructive-soft flex items-start gap-3 rounded-2xl p-3">
          <TriangleAlert
            className="text-destructive mt-0.5 size-5 shrink-0"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="text-destructive-strong text-sm font-semibold">
              Còn nợ {overdue.length} kỳ trước
            </p>
            <p className="text-muted-foreground mt-0.5 text-[11px]">
              Tổng{" "}
              {formatVnd(overdue.reduce((s, o) => s + o.unpaid, 0))} chưa thu từ{" "}
              {overdue.map((o) => periodLabel(o.month)).join(" · ")}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {overdue.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => go(o.month)}
                  className="bg-destructive text-primary-foreground focus-visible:ring-ring inline-flex h-8 items-center rounded-lg px-2.5 text-[11px] font-semibold focus-visible:ring-2 focus-visible:outline-none"
                >
                  Thu {periodLabel(o.month)}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {invoices.length === 0 ? (
        <EmptyState
          icon={<Gauge />}
          title={`Kỳ ${periodLabel(period)} chưa có hóa đơn`}
          description={
            months.length > 0
              ? "Chốt số điện nước ở tab Chỉ số để lập hóa đơn cho kỳ này."
              : "Phòng chưa phát sinh hóa đơn nào."
          }
          actionLabel="Mở tab Chỉ số"
          actionHref="/meters"
        />
      ) : (
        invoices.map((inv) => (
          <InvoiceCard
            key={inv.id}
            invoice={inv}
            roomCode={roomCode}
            tenantName={tenantName}
          />
        ))
      )}
    </div>
  );
}

type Line = { fee: FeeType; checked: boolean; amount: number | "" };

function buildLines(invoice: PeriodInvoiceView): Line[] {
  return invoice.items.map((i) => ({
    fee: i.fee,
    // Mặc định tick khoản chưa có bản ghi thu và khác 0 (TT-06a)
    checked: i.amount !== 0 && !invoice.recognized.some((r) => r.fee === i.fee),
    amount: i.amount,
  }));
}

function InvoiceCard({
  invoice,
  roomCode,
  tenantName,
}: {
  invoice: PeriodInvoiceView;
  roomCode: string;
  tenantName: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [date, setDate] = useState(todayIso());
  // Khởi tạo ngay từ props chứ không đợi effect: danh sách khoản thu phải có
  // mặt trong HTML render từ server, không thì màn chớp rỗng trước khi hydrate.
  const [lines, setLines] = useState<Line[]>(() => buildLines(invoice));

  // Sau khi ghi phiếu thu, router.refresh() đổi props mà không remount — đồng
  // bộ lại để khoản vừa thu chuyển sang trạng thái đã thu.
  useEffect(() => {
    setLines(buildLines(invoice));
  }, [invoice]);

  const picked = lines.filter((l) => l.checked);
  const pickedTotal = picked.reduce(
    (s, l) => s + (l.amount === "" ? 0 : Number(l.amount)),
    0,
  );
  const remaining = invoice.total - invoice.paid;

  function copy() {
    const lineText = invoice.items
      .map((i) => `${FEE_LABEL[i.fee]}: ${formatVnd(i.amount)}`)
      .join("\n");
    const text = [
      `${displayInvoiceCode(invoice.code)} — P.${roomCode}${tenantName ? ` · ${tenantName}` : ""}`,
      periodsLine(invoice.utility_period, invoice.service_period),
      `Điện: ${invoice.elec_start} → ${invoice.elec_end} (${consumption(invoice.elec_start, invoice.elec_end)} số)`,
      `Nước: ${invoice.water_start} → ${invoice.water_end} (${consumption(invoice.water_start, invoice.water_end)} khối)`,
      "",
      lineText,
      "",
      `Tổng: ${formatVnd(invoice.total)}`,
      invoice.paid > 0 ? `Đã thu: ${formatVnd(invoice.paid)}` : null,
      remaining > 0 ? `Còn phải thu: ${formatVnd(remaining)}` : "Đã thu đủ",
    ]
      .filter((l) => l !== null)
      .join("\n");

    // clipboard API cần secure context; localhost và https đều có, nhưng vẫn
    // bắt lỗi để trình duyệt chặn quyền không làm vỡ màn hình.
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success("Đã sao chép hóa đơn"))
      .catch(() => toast.error("Trình duyệt chặn sao chép — copy tay giúp t"));
  }

  function collect() {
    if (picked.length === 0) {
      toast.error("Chưa chọn khoản nào để thu");
      return;
    }
    start(async () => {
      const res = await createReceipt({
        invoice_id: invoice.id,
        receipt_date: date,
        items: picked.map((l) => ({
          fee: l.fee,
          amount: l.amount === "" ? 0 : Math.round(Number(l.amount)),
        })),
      });
      if (res.ok) {
        toast.success(`Đã ghi nhận thu ${formatVnd(pickedTotal)}`);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <section className="bg-card border-border space-y-3 rounded-2xl border p-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="tabular truncate text-base font-semibold">
            {displayInvoiceCode(invoice.code)}
          </p>
          <p className="text-muted-foreground mt-0.5 truncate text-[11px]">
            {INVOICE_TYPE_LABEL[invoice.type]} · lập{" "}
            {dateLabel(invoice.issue_date)}
          </p>
          <p className="text-muted-foreground truncate text-[11px]">
            {periodsLine(invoice.utility_period, invoice.service_period)}
          </p>
        </div>
        <Pill tone={invoice.status === "paid" ? "success" : "warning"}>
          {invoice.status === "paid" ? "Đã thu đủ" : "Chưa thu"}
        </Pill>
      </header>

      {/* Số đã chốt của kỳ — cơ sở của dòng điện và nước */}
      <div className="bg-muted grid grid-cols-2 gap-2 rounded-xl p-2.5">
        <Reading
          icon={<Zap />}
          label="Điện"
          start={invoice.elec_start}
          end={invoice.elec_end}
          unit="số"
        />
        <Reading
          icon={<Droplets />}
          label="Nước"
          start={invoice.water_start}
          end={invoice.water_end}
          unit="khối"
        />
      </div>

      {/* Các khoản — tick khoản sẽ thu, sửa số tiền theo thực tế */}
      <ul className="space-y-2">
        {lines.map((line, idx) => {
          const rec = invoice.recognized.find((r) => r.fee === line.fee);
          return (
            <li
              key={line.fee}
              className={cn(
                "border-border flex items-center gap-3 rounded-xl border p-3",
                rec && "bg-success-soft/40",
              )}
            >
              <Checkbox
                id={`${invoice.id}-${line.fee}`}
                checked={line.checked}
                className="size-5 shrink-0"
                onCheckedChange={(v) =>
                  setLines((prev) =>
                    prev.map((l, i) =>
                      i === idx ? { ...l, checked: v === true } : l,
                    ),
                  )
                }
              />
              <label
                htmlFor={`${invoice.id}-${line.fee}`}
                className="min-w-0 flex-1"
              >
                <span className="block truncate text-sm font-medium">
                  {FEE_LABEL[line.fee]}
                </span>
                <span className="text-muted-foreground block truncate text-[11px]">
                  {rec ? (
                    <>
                      Đã thu <Money value={rec.amount} /> ngày{" "}
                      {dateLabel(rec.receipt_date)}
                    </>
                  ) : (
                    "Chưa thu"
                  )}
                </span>
              </label>
              <NumberField
                id={`${invoice.id}-amount-${line.fee}`}
                value={line.amount}
                onChange={(v) =>
                  setLines((prev) =>
                    prev.map((l, i) => (i === idx ? { ...l, amount: v } : l)),
                  )
                }
                suffix="đ"
                className="w-32 shrink-0"
              />
            </li>
          );
        })}
      </ul>

      <dl className="border-border space-y-1 border-t pt-3 text-sm">
        <Row label="Tổng hóa đơn" value={invoice.total} />
        <Row label="Đã thu" value={invoice.paid} tone="text-success" />
        <Row
          label="Còn phải thu"
          value={remaining}
          tone={remaining > 0 ? "text-destructive" : "text-muted-foreground"}
          strong
        />
      </dl>

      <TextField
        id={`${invoice.id}-receipt-date`}
        type="date"
        label="Ngày thu"
        value={date}
        onChange={setDate}
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={copy}
          className="border-border focus-visible:ring-ring inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-xl border text-sm font-semibold focus-visible:ring-2 focus-visible:outline-none"
        >
          <Copy className="size-4" aria-hidden />
          Sao chép
        </button>
        <button
          type="button"
          onClick={collect}
          disabled={pending || picked.length === 0}
          className="bg-primary text-primary-foreground focus-visible:ring-ring inline-flex h-12 flex-[2] items-center justify-center gap-1.5 rounded-xl text-sm font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-40"
        >
          <Wallet className="size-4" aria-hidden />
          {pending
            ? "Đang lưu…"
            : picked.length === 0
              ? "Chọn khoản để thu"
              : `Thu ${formatVnd(pickedTotal)}`}
        </button>
      </div>
    </section>
  );
}

function Reading({
  icon,
  label,
  start,
  end,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  start: number;
  end: number;
  unit: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-muted-foreground flex items-center gap-1 text-[10px] font-semibold tracking-wide uppercase">
        <span className="text-info [&>svg]:size-3.5" aria-hidden>
          {icon}
        </span>
        {label}
      </p>
      <p className="tabular mt-0.5 truncate text-sm font-semibold">
        {start} → {end}{" "}
        <span className="text-muted-foreground text-[10px] font-normal">
          ({consumption(start, end)} {unit})
        </span>
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
  strong,
}: {
  label: string;
  value: number;
  tone?: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className={cn("tabular", strong ? "font-bold" : "font-semibold", tone)}>
        <Money value={value} />
      </dd>
    </div>
  );
}
