/**
 * Kiểu miền cho lib/billing — cố ý tách khỏi row type của Supabase để mọi
 * function ở đây là pure và test được mà không cần DB.
 * Tiền luôn là **số nguyên VND**. Kỳ luôn là chuỗi 'YYYY-MM'.
 */

export type InvoiceType = "move_in" | "periodic" | "move_out";

export type FeeType =
  | "rent"
  | "elec"
  | "water"
  | "internet"
  | "common"
  | "deposit"
  | "deposit_refund";

export type MarkSource =
  | "invoice_move_in"
  | "invoice_periodic"
  | "invoice_move_out"
  | "manual";

/** Chuỗi kỳ 'YYYY-MM'. */
export type Period = string;

/** Mốc công tơ (N1). */
export type Readings = {
  elec: number;
  water: number;
};

export type BuildingSettings = {
  elec_price: number;
  water_price: number;
  internet_fee: number;
  common_fee: number;
};

export type Contract = {
  id?: string;
  rent: number;
  occupants: number;
  deposit: number;
};

export type Room = {
  id?: string;
  code: string;
  current_elec: number;
  current_water: number;
};

/** Một dòng tiền trên hóa đơn. N7: độc lập với chỉ số. */
export type InvoiceItem = {
  fee: FeeType;
  amount: number;
  is_deposit: boolean;
};

/** Phần hóa đơn mà lib/billing sinh ra hoặc đọc. */
export type InvoiceDraft = {
  type: InvoiceType;
  issue_date: string; // 'YYYY-MM-DD'
  utility_period: Period | null;
  service_period: Period | null;
  elec_start: number;
  elec_end: number;
  water_start: number;
  water_end: number;
  items: InvoiceItem[];
};

/** Hóa đơn đã lưu, dùng cho recognized/marks. */
export type SavedInvoice = {
  id: string;
  issue_date: string;
  created_at?: string;
  elec_end: number;
  water_end: number;
  items: InvoiceItem[];
};

export type ReceiptItem = {
  fee: FeeType;
  amount: number;
};

export type Receipt = {
  id?: string;
  receipt_date: string; // 'YYYY-MM-DD'
  created_at?: string;
  items: ReceiptItem[];
};

export type MeterMarkLog = {
  room_id?: string;
  effective_date: string;
  elec: number;
  water: number;
  prev_elec: number;
  prev_water: number;
  source: MarkSource;
  invoice_id: string | null;
  note: string | null;
};
