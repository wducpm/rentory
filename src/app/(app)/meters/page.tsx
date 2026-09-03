import { Gauge } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { NoBuilding } from "@/components/no-building";
import { EmptyState } from "@/components/ui-kit";
import { MetersGrid } from "@/components/meters/meters-grid";
import { listOccupiedRooms, NoBuildingError } from "@/lib/data";
import { currentBuildingSlug } from "@/lib/building";

/** S-06 — nhập chỉ số / chốt kỳ + sửa mốc thủ công (HD-11). */
export default async function MetersPage() {
  let data;
  try {
    data = await listOccupiedRooms();
  } catch (e) {
    if (e instanceof NoBuildingError)
      return <NoBuilding slug={await currentBuildingSlug()} />;
    throw e;
  }

  const settings = data.settings ?? {
    building_id: data.building.id,
    elec_price: 3800,
    water_price: 30000,
    internet_fee: 100000,
    common_fee: 150000,
    updated_at: "",
  };

  const rows = data.rooms.map(({ room, contract }) => ({
    roomId: room.id,
    roomCode: room.code,
    status: room.status,
    currentElec: Number(room.current_elec),
    currentWater: Number(room.current_water),
    contract: contract
      ? {
          id: contract.id,
          tenant_name: contract.tenant_name,
          occupants: contract.occupants,
          rent: contract.rent,
          deposit: contract.deposit,
        }
      : null,
  }));

  return (
    <>
      <AppHeader
        eyebrow={data.building.name}
        title="Chỉ số điện nước"
        icon={<Gauge />}
        tone="warning"
      />

      <main className="mx-auto max-w-3xl px-4 pb-6 md:px-6">
        {rows.length === 0 ? (
          <EmptyState
            icon={<Gauge />}
            title="Chưa có phòng nào"
            description="Thêm phòng ở Cài đặt toà trước khi ghi chỉ số."
            actionLabel="Cài đặt toà"
            actionHref="/settings#rooms"
          />
        ) : (
          <MetersGrid
            rows={rows}
            settings={{
              elec_price: settings.elec_price,
              water_price: settings.water_price,
              internet_fee: settings.internet_fee,
              common_fee: settings.common_fee,
            }}
          />
        )}
      </main>
    </>
  );
}
