import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { MoveInForm } from "@/components/invoice/move-in-form";
import { getRoom, suggestedRent } from "@/lib/data";
import { primaryName } from "@/lib/billing";

/** S-07 — nhận phòng. */
export default async function MoveInPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getRoom(id);
  if (!data) notFound();

  if (data.activeContract) {
    return (
      <>
        <AppHeader
          title={`Phòng ${data.room.code}`}
          eyebrow="Nhận phòng"
          backHref={`/rooms/${id}`}
        />
        <main className="mx-auto max-w-3xl px-4 md:px-6">
          <p className="bg-card border-border rounded-2xl border p-4 text-sm">
            Phòng này đang có hợp đồng hiệu lực của{" "}
            <strong>{primaryName(data.activeContract.occupants)}</strong>. Trả phòng trước
            khi nhận khách mới.
          </p>
        </main>
      </>
    );
  }

  const s = data.settings;
  // FR-209 · BR-P18: giá hợp đồng gần nhất, null nếu là hợp đồng đầu tiên
  const rentHint = await suggestedRent(id);

  return (
    <>
      <AppHeader
        eyebrow="Nhận phòng"
        title={`Phòng ${data.room.code}`}
        backHref={`/rooms/${id}`}
      />
      <main className="mx-auto max-w-3xl px-4 pb-6 md:px-6">
        <MoveInForm
          room={{
            id: data.room.id,
            code: data.room.code,
            current_elec: Number(data.room.current_elec),
            current_water: Number(data.room.current_water),
          }}
          suggestedRent={rentHint}
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
