import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { PeriodInvoice } from "@/components/invoice/period-invoice";
import { getRoomPeriodInvoices } from "@/lib/data";
import { periodOf, primaryName, type FeeType } from "@/lib/billing";
import { todayIso } from "@/lib/labels";

const PERIOD = /^\d{4}-(0[1-9]|1[0-2])$/;

/** S-11 — hóa đơn của phòng theo kỳ tháng, mặc định kỳ hiện tại. */
export default async function RoomInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { id } = await params;
  const { period: raw } = await searchParams;

  // Kỳ lấy từ URL để nút lùi/tiến và date picker đều là link chia sẻ được;
  // giá trị rác thì rơi về kỳ hiện tại thay vì vỡ màn hình.
  const period = raw && PERIOD.test(raw) ? raw : periodOf(todayIso());

  const data = await getRoomPeriodInvoices(id, period);
  if (!data) notFound();

  const { room, activeContract, invoices, overdue, months } = data;

  return (
    <>
      <AppHeader
        eyebrow={`Phòng ${room.code}`}
        title="Hóa đơn"
        backHref={`/rooms/${room.id}`}
      />

      <main className="mx-auto max-w-3xl px-4 pb-6 md:px-6">
        <PeriodInvoice
          roomId={room.id}
          roomCode={room.code}
          tenantName={
            activeContract ? primaryName(activeContract.occupants) : null
          }
          period={period}
          months={months}
          overdue={overdue}
          invoices={invoices.map((inv) => ({
            id: inv.id,
            code: inv.code,
            type: inv.type,
            issue_date: inv.issue_date,
            utility_period: inv.utility_period,
            service_period: inv.service_period,
            elec_start: Number(inv.elec_start),
            elec_end: Number(inv.elec_end),
            water_start: Number(inv.water_start),
            water_end: Number(inv.water_end),
            items: inv.items,
            total: inv.total,
            paid: inv.paid,
            status: inv.status,
            recognized: inv.recognized.map((r) => ({
              fee: r.fee as FeeType,
              amount: r.amount,
              receipt_date: r.receipt_date,
            })),
          }))}
        />
      </main>
    </>
  );
}
