import { notFound } from "next/navigation";
import Link from "next/link";
import { FileDown } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { InvoiceDetail } from "@/components/invoice/invoice-detail";
import { getInvoice } from "@/lib/data";
import { displayInvoiceCode, primaryName } from "@/lib/billing";
import { INVOICE_TYPE_LABEL } from "@/lib/labels";
import type { FeeType } from "@/lib/billing";

/** S-04 — chi tiết hóa đơn (kèm S-05 sheet thu tiền). */
export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getInvoice(id);
  if (!data || !data.room) notFound();

  const { invoice, room, contract, receipts, recognized } = data;

  return (
    <>
      <AppHeader
        eyebrow={`${INVOICE_TYPE_LABEL[invoice.type]} · P.${room.code}`}
        title={displayInvoiceCode(invoice.code)}
        backHref={`/rooms/${room.id}`}
        actions={
          <Link
            href={`/invoices/${invoice.id}/print`}
            aria-label="Xem và tải hóa đơn"
            className="bg-card border-border focus-visible:ring-ring inline-flex size-10 items-center justify-center rounded-xl border focus-visible:ring-2 focus-visible:outline-none"
          >
            <FileDown className="size-4" aria-hidden />
          </Link>
        }
      />
      <main className="mx-auto max-w-3xl px-4 pb-6 md:px-6">
        <InvoiceDetail
          invoice={{
            id: invoice.id,
            code: invoice.code,
            type: invoice.type,
            issue_date: invoice.issue_date,
            utility_period: invoice.utility_period,
            service_period: invoice.service_period,
            elec_start: Number(invoice.elec_start),
            elec_end: Number(invoice.elec_end),
            water_start: Number(invoice.water_start),
            water_end: Number(invoice.water_end),
            note: invoice.note,
            items: invoice.items,
            total: invoice.total,
            paid: invoice.paid,
            status: invoice.status,
            unpaid: invoice.unpaid,
          }}
          roomCode={room.code}
          tenantName={contract ? primaryName(contract.occupants) : null}
          ownsMark={
            Number(room.current_elec) === Number(invoice.elec_end) &&
            Number(room.current_water) === Number(invoice.water_end)
          }
          recognized={recognized.map((r) => ({
            fee: r.fee as FeeType,
            amount: r.amount,
            receipt_date: r.receipt_date,
          }))}
          receipts={receipts.map((r) => ({
            id: r.id,
            receipt_date: r.receipt_date,
            edited: r.edited,
            items: (r.receipt_items ?? []).map((ri) => ({
              fee: ri.fee as FeeType,
              amount: ri.amount,
            })),
          }))}
        />
      </main>
    </>
  );
}
