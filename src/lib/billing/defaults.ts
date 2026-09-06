import type {
  BuildingSettings,
  Contract,
  ContractOccupant,
  InvoiceDraft,
  InvoiceItem,
  Readings,
  Room,
} from "./types";
import { occupantCount } from "./occupants";
import { derivePeriods } from "./periods";
import { vnd } from "./money";

/** Tiêu thụ giữa hai mốc. Không bao giờ âm. */
export function consumption(start: number, end: number): number {
  return Math.max(0, Number(end) - Number(start));
}

/**
 * Thứ tự dòng tiền trên mọi hóa đơn — cố định để 3 loại nhìn giống nhau
 * (4.3: "cùng một cấu trúc"; HD-03: "vẫn hiển thị đầy đủ mọi khoản").
 */
export const FEE_ORDER = [
  "rent",
  "elec",
  "water",
  "internet",
  "common",
  "deposit",
  "deposit_refund",
] as const;

function serviceItems(
  contract: Contract,
  occupants: ContractOccupant[],
  settings: BuildingSettings,
  amountScale: 0 | 1,
): InvoiceItem[] {
  return [
    { fee: "rent", amount: vnd(contract.rent * amountScale), is_deposit: false },
    {
      fee: "internet",
      amount: vnd(settings.internet_fee * amountScale),
      is_deposit: false,
    },
    {
      // BR-P15: số người = số dòng người ở, không có cột lưu sẵn
      fee: "common",
      amount: vnd(settings.common_fee * occupantCount(occupants) * amountScale),
      is_deposit: false,
    },
  ];
}

/**
 * HD-01 — Hóa đơn nhận phòng.
 * Điện = nước = 0; chỉ số đầu = chỉ số cuối = số chốt bàn giao.
 * Dịch vụ của kỳ hiện tại list đầy đủ dù khách chỉ ở vài ngày (admin sửa hoặc
 * đưa về 0). Có dòng Cọc (+).
 */
export function moveInDefaults(
  contract: Contract,
  occupants: ContractOccupant[],
  settings: BuildingSettings,
  marks: Readings,
  issueDate: string,
): InvoiceDraft {
  const { utility_period, service_period } = derivePeriods("move_in", issueDate);
  const elec = Number(marks.elec);
  const water = Number(marks.water);

  return {
    type: "move_in",
    issue_date: issueDate,
    utility_period,
    service_period,
    // HD-01: chỉ số đầu = chỉ số cuối → tiêu thụ 0
    elec_start: elec,
    elec_end: elec,
    water_start: water,
    water_end: water,
    items: sortItems([
      ...serviceItems(contract, occupants, settings, 1),
      { fee: "elec", amount: 0, is_deposit: false },
      { fee: "water", amount: 0, is_deposit: false },
      // HD-15: cọc thể hiện trên hóa đơn nhưng không tính doanh thu
      { fee: "deposit", amount: vnd(contract.deposit), is_deposit: true },
    ]),
  };
}

/**
 * HD-02 — Hóa đơn định kỳ.
 * Chỉ số đầu = mốc hiện tại của phòng, chỉ số cuối = số chốt kỳ.
 * Điện nước thuộc kỳ vừa kết thúc; dịch vụ thuộc kỳ tiếp theo (4.1). Không cọc.
 */
export function periodicDefaults(
  contract: Contract,
  occupants: ContractOccupant[],
  settings: BuildingSettings,
  room: Room,
  endReadings: Readings,
  issueDate: string,
): InvoiceDraft {
  const { utility_period, service_period } = derivePeriods("periodic", issueDate);

  const elecStart = Number(room.current_elec);
  const waterStart = Number(room.current_water);
  const elecEnd = Number(endReadings.elec);
  const waterEnd = Number(endReadings.water);

  return {
    type: "periodic",
    issue_date: issueDate,
    utility_period,
    service_period,
    elec_start: elecStart,
    elec_end: elecEnd,
    water_start: waterStart,
    water_end: waterEnd,
    items: sortItems([
      ...serviceItems(contract, occupants, settings, 1),
      {
        fee: "elec",
        amount: vnd(consumption(elecStart, elecEnd) * settings.elec_price),
        is_deposit: false,
      },
      {
        fee: "water",
        amount: vnd(consumption(waterStart, waterEnd) * settings.water_price),
        is_deposit: false,
      },
    ]),
  };
}

/**
 * HD-03 — Hóa đơn trả phòng.
 * Chỉ số đầu = mốc hiện tại, chỉ số cuối = số chốt.
 * Dòng dịch vụ mặc định 0 (đã thu trước ở kỳ liền trước) — admin quyết có hoàn
 * lại không. Dòng Hoàn cọc (−) mặc định bằng cọc gốc, admin sửa tự do.
 */
export function moveOutDefaults(
  contract: Contract,
  occupants: ContractOccupant[],
  settings: BuildingSettings,
  room: Room,
  endReadings: Readings,
  issueDate: string,
): InvoiceDraft {
  const { utility_period, service_period } = derivePeriods("move_out", issueDate);

  const elecStart = Number(room.current_elec);
  const waterStart = Number(room.current_water);
  const elecEnd = Number(endReadings.elec);
  const waterEnd = Number(endReadings.water);

  return {
    type: "move_out",
    issue_date: issueDate,
    utility_period,
    service_period,
    elec_start: elecStart,
    elec_end: elecEnd,
    water_start: waterStart,
    water_end: waterEnd,
    items: sortItems([
      // HD-03: dịch vụ mặc định 0 nhưng vẫn hiển thị đầy đủ
      ...serviceItems(contract, occupants, settings, 0),
      {
        fee: "elec",
        amount: vnd(consumption(elecStart, elecEnd) * settings.elec_price),
        is_deposit: false,
      },
      {
        fee: "water",
        amount: vnd(consumption(waterStart, waterEnd) * settings.water_price),
        is_deposit: false,
      },
      // HD-15 + 4.3: hoàn cọc là dòng âm, không tính doanh thu
      {
        fee: "deposit_refund",
        amount: -vnd(contract.deposit),
        is_deposit: true,
      },
    ]),
  };
}

function sortItems(items: InvoiceItem[]): InvoiceItem[] {
  return [...items].sort(
    (a, b) => FEE_ORDER.indexOf(a.fee) - FEE_ORDER.indexOf(b.fee),
  );
}

/** Tổng hóa đơn = tổng mọi dòng, kể cả cọc / hoàn cọc (dòng âm). */
export function invoiceTotal(items: InvoiceItem[]): number {
  return items.reduce((sum, i) => sum + i.amount, 0);
}

/** HD-15: doanh thu loại trừ mọi dòng cọc. */
export function revenueTotal(items: InvoiceItem[]): number {
  return items
    .filter((i) => !i.is_deposit)
    .reduce((sum, i) => sum + i.amount, 0);
}
