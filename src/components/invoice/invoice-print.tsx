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
const INK = "#1a1a2e";
const BLUE = "#1a73e8";
const GREEN = "#00b578";
const RED = "#e8112d";
const MUTED = "#9aa0a6";
const LINE = "#eceef1";

const sheet: React.CSSProperties = {
  width: 720,
  boxSizing: "border-box",
  padding: "36px 34px 30px",
  background: "#ffffff",
  border: `1px solid ${LINE}`,
  borderRadius: 12,
  color: INK,
  fontFamily: FONT,
  fontSize: 14,
  lineHeight: 1.4,
};

const divider: React.CSSProperties = {
  height: 1,
  background: LINE,
  margin: "18px 0",
};

/** Nhãn mục lớn: ĐIỆN · NƯỚC · DỊCH VỤ CHUNG */
const sectionLabel: React.CSSProperties = {
  margin: 0,
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: 1.1,
};

/** Nhãn cột nhỏ màu xám bên trên từng con số */
const cellLabel: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: MUTED,
  fontWeight: 400,
};

const cellValue: React.CSSProperties = {
  margin: "6px 0 0",
  fontSize: 17,
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
          <h1 style={{ margin: 0, fontSize: 31, fontWeight: 700, letterSpacing: -0.3 }}>
            {model.title}
          </h1>
          {/* HD-13: mặt hóa đơn ghi rõ cả hai kỳ (mục 10 hạng mục 1) */}
          <p style={{ margin: "7px 0 0", fontSize: 12, color: MUTED }}>
            {model.periodsLine} · {model.code}
          </p>

          <div style={divider} />

          {/* Phòng + người đại diện · thời hạn hợp đồng */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 16,
              padding: "6px 0 2px",
            }}
          >
            <p style={{ margin: 0, fontSize: 19, fontWeight: 700, color: BLUE }}>
              {model.roomLine}
            </p>
            {model.contractTerm ? (
              <div style={{ textAlign: "right" }}>
                <p style={cellLabel}>Thời hạn hợp đồng</p>
                <p style={{ margin: "5px 0 0", fontSize: 19, color: BLUE }}>
                  {model.contractTerm}
                </p>
              </div>
            ) : null}
          </div>

          <div style={divider} />

          <SimpleRow label="GIÁ THUÊ" value={formatPrintAmount(model.rent)} />

          <div style={divider} />

          <MeterBlock
            label="ĐIỆN"
            usedLabel="Số điện đã sử dụng"
            start={model.elec.start}
            end={model.elec.end}
            used={`${model.elec.used} kWh`}
            amount={model.elec.amount}
          />

          <div style={divider} />

          <MeterBlock
            label="NƯỚC"
            usedLabel="Số nước đã sử dụng"
            start={model.water.start}
            end={model.water.end}
            used={`${model.water.used} m³`}
            amount={model.water.amount}
          />

          <div style={divider} />

          {/* DỊCH VỤ CHUNG: số người bên trái, tổng bên phải */}
          <div>
            <p style={sectionLabel}>DỊCH VỤ CHUNG</p>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 12,
              }}
            >
              <div>
                <p style={cellLabel}>Số người</p>
                <p style={cellValue}>{model.common.occupants}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={cellLabel}>Tổng</p>
                <p style={{ ...cellValue, fontWeight: 700 }}>
                  {formatPrintAmount(model.common.amount)}
                </p>
              </div>
            </div>
          </div>

          <div style={divider} />

          <SimpleRow label="INTERNET" value={formatPrintAmount(model.internet)} />

          {/* Dòng bổ sung theo loại hóa đơn: CỌC (nhận phòng) / HOÀN CỌC (trả phòng) */}
          {model.extraLines.map((line) => (
            <div key={line.fee}>
              <div style={divider} />
              <SimpleRow
                label={line.label}
                value={formatPrintAmount(line.amount)}
              />
            </div>
          ))}

          {/* Khối tổng kết */}
          <div
            style={{
              marginTop: 26,
              padding: "20px 22px",
              background: "#f7f8fa",
              borderRadius: 10,
            }}
          >
            <SummaryRow label="TIỀN PHÒNG" value={model.totals.room} color={GREEN} />
            <SummaryRow
              label="TIỀN DỊCH VỤ"
              value={model.totals.service}
              color={GREEN}
              spaced
            />
            <div style={{ height: 1, background: "#e4e7eb", margin: "14px 0" }} />
            <SummaryRow
              label="TỔNG"
              value={model.totals.grand}
              color={RED}
              strong
            />
          </div>

          {model.note ? (
            <p
              style={{
                margin: "26px 0 4px",
                textAlign: "center",
                fontSize: 15,
                fontWeight: 700,
                lineHeight: 1.5,
                letterSpacing: 0.2,
                whiteSpace: "pre-line",
                textTransform: "uppercase",
                color: RED,
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

/** Dòng một cặp nhãn–số: GIÁ THUÊ · INTERNET · CỌC · HOÀN CỌC */
function SimpleRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      <span style={sectionLabel}>{label}</span>
      <span
        style={{
          fontSize: 18,
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
    </div>
  );
}

/** Khối công tơ: 4 cột đầu kì · cuối kì · đã sử dụng · tổng */
function MeterBlock({
  label,
  usedLabel,
  start,
  end,
  used,
  amount,
}: {
  label: string;
  usedLabel: string;
  start: number;
  end: number;
  used: string;
  amount: number;
}) {
  return (
    <div>
      <p style={sectionLabel}>{label}</p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1.35fr 1.15fr",
          gap: 12,
          marginTop: 12,
        }}
      >
        <div>
          <p style={cellLabel}>Số đầu kì</p>
          <p style={cellValue}>{start}</p>
        </div>
        <div>
          <p style={cellLabel}>Số cuối kì</p>
          <p style={cellValue}>{end}</p>
        </div>
        <div>
          <p style={cellLabel}>{usedLabel}</p>
          <p style={cellValue}>{used}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={cellLabel}>Tổng</p>
          <p style={{ ...cellValue, fontWeight: 700 }}>
            {formatPrintAmount(amount)}
          </p>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  color,
  strong,
  spaced,
}: {
  label: string;
  value: number;
  color: string;
  strong?: boolean;
  spaced?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 16,
        marginTop: spaced ? 12 : 0,
      }}
    >
      <span
        style={{
          fontSize: strong ? 19 : 17,
          fontWeight: 700,
          letterSpacing: 0.3,
          color: strong ? color : INK,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: strong ? 23 : 19,
          fontWeight: 700,
          color,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formatPrintAmount(value)}
      </span>
    </div>
  );
}
