import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { InvoicePrint } from "@/components/invoice/invoice-print";
import { getInvoice } from "@/lib/data";
import { buildPrintModel } from "@/lib/billing";

/** FR-107 · US-14 — xem và tải hóa đơn theo mẫu ở mục 7. */
export default async function InvoicePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getInvoice(id);
  if (!data || !data.room || !data.contract) notFound();

  const { invoice, room, contract, settings } = data;

  const model = buildPrintModel({
    type: invoice.type,
    code: invoice.code,
    utility_period: invoice.utility_period,
    service_period: invoice.service_period,
    elec_start: Number(invoice.elec_start),
    elec_end: Number(invoice.elec_end),
    water_start: Number(invoice.water_start),
    water_end: Number(invoice.water_end),
    items: invoice.items,
    roomCode: room.code,
    tenantName: contract.tenant_name,
    occupants: contract.occupants,
    contractStart: contract.start_date,
    contractEnd: contract.end_date,
    note: settings?.invoice_note ?? null,
  });

  return (
    <>
      <AppHeader
        eyebrow="Hóa đơn"
        title={`Phòng ${room.code}`}
        backHref={`/invoices/${invoice.id}`}
      />
      <main className="mx-auto max-w-3xl px-4 pb-6 md:px-6">
        <InvoicePrint
          model={model}
          fileName={`HD-P${room.code}-${invoice.service_period ?? invoice.utility_period}`}
        />
      </main>
    </>
  );
}
