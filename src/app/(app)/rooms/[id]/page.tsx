import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRightLeft,
  ChevronRight,
  History,
  LogIn,
  LogOut,
  Receipt,
} from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { EmptyState, IconTile, Money, Pill, SectionHeader } from "@/components/ui-kit";
import { ContractCard } from "@/components/contract/contract-card";
import { getRoom } from "@/lib/data";
import { displayInvoiceCode } from "@/lib/billing";
import { dateLabel, INVOICE_TYPE_LABEL, periodsLine, ROOM_STATUS_LABEL } from "@/lib/labels";

/** S-03 — chi tiết phòng. */
export default async function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getRoom(id);
  if (!data) notFound();

  const { room, status, activeContract, invoices } = data;
  // CR-01 · BR-P04: trạng thái suy từ hợp đồng
  const occupied = status === "occupied" && activeContract;

  return (
    <>
      <AppHeader
        eyebrow={ROOM_STATUS_LABEL[status]}
        title={`Phòng ${room.code}`}
        backHref="/rooms"
        actions={
          <Link
            href={`/rooms/${room.id}/history`}
            aria-label="Lịch sử phòng"
            className="bg-card border-border focus-visible:ring-ring inline-flex size-11 items-center justify-center rounded-xl border focus-visible:ring-2 focus-visible:outline-none"
          >
            <History className="size-4" aria-hidden />
          </Link>
        }
      />

      <main className="mx-auto max-w-3xl space-y-5 px-4 pb-6 md:px-6">
        {/* Mốc hiện tại — N1 */}
        <section className="grid grid-cols-2 gap-3">
          <div className="bg-card border-border rounded-2xl border p-4">
            <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              Mốc điện
            </p>
            <p className="tabular mt-1 text-3xl leading-none font-bold">
              {room.current_elec}
            </p>
          </div>
          <div className="bg-card border-border rounded-2xl border p-4">
            <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              Mốc nước
            </p>
            <p className="tabular mt-1 text-3xl leading-none font-bold">
              {room.current_water}
            </p>
          </div>
        </section>

        {/* Hợp đồng hiện tại */}
        <section>
          <SectionHeader title="Hợp đồng hiện tại" />
          {occupied ? (
            <ContractCard
              contract={{
                id: activeContract.id,
                occupants: activeContract.occupants,
                rent: activeContract.rent,
                deposit: activeContract.deposit,
                start_date: activeContract.start_date,
                end_date: activeContract.end_date,
              }}
            />
          ) : (
            <EmptyState
              icon={<LogIn />}
              title="Phòng đang trống"
              description="Tạo hợp đồng và chốt số bàn giao để bắt đầu."
              actionLabel="Nhận phòng"
              actionHref={`/rooms/${room.id}/move-in`}
            />
          )}
        </section>

        {/* CTA */}
        <section className="grid grid-cols-2 gap-3">
          {occupied ? (
            <>
              <ActionLink
                href={`/rooms/${room.id}/move-out`}
                icon={<LogOut />}
                tone="warning"
                label="Trả phòng"
              />
              <ActionLink
                href="/meters"
                icon={<ArrowRightLeft />}
                tone="primary"
                label="Ghi chỉ số"
              />
            </>
          ) : (
            <>
              <ActionLink
                href={`/rooms/${room.id}/move-in`}
                icon={<LogIn />}
                tone="success"
                label="Nhận phòng"
              />
              <ActionLink
                href="/meters"
                icon={<ArrowRightLeft />}
                tone="primary"
                label="Sửa mốc"
              />
            </>
          )}
        </section>

        {/* Hóa đơn của phòng — HD-14 luôn mở lại được */}
        <section>
          <SectionHeader title="Hóa đơn" count={invoices.filter((i) => i.status === "due").length} />
          {invoices.length === 0 ? (
            <EmptyState icon={<Receipt />} title="Chưa có hóa đơn nào" />
          ) : (
            <ul className="space-y-2">
              {invoices.map((inv) => (
                <li key={inv.id}>
                  <Link
                    href={`/invoices/${inv.id}`}
                    className="bg-card border-border focus-visible:ring-ring active:bg-accent/40 flex items-center gap-3 rounded-2xl border p-3 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <IconTile tone={inv.status === "paid" ? "success" : "warning"}>
                      <Receipt />
                    </IconTile>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm font-semibold">
                        <span className="truncate">{displayInvoiceCode(inv.code)}</span>
                        <Pill tone={inv.status === "paid" ? "success" : "warning"}>
                          {inv.status === "paid" ? "Đã thu" : "Chưa thu"}
                        </Pill>
                      </p>
                      <p className="text-muted-foreground mt-0.5 truncate text-[11px]">
                        {INVOICE_TYPE_LABEL[inv.type]} · {dateLabel(inv.issue_date)}
                      </p>
                      <p className="text-muted-foreground truncate text-[11px]">
                        {periodsLine(inv.utility_period, inv.service_period)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <Money value={inv.total} className="text-sm font-semibold" />
                      {inv.status === "due" ? (
                        <p className="text-warning text-[11px] font-medium">
                          còn <Money value={inv.total - inv.paid} />
                        </p>
                      ) : null}
                    </div>
                    <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}

function ActionLink({
  href,
  icon,
  tone,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  tone: "success" | "warning" | "primary";
  label: string;
}) {
  return (
    <Link
      href={href}
      className="bg-card border-border focus-visible:ring-ring active:bg-accent/40 flex min-h-14 items-center gap-3 rounded-2xl border p-3 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <IconTile tone={tone} size="sm">
        {icon}
      </IconTile>
      {label}
    </Link>
  );
}
