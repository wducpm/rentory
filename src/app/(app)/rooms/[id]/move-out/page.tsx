import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { MoveOutForm } from "@/components/invoice/move-out-form";
import { getRoom } from "@/lib/data";

/** S-08 — trả phòng. */
export default async function MoveOutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getRoom(id);
  if (!data) notFound();

  if (!data.activeContract) {
    return (
      <>
        <AppHeader
          eyebrow="Trả phòng"
          title={`Phòng ${data.room.code}`}
          backHref={`/rooms/${id}`}
        />
        <main className="mx-auto max-w-3xl px-4 md:px-6">
          <p className="bg-card border-border rounded-2xl border p-4 text-sm">
            Phòng này đang trống, không có hợp đồng để tất toán.
          </p>
        </main>
      </>
    );
  }

  const s = data.settings;
  const c = data.activeContract;

  return (
    <>
      <AppHeader
        eyebrow="Trả phòng"
        title={`Phòng ${data.room.code}`}
        backHref={`/rooms/${id}`}
      />
      <main className="mx-auto max-w-3xl px-4 pb-6 md:px-6">
        <MoveOutForm
          room={{
            id: data.room.id,
            code: data.room.code,
            current_elec: Number(data.room.current_elec),
            current_water: Number(data.room.current_water),
          }}
          contract={{
            id: c.id,
            tenant_name: c.tenant_name,
            occupants: c.occupants,
            rent: c.rent,
            deposit: c.deposit,
          }}
          settings={{
            elec_price: s?.elec_price ?? 3800,
            water_price: s?.water_price ?? 30000,
            internet_fee: s?.internet_fee ?? 100000,
            common_fee: s?.common_fee ?? 150000,
          }}
        />
      </main>
    </>
  );
}
