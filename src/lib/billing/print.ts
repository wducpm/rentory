import type { FeeType, InvoiceItem, InvoiceType } from "./types";
import { consumption } from "./defaults";
import { displayInvoiceCode } from "./code";
import { periodMonth, periodYear } from "./periods";

/**
 * Mục 7 — mẫu hóa đơn bản in / tải về.
 *
 * N7: mọi số tiền lấy thẳng từ snapshot trên hóa đơn, KHÔNG tính lại từ chỉ số.
 * Nếu admin đã chỉnh tay (VD thu bù công tơ cũ, HD-12) thì bản in thể hiện đúng
 * số đã chỉnh, kể cả khi không khớp tiêu thụ.
 */

/** Định dạng theo mẫu in: dấu phẩy ngăn nghìn + hậu tố " VND". */
export function formatPrintAmount(value: number): string {
  const sign = value < 0 ? "-" : "";
  return `${sign}${Math.abs(value).toLocaleString("en-US")} VND`;
}

export type PrintLine = {
  fee: FeeType;
  label: string;
  amount: number;
};

export type InvoicePrintModel = {
  /** "HÓA ĐƠN THÁNG 9/2026" — theo **kỳ dịch vụ** (mục 10 hạng mục 1). */
  title: string;
  /** Dòng nhỏ thỏa HD-13: "Điện nước T8/2026 · Dịch vụ T9/2026". */
  periodsLine: string;
  code: string;
  roomLine: string;
  contractTerm: string | null;
  rent: number;
  elec: { start: number; end: number; used: number; amount: number };
  water: { start: number; end: number; used: number; amount: number };
  common: { occupants: number; amount: number };
  internet: number;
  /** Dòng bổ sung theo loại hóa đơn: cọc (nhận phòng) / hoàn cọc (trả phòng). */
  extraLines: PrintLine[];
  totals: { room: number; service: number; grand: number };
  note: string | null;
};

type PrintInput = {
  type: InvoiceType;
  code: string;
  utility_period: string | null;
  service_period: string | null;
  elec_start: number;
  elec_end: number;
  water_start: number;
  water_end: number;
  items: InvoiceItem[];
  roomCode: string;
  tenantName: string;
  occupants: number;
  contractStart: string | null;
  contractEnd: string | null;
  note: string | null;
};

const amountOf = (items: InvoiceItem[], fee: FeeType) =>
  items.find((i) => i.fee === fee)?.amount ?? 0;

/** 'YYYY-MM' → 'THÁNG 9/2026' */
function monthTitle(period: string | null): string {
  if (!period) return "";
  return `THÁNG ${periodMonth(period)}/${periodYear(period)}`;
}

/** 'YYYY-MM' → 'T9/2026' */
function shortPeriod(period: string): string {
  return `T${periodMonth(period)}/${periodYear(period)}`;
}

/** 'YYYY-MM-DD' → 'DD/MM/YYYY' */
function vnDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export function buildPrintModel(input: PrintInput): InvoicePrintModel {
  const {
    items,
    utility_period,
    service_period,
    elec_start,
    elec_end,
    water_start,
    water_end,
  } = input;

  // Trả phòng không có kỳ dịch vụ → tiêu đề lấy theo kỳ điện nước
  const titlePeriod = service_period ?? utility_period;

  const periods: string[] = [];
  if (utility_period) periods.push(`Điện nước ${shortPeriod(utility_period)}`);
  if (service_period) periods.push(`Dịch vụ ${shortPeriod(service_period)}`);

  const elecAmount = amountOf(items, "elec");
  const waterAmount = amountOf(items, "water");
  const commonAmount = amountOf(items, "common");
  const internetAmount = amountOf(items, "internet");
  const rent = amountOf(items, "rent");

  const extraLines: PrintLine[] = [];
  const deposit = items.find((i) => i.fee === "deposit");
  if (deposit) extraLines.push({ fee: "deposit", label: "CỌC", amount: deposit.amount });
  const refund = items.find((i) => i.fee === "deposit_refund");
  if (refund)
    extraLines.push({
      fee: "deposit_refund",
      label: "HOÀN CỌC",
      amount: refund.amount,
    });

  return {
    title: `HÓA ĐƠN ${monthTitle(titlePeriod)}`,
    periodsLine: periods.join(" · "),
    code: displayInvoiceCode(input.code),
    roomLine: `P${input.roomCode} - ${input.tenantName.toUpperCase()}`,
    contractTerm:
      input.contractStart && input.contractEnd
        ? `${vnDate(input.contractStart)} - ${vnDate(input.contractEnd)}`
        : input.contractStart
          ? `Từ ${vnDate(input.contractStart)}`
          : null,
    rent,
    elec: {
      start: elec_start,
      end: elec_end,
      used: consumption(elec_start, elec_end),
      amount: elecAmount,
    },
    water: {
      start: water_start,
      end: water_end,
      used: consumption(water_start, water_end),
      amount: waterAmount,
    },
    common: { occupants: input.occupants, amount: commonAmount },
    internet: internetAmount,
    extraLines,
    totals: {
      room: rent,
      // Mục 7: TIỀN DỊCH VỤ = điện + nước + dịch vụ chung + internet
      service: elecAmount + waterAmount + commonAmount + internetAmount,
      // TỔNG = toàn bộ dòng phí, gồm cả cọc / hoàn cọc
      grand: items.reduce((s, i) => s + i.amount, 0),
    },
    note: input.note,
  };
}
