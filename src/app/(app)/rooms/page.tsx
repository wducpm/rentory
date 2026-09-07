import { Plus } from "lucide-react";
import Link from "next/link";
import { HeroHeader } from "@/components/hero-header";
import { NoBuilding } from "@/components/no-building";
import { RoomsBoard } from "@/components/rooms/rooms-board";
import { listRooms, NoBuildingError } from "@/lib/data";
import { currentBuildingSlug } from "@/lib/building";
import { daysUntil, isExpiringSoon, primaryName } from "@/lib/billing";
import { todayIso } from "@/lib/labels";

/** S-02 — danh sách phòng. */
export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;

  let data;
  try {
    data = await listRooms();
  } catch (e) {
    if (e instanceof NoBuildingError)
      return <NoBuilding slug={await currentBuildingSlug()} />;
    throw e;
  }

  // Tính ở server rồi truyền xuống: gọi new Date() trong client component sẽ
  // lệch múi giờ với server và gây hydration mismatch ở chuỗi "còn N ngày".
  const today = todayIso();

  const rooms = data.rooms.map(
    ({ room, status, contract, tenantName, invoiceCount, dueCount, dueAmount, dueInvoiceId }) => ({
      id: room.id,
      code: room.code,
      floor: room.floor,
      status,
      tenantName: contract ? (tenantName ?? primaryName(contract.occupants)) : null,
      occupantCount: contract?.occupants.length ?? 0,
      rent: contract?.rent ?? null,
      endDate: contract?.end_date ?? null,
      daysLeft: daysUntil(contract?.end_date ?? null, today),
      expiringSoon: isExpiringSoon(contract?.end_date ?? null, today),
      currentElec: Number(room.current_elec),
      currentWater: Number(room.current_water),
      dueCount,
      dueAmount,
      invoiceCount,
      dueInvoiceId,
    }),
  );

  return (
    <>
      <HeroHeader
        buildingName={data.building.name}
        address={data.building.address}
        actions={
          <Link
            href="/settings#rooms"
            aria-label="Thêm phòng"
            className="inline-flex size-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white backdrop-blur-md focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
          >
            <Plus className="size-5" aria-hidden />
          </Link>
        }
      />

      <main className="mx-auto max-w-3xl px-4 pb-6 md:px-6">
        <RoomsBoard
          rooms={rooms}
          initialFilter={filter === "due" ? "due" : "all"}
        />
      </main>
    </>
  );
}
