import { Settings2 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { NoBuilding } from "@/components/no-building";
import { SectionHeader } from "@/components/ui-kit";
import { PricesForm } from "@/components/settings/prices-form";
import { RoomsManager } from "@/components/settings/rooms-manager";
import { getBuildingContext, listRooms, NoBuildingError } from "@/lib/data";
import { currentBuildingSlug } from "@/lib/building";

/** S-10 — cài đặt tòa: 4 đơn giá + quản lý phòng. */
export default async function SettingsPage() {
  let ctx, rooms;
  try {
    ctx = await getBuildingContext();
    rooms = (await listRooms()).rooms;
  } catch (e) {
    if (e instanceof NoBuildingError)
      return <NoBuilding slug={await currentBuildingSlug()} />;
    throw e;
  }

  return (
    <>
      <AppHeader
        eyebrow={ctx.building.name}
        title="Cài đặt toà"
        icon={<Settings2 />}
        tone="info"
      />

      <main className="mx-auto max-w-3xl space-y-6 px-4 pb-6 md:px-6">
        <section>
          <SectionHeader title="Đơn giá" />
          <PricesForm
            initial={{
              elec_price: ctx.settings?.elec_price ?? 3800,
              water_price: ctx.settings?.water_price ?? 30000,
              internet_fee: ctx.settings?.internet_fee ?? 100000,
              common_fee: ctx.settings?.common_fee ?? 150000,
              invoice_note: ctx.settings?.invoice_note ?? "",
            }}
          />
        </section>

        <section id="rooms" className="scroll-mt-20">
          <SectionHeader title={`Phòng (${rooms.length})`} />
          <RoomsManager
            rooms={rooms.map(({ room }) => ({
              id: room.id,
              code: room.code,
              floor: room.floor,
              base_rent: room.base_rent,
              status: room.status,
              archived: room.archived,
            }))}
          />
        </section>
      </main>
    </>
  );
}
