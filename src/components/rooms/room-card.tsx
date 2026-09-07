"use client";

import Link from "next/link";
import { ChevronRight, User, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { Money, Pill } from "@/components/ui-kit";
import { formatVnd } from "@/lib/billing";
import { dateLabel } from "@/lib/labels";
import { MeterPair } from "./meter-pair";

export type RoomCardData = {
  id: string;
  code: string;
  floor: number | null;
  status: "occupied" | "vacant";
  tenantName: string | null;
  occupantCount: number;
  rent: number | null;
  endDate: string | null;
  /** Số ngày còn lại tới hạn HĐ; âm = đã quá hạn; null = không thời hạn. */
  daysLeft: number | null;
  expiringSoon: boolean;
  currentElec: number;
  currentWater: number;
  dueCount: number;
  dueAmount: number;
  invoiceCount: number;
  /** Hóa đơn chưa thu cũ nhất — đích của nút Thu tiền. */
  dueInvoiceId: string | null;
};

/**
 * Thẻ phòng theo `docs/ui/menu quản lý phòng`.
 *
 * Phòng trống cố tình không hiện tên khách và công nợ (BR-P10) — lịch sử khách
 * cũ vẫn xem được trong chi tiết phòng.
 */
export function RoomCard({ room }: { room: RoomCardData }) {
  const occupied = room.status === "occupied";
  const overdue = room.daysLeft !== null && room.daysLeft < 0;

  return (
    <article className="bg-card border-border rounded-2xl border p-4">
      {/* Hàng đầu: mã phòng + trạng thái · giá thuê + công nợ */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/rooms/${room.id}`}
              className="tabular focus-visible:ring-ring rounded-md text-xl font-semibold focus-visible:ring-2 focus-visible:outline-none"
            >
              P.{room.code}
            </Link>
            {room.expiringSoon ? (
              <Pill tone={overdue ? "destructive" : "warning"}>
                {overdue
                  ? `QUÁ HẠN ${-room.daysLeft!} NGÀY`
                  : `HẾT HẠN: ${room.daysLeft} NGÀY`}
              </Pill>
            ) : (
              <Pill tone={occupied ? "success" : "destructive"}>
                {occupied ? "ĐANG THUÊ" : "TRỐNG"}
              </Pill>
            )}
          </div>

          <p className="text-muted-foreground mt-1 flex items-center gap-1.5 truncate text-sm">
            {occupied ? (
              <>
                <User className="size-3.5 shrink-0" aria-hidden />
                <span className="text-foreground truncate font-medium">
                  {room.tenantName}
                </span>
                <span className="shrink-0">· {room.occupantCount} khách</span>
              </>
            ) : (
              <span className="text-success font-medium">Sẵn sàng cho thuê</span>
            )}
          </p>
        </div>

        <div className="shrink-0 text-right">
          {room.rent !== null ? (
            <p className="tabular text-primary text-sm font-semibold">
              {formatVnd(room.rent)}
            </p>
          ) : null}
          {occupied && room.invoiceCount > 0 ? (
            <p className="mt-1">
              {room.dueCount > 0 ? (
                <Pill tone="destructive">
                  Chưa thu: <Money value={room.dueAmount} />
                </Pill>
              ) : (
                <Pill tone="success">Đã thu đủ</Pill>
              )}
            </p>
          ) : null}
        </div>
      </div>

      {/* Module chỉ số công tơ */}
      <MeterPair
        className="mt-3"
        elec={room.currentElec}
        water={room.currentWater}
        elecLabel={occupied ? "Chỉ số điện" : "Chỉ số bàn giao"}
      />

      {/* Hàng hành động */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-muted-foreground min-w-0 truncate text-xs">
          {occupied
            ? room.endDate
              ? `HĐ đến: ${dateLabel(room.endDate)}`
              : "HĐ không thời hạn"
            : "Chưa có hợp đồng"}
        </p>

        {occupied ? (
          room.dueCount > 0 && room.dueInvoiceId ? (
            <CardAction
              href={`/invoices/${room.dueInvoiceId}`}
              tone="primary"
              icon={<Wallet className="size-4" aria-hidden />}
            >
              Thu tiền
            </CardAction>
          ) : (
            <CardAction href={`/rooms/${room.id}`} tone="muted">
              Chi tiết
            </CardAction>
          )
        ) : (
          <CardAction href={`/rooms/${room.id}/move-in`} tone="primary">
            + Nhận phòng
          </CardAction>
        )}
      </div>
    </article>
  );
}

function CardAction({
  href,
  tone,
  icon,
  children,
}: {
  href: string;
  tone: "primary" | "muted";
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "focus-visible:ring-ring inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        tone === "primary"
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-secondary-foreground",
      )}
    >
      {icon}
      {children}
      {tone === "muted" ? (
        <ChevronRight className="size-3.5" aria-hidden />
      ) : null}
    </Link>
  );
}
