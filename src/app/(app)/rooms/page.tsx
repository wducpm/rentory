import Link from "next/link";
import { Building2, ChevronRight, Plus, Receipt } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { NoBuilding } from "@/components/no-building";
import { EmptyState, IconTile, Money, Pill } from "@/components/ui-kit";
import type { Tone } from "@/components/ui-kit";
import { listRooms, NoBuildingError } from "@/lib/data";
import { currentBuildingSlug } from "@/lib/building";
import { ROOM_STATUS_LABEL } from "@/lib/labels";

const STATUS_TONE: Record<keyof typeof ROOM_STATUS_LABEL, Tone> = {
  occupied: "success",
  vacant: "neutral",
  maintenance: "warning",
};

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

  const onlyDue = filter === "due";
  const rooms = onlyDue ? data.rooms.filter((r) => r.dueCount > 0) : data.rooms;

  return (
    <>
      <AppHeader
        eyebrow={data.building.name}
        title={onlyDue ? "Phòng chưa thu" : "Phòng"}
        icon={<Building2 />}
        actions={
          <Link
            href="/settings#rooms"
            aria-label="Thêm phòng"
            className="bg-primary text-primary-foreground focus-visible:ring-ring inline-flex size-11 items-center justify-center rounded-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <Plus className="size-5" aria-hidden />
          </Link>
        }
      />

      <main className="mx-auto max-w-3xl px-4 pb-6 md:px-6">
        <div className="mb-3 flex gap-2">
          <FilterTab href="/rooms" active={!onlyDue} label={`Tất cả (${data.rooms.length})`} />
          <FilterTab
            href="/rooms?filter=due"
            active={onlyDue}
            label={`Chưa thu (${data.rooms.filter((r) => r.dueCount > 0).length})`}
          />
        </div>

        {rooms.length === 0 ? (
          <EmptyState
            icon={<Building2 />}
            title={onlyDue ? "Không còn phòng nào chưa thu" : "Chưa có phòng nào"}
            description={
              onlyDue
                ? undefined
                : "Thêm phòng ở màn Cài đặt toà để bắt đầu quản lý hóa đơn."
            }
            actionLabel={onlyDue ? undefined : "Thêm phòng"}
            actionHref={onlyDue ? undefined : "/settings#rooms"}
          />
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {rooms.map(({ room, contract, dueCount, dueAmount }) => (
              <li key={room.id}>
                <Link
                  href={`/rooms/${room.id}`}
                  className="bg-card border-border focus-visible:ring-ring active:bg-accent/40 flex items-center gap-3 rounded-2xl border p-3 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  <IconTile tone={STATUS_TONE[room.status]}>
                    <Building2 />
                  </IconTile>

                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <span>P.{room.code}</span>
                      <Pill tone={STATUS_TONE[room.status]}>
                        {ROOM_STATUS_LABEL[room.status]}
                      </Pill>
                    </p>
                    <p className="text-muted-foreground mt-0.5 truncate text-xs">
                      {contract
                        ? `${contract.tenant_name} · ${contract.occupants} người`
                        : "Chưa có khách"}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-[11px]">
                      Mốc: <span className="tabular">{room.current_elec}</span> điện ·{" "}
                      <span className="tabular">{room.current_water}</span> nước
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {dueCount > 0 ? (
                      <>
                        <Pill tone="warning">
                          <Receipt className="size-3" aria-hidden />
                          {dueCount} chưa thu
                        </Pill>
                        <Money
                          value={dueAmount}
                          className="text-warning text-xs font-semibold"
                        />
                      </>
                    ) : (
                      <Pill tone="success">Đã thu đủ</Pill>
                    )}
                    <ChevronRight
                      className="text-muted-foreground size-4"
                      aria-hidden
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}

function FilterTab({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "bg-primary text-primary-foreground inline-flex h-9 items-center rounded-xl px-3 text-xs font-semibold"
          : "bg-card border-border text-muted-foreground inline-flex h-9 items-center rounded-xl border px-3 text-xs font-semibold"
      }
    >
      {label}
    </Link>
  );
}
