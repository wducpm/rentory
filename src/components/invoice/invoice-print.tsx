"use client";

import { useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { downloadDataUrl, nodeToPngDataUrl } from "@/lib/png";
import { formatPrintAmount, type InvoicePrintModel } from "@/lib/billing";

/**
 * Mục 7 — mẫu hóa đơn bản in / tải về.
 *
 * Toàn bộ khối `<article>` dùng **style inline** chứ không dùng class Tailwind:
 * nó được nhân bản vào SVG để xuất PNG, mà foreignObject không kéo theo
 * stylesheet ngoài (xem `lib/png.ts`). Nhờ vậy ảnh tải về giống hệt bản xem
 * trước, và không phụ thuộc light/dark mode của máy admin.
 */

const FONT = 'Arial, "Helvetica Neue", Helvetica, sans-serif';
const INK = "#16182b";
const MUTED = "#6b7280";
const LINE = "#e5e7eb";

const sheet: React.CSSProperties = {
  width: 720,
  boxSizing: "border-box",
  padding: 32,
  background: "#ffffff",
  color: INK,
  fontFamily: FONT,
  fontSize: 14,
  lineHeight: 1.45,
};

const cellLabel: React.CSSProperties = {
  padding: "2px 0 2px 16px",
  color: MUTED,
};
const cellValue: React.CSSProperties = {
  padding: "2px 0",
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
};

export function InvoicePrint({
  model,
  fileName,
}: {
  model: InvoicePrintModel;
  fileName: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [saving, setSaving] = useState(false);

  async function download() {
    if (!ref.current) return;
    setSaving(true);
    try {
      const url = await nodeToPngDataUrl(ref.current);
      downloadDataUrl(url, `${fileName}.png`);
      toast.success("Đã tải hóa đơn");
    } catch {
      toast.error("Không tạo được ảnh hóa đơn. Thử lại giúp t.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 pb-6">
      <div className="overflow-x-auto">
        <article ref={ref} style={sheet}>
          <div style={{ textAlign: "center" }}>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: 0.5 }}>
              {model.title}
            </h1>
            {/* HD-13: mặt hóa đơn ghi rõ cả hai kỳ */}
            <p style={{ margin: "4px 0 0", fontSize: 13, color: MUTED }}>
              {model.periodsLine}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9ca3af" }}>
              {model.code}
            </p>
          </div>

          <p style={{ margin: "24px 0 0", fontSize: 18, fontWeight: 700 }}>
            {model.roomLine}
          </p>
          {model.contractTerm ? (
            <p style={{ margin: "2px 0 0", fontSize: 13, color: MUTED }}>
              Thời hạn hợp đồng: {model.contractTerm}
            </p>
          ) : null}

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: 24,
              fontSize: 14,
            }}
          >
            <tbody>
              <Row label="GIÁ THUÊ" value={formatPrintAmount(model.rent)} bold />

              <Section label="ĐIỆN" />
              <Detail label="Số đầu kì" value={String(model.elec.start)} />
              <Detail label="Số cuối kì" value={String(model.elec.end)} />
              <Detail label="Số điện đã sử dụng" value={`${model.elec.used} kWh`} />
              <Row label="Tổng" value={formatPrintAmount(model.elec.amount)} />

              <Section label="NƯỚC" />
              <Detail label="Số đầu kì" value={String(model.water.start)} />
              <Detail label="Số cuối kì" value={String(model.water.end)} />
              <Detail label="Số nước đã sử dụng" value={`${model.water.used} m³`} />
              <Row label="Tổng" value={formatPrintAmount(model.water.amount)} />

              <Section label="DỊCH VỤ CHUNG" />
              <Detail label="Số người" value={String(model.common.occupants)} />
              <Row label="Tổng" value={formatPrintAmount(model.common.amount)} />

              <Section label="INTERNET" />
              <Row label="Tổng" value={formatPrintAmount(model.internet)} />

              {model.extraLines.map((line) => (
                <Row
                  key={line.fee}
                  label={line.label}
                  value={formatPrintAmount(line.amount)}
                  bold
                />
              ))}
            </tbody>
          </table>

          <div
            style={{
              marginTop: 24,
              paddingTop: 16,
              borderTop: `2px solid ${INK}`,
            }}
          >
            <Summary label="TIỀN PHÒNG" value={model.totals.room} />
            <Summary label="TIỀN DỊCH VỤ" value={model.totals.service} />
            <Summary label="TỔNG" value={model.totals.grand} strong />
          </div>

          {model.note ? (
            <p
              style={{
                margin: "24px 0 0",
                textAlign: "center",
                fontSize: 13,
                fontWeight: 700,
                lineHeight: 1.6,
                whiteSpace: "pre-line",
                color: "#dc2626",
              }}
            >
              {model.note}
            </p>
          ) : null}
        </article>
      </div>

      <button
        type="button"
        onClick={download}
        disabled={saving}
        className="bg-primary text-primary-foreground focus-visible:ring-ring inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-40"
      >
        {saving ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Download className="size-4" aria-hidden />
        )}
        Tải ảnh hóa đơn
      </button>

      {model.note === null ? (
        <p className="text-muted-foreground text-center text-[11px]">
          Thêm ghi chú cuối hóa đơn ở Cài đặt toà để hiện trên bản in.
        </p>
      ) : null}
    </div>
  );
}

function Section({ label }: { label: string }) {
  return (
    <tr>
      <td colSpan={2} style={{ padding: "16px 0 4px", fontWeight: 700 }}>
        {label}
      </td>
    </tr>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td style={cellLabel}>{label}</td>
      <td style={cellValue}>{value}</td>
    </tr>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <tr>
      <td style={bold ? { padding: "2px 0", fontWeight: 700 } : cellLabel}>
        {label}
      </td>
      <td style={{ ...cellValue, fontWeight: bold ? 700 : 600 }}>{value}</td>
    </tr>
  );
}

function Summary({
  label,
  value,
  strong,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <p
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        margin: strong ? "8px 0 0" : "0 0 2px",
        paddingTop: strong ? 8 : 0,
        borderTop: strong ? `1px solid ${LINE}` : undefined,
        fontSize: strong ? 20 : 15,
        fontWeight: strong ? 700 : 400,
      }}
    >
      <span style={{ fontWeight: strong ? 700 : 600 }}>{label}</span>
      <span style={{ fontVariantNumeric: "tabular-nums" }}>
        {formatPrintAmount(value)}
      </span>
    </p>
  );
}
