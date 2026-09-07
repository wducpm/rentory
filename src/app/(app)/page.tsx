import Link from "next/link";
import {
  Building2,
  ClipboardList,
  Gauge,
  LogOut,
  Receipt,
  Settings2,
} from "lucide-react";
import { HeroAction, HeroHeader } from "@/components/hero-header";
import { NoBuilding } from "@/components/no-building";
import {
  AlertRow,
  EmptyState,
  FeatureCard,
  SectionHeader,
  StatCard,
} from "@/components/ui-kit";
import { headers } from "next/headers";
import { getDashboard, NoBuildingError } from "@/lib/data";
import { currentBuildingSlug } from "@/lib/building";
import { displayInvoiceCode, formatVnd } from "@/lib/billing";
import { dateLabel } from "@/lib/labels";

export default async function HomePage() {
  let data;
  try {
    data = await getDashboard();
  } catch (e) {
    if (e instanceof NoBuildingError)
      return <NoBuilding slug={await currentBuildingSlug()} />;
    throw e;
  }

  const {
    building,
    totalRooms,
    occupiedRooms,
    vacantRooms,
    period,
    periodInvoices,
    periodPaid,
    dueInvoices,
    dueAmount,
    unreadMeters,
  } = data;

  const host = (await headers()).get("host") ?? "";

  const occupancy = totalRooms ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  const collected = periodInvoices
    ? Math.round((periodPaid / periodInvoices) * 100)
    : 0;
  const month = Number(period.slice(5, 7));

  return (
    <>
      <HeroHeader
        buildingName={building.name}
        address={building.address}
        actions={
          <form action="/auth/signout" method="post">
            <HeroAction label="Đăng xuất">
              <LogOut className="size-4.5" aria-hidden />
            </HeroAction>
          </form>
        }
      />

      <main className="mx-auto max-w-3xl space-y-5 px-4 pb-6 md:px-6">
        {/* Chỉ số tổng quan — không có doanh thu / lãi lỗ (ngoài phạm vi) */}
        <section className="grid grid-cols-2 gap-3">
          {/* Footer chỉ mang thông tin mà con số lớn chưa nói — không lặp lại nó */}
          <StatCard
            label="Lấp đầy"
            value={occupiedRooms}
            denominator={`/ ${totalRooms} phòng`}
            percent={occupancy}
            tone="success"
            footerPill={vacantRooms > 0 ? `${vacantRooms} trống` : "Kín phòng"}
            footerPillTone={vacantRooms > 0 ? "neutral" : "success"}
          />
          <StatCard
            label={`Thu tiền T${month}`}
            value={periodPaid}
            denominator={`/ ${periodInvoices} đã thu`}
            percent={collected}
            tone="primary"
            footerPill={
              dueInvoices.length > 0
                ? `Còn ${dueInvoices.length} HĐ`
                : "Đã thu đủ"
            }
            footerPillTone={dueInvoices.length > 0 ? "warning" : "success"}
          />
        </section>

        {/* Chức năng chính */}
        <section className="grid grid-cols-2 gap-3">
          <FeatureCard
            href="/rooms"
            icon={<Building2 />}
            tone="info"
            badge="Sơ đồ"
            title="Quản lý phòng"
            subtitle={`${occupiedRooms} đang thuê · ${vacantRooms} trống`}
          />
          <FeatureCard
            href="/meters"
            icon={<Gauge />}
            tone="warning"
            badge={unreadMeters > 0 ? `Chưa ghi: ${unreadMeters}` : undefined}
            badgeTone="warning"
            title="Chỉ số điện nước"
            subtitle={`Chốt số kỳ T${month}`}
          />
          <FeatureCard
            href="/rooms?filter=due"
            icon={<Receipt />}
            tone="success"
            badge={dueInvoices.length > 0 ? `Chờ thu: ${dueInvoices.length}` : undefined}
            badgeTone="warning"
            title="Hóa đơn chưa thu"
            subtitle={
              dueAmount > 0 ? `Còn ${formatVnd(dueAmount)}` : "Đã thu đủ"
            }
          />
          <FeatureCard
            href="/settings"
            icon={<Settings2 />}
            tone="primary"
            title="Cài đặt toà"
            subtitle="Đơn giá & danh sách phòng"
          />
        </section>

        {/* Cần xử lý ngay — HD-14: mọi hóa đơn đều có CTA Thu tiền */}
        <section>
          <SectionHeader
            title="Cần xử lý ngay"
            count={dueInvoices.length}
            href={dueInvoices.length > 3 ? "/rooms?filter=due" : undefined}
          />

          {dueInvoices.length === 0 ? (
            <EmptyState
              icon={<ClipboardList />}
              title="Không còn hóa đơn chờ thu"
              description="Mọi hóa đơn đã có bản ghi thu cho từng khoản."
            />
          ) : (
            <ul className="space-y-2">
              {dueInvoices.slice(0, 5).map((inv) => (
                <li key={inv.id}>
                  <AlertRow
                    icon={<Receipt />}
                    tone="warning"
                    title={`P.${inv.roomCode}`}
                    meta={inv.tenantName ?? undefined}
                    detail={`${displayInvoiceCode(inv.code)} · còn ${formatVnd(inv.total - inv.paid)} · lập ${dateLabel(inv.issue_date)}`}
                    href={`/invoices/${inv.id}`}
                    action="Thu tiền"
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-muted-foreground px-1 text-center text-[11px]">
          <Link href="/settings" className="underline underline-offset-2">
            {host}
          </Link>
        </p>
      </main>
    </>
  );
}
