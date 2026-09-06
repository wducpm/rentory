import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, PencilRuler, Receipt, Wallet } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { EmptyState, IconTile, Money } from "@/components/ui-kit";
import { getRoom, getRoomHistory } from "@/lib/data";
import { displayInvoiceCode } from "@/lib/billing";
import {
  dateLabel,
  FEE_LABEL,
  INVOICE_TYPE_LABEL,
  MARK_SOURCE_LABEL,
  periodsLine,
} from "@/lib/labels";

type Entry = {
  key: string;
  at: string;
  order: number;
  node: React.ReactNode;
};

/** S-09 — timeline gộp: hóa đơn · phiếu thu · lần ghi đè mốc. */
export default async function RoomHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [room, history] = await Promise.all([getRoom(id), getRoomHistory(id)]);
  if (!room) notFound();

  // FR-207: phiếu thu gắn theo hóa đơn → tra ngược ra khách của hóa đơn đó
  const contractOfInvoice = new Map(
    history.invoices.map((i) => [i.id, i.contract_id]),
  );
  const tenantOfReceipt = (invoiceId: string) =>
    history.tenantOf.get(contractOfInvoice.get(invoiceId) ?? "") ?? "—";

  const entries: Entry[] = [];

  for (const inv of history.invoices) {
    entries.push({
      key: `inv-${inv.id}`,
      at: inv.issue_date,
      order: 2,
      node: (
        // HD-14: mở lại hóa đơn cũ để xem / sửa / thu tiếp
        <Link
          href={`/invoices/${inv.id}`}
          className="bg-card border-border focus-visible:ring-ring active:bg-accent/40 flex items-center gap-3 rounded-2xl border p-3 transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <IconTile tone="primary" size="sm">
            <Receipt />
          </IconTile>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {displayInvoiceCode(inv.code)}
            </p>
            <p className="text-muted-foreground truncate text-[11px]">
              {INVOICE_TYPE_LABEL[inv.type]} ·{" "}
              {history.tenantOf.get(inv.contract_id) ?? "—"}
            </p>
            <p className="text-muted-foreground truncate text-[11px]">
              {periodsLine(inv.utility_period, inv.service_period)}
            </p>
            <p className="text-muted-foreground text-[11px]">
              Chỉ số {inv.elec_start}→{inv.elec_end} điện · {inv.water_start}→
              {inv.water_end} nước
            </p>
          </div>
          <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
        </Link>
      ),
    });
  }

  for (const r of history.receipts) {
    const total = (r.receipt_items ?? []).reduce((s, i) => s + i.amount, 0);
    entries.push({
      key: `rec-${r.id}`,
      at: r.receipt_date,
      order: 1,
      node: (
        <div className="bg-card border-border flex items-center gap-3 rounded-2xl border p-3">
          <IconTile tone="success" size="sm">
            <Wallet />
          </IconTile>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              Thu <Money value={total} />
              {r.edited ? (
                <span className="text-muted-foreground ml-1.5 text-[11px] font-normal">
                  đã sửa
                </span>
              ) : null}
            </p>
            <p className="text-muted-foreground truncate text-[11px]">
              {tenantOfReceipt(r.invoice_id)} ·{" "}
              {(r.receipt_items ?? []).map((i) => FEE_LABEL[i.fee]).join(" · ")}
            </p>
          </div>
        </div>
      ),
    });
  }

  for (const m of history.marks) {
    entries.push({
      key: `mark-${m.id}`,
      at: m.effective_date,
      order: 0,
      node: (
        <div className="bg-card border-border flex items-center gap-3 rounded-2xl border p-3">
          <IconTile
            tone={m.source === "manual" ? "warning" : "neutral"}
            size="sm"
          >
            <PencilRuler />
          </IconTile>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              Ghi đè mốc · {MARK_SOURCE_LABEL[m.source]}
            </p>
            <p className="text-muted-foreground text-[11px]">
              Điện {m.prev_elec ?? "—"} → {m.elec} · Nước {m.prev_water ?? "—"} →{" "}
              {m.water}
            </p>
            {m.note ? (
              <p className="text-warning truncate text-[11px] font-medium">
                {m.note}
              </p>
            ) : null}
          </div>
        </div>
      ),
    });
  }

  entries.sort((a, b) =>
    a.at === b.at ? b.order - a.order : a.at < b.at ? 1 : -1,
  );

  return (
    <>
      <AppHeader
        eyebrow="Lịch sử"
        title={`Phòng ${room.room.code}`}
        backHref={`/rooms/${id}`}
      />
      <main className="mx-auto max-w-3xl px-4 pb-6 md:px-6">
        {entries.length === 0 ? (
          <EmptyState
            icon={<Receipt />}
            title="Chưa có hoạt động nào"
            description="Hóa đơn, phiếu thu và mỗi lần ghi đè mốc sẽ hiện ở đây."
          />
        ) : (
          <ol className="space-y-3">
            {groupByDate(entries).map(([date, group]) => (
              <li key={date}>
                <p className="text-muted-foreground mb-1.5 px-1 text-[11px] font-semibold tracking-wider uppercase">
                  {dateLabel(date)}
                </p>
                <ul className="space-y-2">
                  {group.map((e) => (
                    <li key={e.key}>{e.node}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </main>
    </>
  );
}

function groupByDate(entries: Entry[]): [string, Entry[]][] {
  const map = new Map<string, Entry[]>();
  for (const e of entries) {
    const list = map.get(e.at) ?? [];
    list.push(e);
    map.set(e.at, list);
  }
  return [...map.entries()];
}
