import { Gauge } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { NoBuilding } from "@/components/no-building";
import { EmptyState } from "@/components/ui-kit";
import { MetersGrid } from "@/components/meters/meters-grid";
import { listMeterRows, NoBuildingError } from "@/lib/data";
import { currentBuildingSlug } from "@/lib/building";

/** S-06 — nhập chỉ số / lập hóa đơn định kỳ + sửa mốc thủ công (HD-11). */
export default async function MetersPage() {
  let data;
  try {
    data = await listMeterRows();
  } catch (e) {
    if (e instanceof NoBuildingError)
      return <NoBuilding slug={await currentBuildingSlug()} />;
    throw e;
  }

  const s = data.settings;

  return (
    <>
      <AppHeader
        eyebrow={data.building.name}
        title="Chỉ số công tơ"
        icon={<Gauge />}
        tone="warning"
      />

      <main className="mx-auto max-w-3xl px-4 pb-6 md:px-6">
        {data.rooms.length === 0 ? (
          <EmptyState
            icon={<Gauge />}
            title="Chưa có phòng nào đang thuê"
            description="Chỉ phòng có hợp đồng hiệu lực mới lập được hóa đơn định kỳ (BR-M02)."
            actionLabel="Xem danh sách phòng"
            actionHref="/rooms"
          />
        ) : (
          <MetersGrid
            rows={data.rooms.map(({ room, contract }) => ({
              roomId: room.id,
              roomCode: room.code,
              currentElec: Number(room.current_elec),
              currentWater: Number(room.current_water),
              contract: {
                id: contract!.id,
                tenant_name: contract!.tenant_name,
                occupants: contract!.occupants,
                rent: contract!.rent,
                deposit: contract!.deposit,
              },
            }))}
            invoices={data.periodicInvoices.map((inv) => ({
              id: inv.id,
              contract_id: inv.contract_id,
              service_period: inv.service_period,
              utility_period: inv.utility_period,
              elec_start: Number(inv.elec_start),
              elec_end: Number(inv.elec_end),
              water_start: Number(inv.water_start),
              water_end: Number(inv.water_end),
              items: inv.items,
            }))}
            settings={{
              elec_price: s?.elec_price ?? 3800,
              water_price: s?.water_price ?? 30000,
              internet_fee: s?.internet_fee ?? 100000,
              common_fee: s?.common_fee ?? 150000,
            }}
          />
        )}
      </main>
    </>
  );
}
