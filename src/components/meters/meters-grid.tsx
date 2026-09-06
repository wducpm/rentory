"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Droplets, PencilRuler, Settings2, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { NumberField } from "@/components/forms/number-field";
import { TextField } from "@/components/forms/text-field";
import { SubmitBar } from "@/components/forms/submit-bar";
import { Money, Pill } from "@/components/ui-kit";
import { MarkSheet } from "@/components/meters/mark-sheet";
import { savePeriodicInvoice } from "@/lib/actions";
import {
  consumption,
  derivePeriods,
  lastDayOfMonth,
  periodicDefaults,
  type BuildingSettings,
  type ContractOccupant,
  type InvoiceItem,
} from "@/lib/billing";
import { periodLabel } from "@/lib/labels";

export type MeterRow = {
  roomId: string;
  roomCode: string;
  currentElec: number;
  currentWater: number;
  contract: { id: string; rent: number; deposit: number };
  occupants: ContractOccupant[];
  /** BR-P14: tên hiển thị lấy từ người đại diện. */
  tenantName: string;
};

export type PeriodicInvoice = {
  id: string;
  contract_id: string;
  service_period: string | null;
  utility_period: string | null;
  elec_start: number;
  elec_end: number;
  water_start: number;
  water_end: number;
  items: InvoiceItem[];
};

type Entry = { elecStart: number | ""; elecEnd: number | ""; waterStart: number | ""; waterEnd: number | "" };

const num = (v: number | "") => (v === "" ? 0 : Number(v));
const filled = (v: number | "") => v !== "";

export function MetersGrid({
  rows,
  invoices,
  settings,
}: {
  rows: MeterRow[];
  invoices: PeriodicInvoice[];
  settings: BuildingSettings;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [markRoom, setMarkRoom] = useState<MeterRow | null>(null);

  // FR-101: mặc định ngày cuối tháng hiện tại
  const [issueDate, setIssueDate] = useState(() => lastDayOfMonth());
  const derived = derivePeriods("periodic", issueDate);
  // Mục 10 hạng mục 4: cho sửa tay hai kỳ khi chốt lệch tháng
  const [periodOverride, setPeriodOverride] = useState<{
    utility: string;
    service: string;
  } | null>(null);
  const [editingPeriods, setEditingPeriods] = useState(false);

  const utilityPeriod = periodOverride?.utility ?? derived.utility_period!;
  const servicePeriod = periodOverride?.service ?? derived.service_period!;

  /** Hóa đơn định kỳ đã lập cho kỳ dịch vụ đang chọn, tra theo hợp đồng (BR-M07). */
  const existingByContract = useMemo(() => {
    const map = new Map<string, PeriodicInvoice>();
    for (const inv of invoices)
      if (inv.service_period === servicePeriod) map.set(inv.contract_id, inv);
    return map;
  }, [invoices, servicePeriod]);

  /** FR-103: số đầu kỳ điền sẵn = mốc hiện tại, hoặc chỉ số của hóa đơn đã lập. */
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [touched, setTouched] = useState<Record<string, true>>({});

  function entryOf(row: MeterRow): Entry {
    const custom = entries[row.roomId];
    if (custom) return custom;

    const inv = existingByContract.get(row.contract.id);
    if (inv)
      return {
        elecStart: inv.elec_start,
        elecEnd: inv.elec_end,
        waterStart: inv.water_start,
        waterEnd: inv.water_end,
      };

    return {
      elecStart: row.currentElec,
      elecEnd: "",
      waterStart: row.currentWater,
      waterEnd: "",
    };
  }

  function update(row: MeterRow, patch: Partial<Entry>) {
    const next = { ...entryOf(row), ...patch };
    setEntries((prev) => ({ ...prev, [row.roomId]: next }));
    setTouched((prev) => ({ ...prev, [row.roomId]: true }));
  }

  /** FR-104: tiêu thụ và thành tiền cập nhật tức thời. */
  const draftOf = (row: MeterRow) => {
    const e = entryOf(row);
    if (!filled(e.elecEnd) || !filled(e.waterEnd)) return null;
    return periodicDefaults(
      row.contract,
      row.occupants,
      settings,
      {
        code: row.roomCode,
        current_elec: num(e.elecStart),
        current_water: num(e.waterStart),
      },
      { elec: num(e.elecEnd), water: num(e.waterEnd) },
      issueDate,
    );
  };

  const complete = rows.filter((r) => {
    const e = entryOf(r);
    return filled(e.elecEnd) && filled(e.waterEnd);
  });
  const invalid = complete.filter((r) => {
    const e = entryOf(r);
    return num(e.elecEnd) < num(e.elecStart) || num(e.waterEnd) < num(e.waterStart);
  });
  const ready = complete.filter((r) => !invalid.includes(r));
  const missing = rows.filter((r) => !complete.includes(r));

  const grandTotal = ready.reduce((sum, r) => {
    const d = draftOf(r);
    return sum + (d ? d.items.reduce((s, i) => s + i.amount, 0) : 0);
  }, 0);

  /** AC-13.2: tiền điện/nước đã bị admin chỉnh tay khác mặc định? */
  function handEdited(row: MeterRow): boolean {
    const inv = existingByContract.get(row.contract.id);
    if (!inv) return false;
    const asIssued = periodicDefaults(
      row.contract,
      row.occupants,
      settings,
      {
        code: row.roomCode,
        current_elec: inv.elec_start,
        current_water: inv.water_start,
      },
      { elec: inv.elec_end, water: inv.water_end },
      issueDate,
    );
    return (["elec", "water"] as const).some((fee) => {
      const stored = inv.items.find((i) => i.fee === fee)?.amount;
      const auto = asIssued.items.find((i) => i.fee === fee)?.amount;
      return stored !== undefined && auto !== undefined && stored !== auto;
    });
  }

  function submit() {
    if (invalid.length > 0) {
      toast.error(
        `Phòng ${invalid.map((r) => r.roomCode).join(", ")}: chỉ số cuối nhỏ hơn đầu kỳ (BR-M03).`,
      );
      return;
    }

    // AC-13.2: cảnh báo trước khi tính lại đè lên số tiền admin đã chỉnh tay
    const risky = ready.filter((r) => touched[r.roomId] && handEdited(r));
    if (risky.length > 0) {
      const ok = window.confirm(
        `Phòng ${risky.map((r) => r.roomCode).join(", ")} đã có tiền điện/nước chỉnh tay khác mặc định ` +
          `(VD thu bù công tơ cũ). Lập lại sẽ tính lại theo đơn giá và xóa phần chỉnh tay đó.\n\nTiếp tục?`,
      );
      if (!ok) return;
    }

    start(async () => {
      let created = 0;
      let updated = 0;
      const failed: string[] = [];

      for (const row of ready) {
        const draft = draftOf(row)!;
        const res = await savePeriodicInvoice({
          room_id: row.roomId,
          contract_id: row.contract.id,
          room_code: row.roomCode,
          issue_date: issueDate,
          utility_period: utilityPeriod,
          service_period: servicePeriod,
          elec_start: draft.elec_start,
          elec_end: draft.elec_end,
          water_start: draft.water_start,
          water_end: draft.water_end,
          items: draft.items,
          note: null,
        });
        if (!res.ok) failed.push(`P.${row.roomCode}: ${res.error}`);
        else if (res.data.created) created += 1;
        else updated += 1;
      }

      // FR-105: báo rõ đã tạo gì và bỏ qua phòng nào
      const parts: string[] = [];
      if (created) parts.push(`lập ${created} hóa đơn`);
      if (updated) parts.push(`cập nhật ${updated}`);
      if (parts.length) toast.success(`Đã ${parts.join(", ")}`);
      if (missing.length > 0)
        toast.warning(
          `Bỏ qua ${missing.length} phòng chưa nhập số: ${missing.map((r) => `P.${r.roomCode}`).join(", ")}`,
          { duration: 8000 },
        );
      if (failed.length > 0) toast.error(failed.join(" · "), { duration: 8000 });

      setEntries({});
      setTouched({});
      router.refresh();
    });
  }

  return (
    <>
      {/* FR-101 — ngày chốt số và hai kỳ suy ra */}
      <div className="bg-card border-border mb-3 rounded-2xl border p-4">
        <TextField
          id="issue-date"
          type="date"
          label="Ngày chốt số"
          value={issueDate}
          onChange={(v) => {
            setIssueDate(v);
            setPeriodOverride(null);
          }}
        />

        {editingPeriods ? (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <PeriodField
              id="utility-period"
              label="Kỳ điện nước"
              value={utilityPeriod}
              onChange={(v) =>
                setPeriodOverride({ utility: v, service: servicePeriod })
              }
            />
            <PeriodField
              id="service-period"
              label="Kỳ dịch vụ"
              value={servicePeriod}
              onChange={(v) =>
                setPeriodOverride({ utility: utilityPeriod, service: v })
              }
            />
            <button
              type="button"
              onClick={() => {
                setPeriodOverride(null);
                setEditingPeriods(false);
              }}
              className="text-muted-foreground col-span-2 h-9 text-xs font-semibold underline underline-offset-2"
            >
              Về kỳ mặc định theo ngày chốt
            </button>
          </div>
        ) : (
          <p className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-2 text-[11px]">
            <span>
              Điện nước {periodLabel(utilityPeriod)} · Dịch vụ{" "}
              {periodLabel(servicePeriod)}
            </span>
            <button
              type="button"
              onClick={() => setEditingPeriods(true)}
              className="text-primary font-semibold underline underline-offset-2"
            >
              Sửa kỳ
            </button>
          </p>
        )}
      </div>

      {/* FR-102 — mỗi phòng một card, thứ tự giảm dần theo BR-M01 */}
      <ul className="space-y-2">
        {rows.map((row) => {
          const e = entryOf(row);
          const draft = draftOf(row);
          const inv = existingByContract.get(row.contract.id);
          const elecBack = filled(e.elecEnd) && num(e.elecEnd) < num(e.elecStart);
          const waterBack = filled(e.waterEnd) && num(e.waterEnd) < num(e.waterStart);

          return (
            <li
              key={row.roomId}
              className="bg-card border-border rounded-2xl border p-4"
            >
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">P.{row.roomCode}</p>
                <span className="text-muted-foreground truncate text-xs">
                  {row.tenantName}
                </span>
                {inv ? (
                  <Pill tone="success" className="shrink-0">
                    Đã lập
                  </Pill>
                ) : null}

                <button
                  type="button"
                  onClick={() => setMarkRoom(row)}
                  aria-label={`Sửa mốc phòng ${row.roomCode}`}
                  className="border-border text-muted-foreground focus-visible:ring-ring ml-auto inline-flex size-9 shrink-0 items-center justify-center rounded-xl border focus-visible:ring-2 focus-visible:outline-none"
                >
                  <PencilRuler className="size-4" aria-hidden />
                </button>
              </div>

              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <MeterPair
                  icon={<Zap />}
                  label="Điện"
                  unit="kWh"
                  idPrefix={`elec-${row.roomId}`}
                  start={e.elecStart}
                  end={e.elecEnd}
                  onStart={(v) => update(row, { elecStart: v })}
                  onEnd={(v) => update(row, { elecEnd: v })}
                  amount={draft?.items.find((i) => i.fee === "elec")?.amount}
                  invalid={elecBack}
                />
                <MeterPair
                  icon={<Droplets />}
                  label="Nước"
                  unit="m³"
                  idPrefix={`water-${row.roomId}`}
                  start={e.waterStart}
                  end={e.waterEnd}
                  onStart={(v) => update(row, { waterStart: v })}
                  onEnd={(v) => update(row, { waterEnd: v })}
                  amount={draft?.items.find((i) => i.fee === "water")?.amount}
                  invalid={waterBack}
                />
              </div>

              {elecBack || waterBack ? (
                <p className="text-destructive mt-2 text-[11px] font-medium">
                  Cuối kỳ nhỏ hơn đầu kỳ — dòng này sẽ bị bỏ qua. Nếu vừa thay
                  công tơ, sửa mốc rồi nhập lại (HD-11).
                </p>
              ) : null}

              {draft ? (
                <p className="border-border mt-3 flex items-center gap-2 border-t pt-3 text-xs">
                  <span className="text-muted-foreground">Tạm tính</span>
                  {inv ? (
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="text-primary text-[11px] font-semibold underline underline-offset-2"
                    >
                      Xem hóa đơn
                    </Link>
                  ) : null}
                  <Money
                    value={draft.items.reduce((s, i) => s + i.amount, 0)}
                    className="ml-auto text-sm font-bold"
                  />
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>

      <p className="text-muted-foreground mt-4 px-1 pb-32 text-[11px]">
        <Settings2 className="mr-1 inline size-3" aria-hidden />
        Đơn giá đang áp dụng: điện {settings.elec_price.toLocaleString("vi-VN")}đ/kWh ·
        nước {settings.water_price.toLocaleString("vi-VN")}đ/m³. Số tiền được chốt
        vào hóa đơn tại thời điểm lập (BR-M08).
      </p>

      {/* FR-105 — CTA lập hàng loạt, kèm tiến độ nhập */}
      <SubmitBar
        label={
          ready.length === 0
            ? "Chưa nhập phòng nào"
            : `Lập hóa đơn ${ready.length} phòng`
        }
        hint={`Đã nhập ${complete.length}/${rows.length} phòng${
          grandTotal > 0
            ? ` · Tổng tạm tính ${grandTotal.toLocaleString("vi-VN")}đ`
            : ""
        }`}
        disabled={ready.length === 0}
        pending={pending}
        onClick={submit}
      />

      {markRoom ? (
        <MarkSheet
          room={markRoom}
          open
          onOpenChange={(o) => !o && setMarkRoom(null)}
        />
      ) : null}
    </>
  );
}

function PeriodField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-xs font-medium">
        {label}
      </label>
      <input
        id={id}
        type="month"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-input bg-card focus-visible:ring-ring h-11 w-full rounded-xl border px-3 text-sm font-semibold focus-visible:ring-2 focus-visible:outline-none"
      />
    </div>
  );
}

/**
 * FR-103/FR-104 — cặp ô đầu kỳ / cuối kỳ.
 * Ô đầu kỳ nền mờ viền nét đứt (giá trị tự điền) nhưng vẫn sửa được;
 * ô cuối kỳ là ô nhập bình thường, nơi admin gõ.
 */
function MeterPair({
  icon,
  label,
  unit,
  idPrefix,
  start,
  end,
  onStart,
  onEnd,
  amount,
  invalid,
}: {
  icon: React.ReactNode;
  label: string;
  unit: string;
  idPrefix: string;
  start: number | "";
  end: number | "";
  onStart: (v: number | "") => void;
  onEnd: (v: number | "") => void;
  amount?: number;
  invalid: boolean;
}) {
  const used = filled(end) ? consumption(num(start), num(end)) : null;

  return (
    <div>
      <p className="text-muted-foreground mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold">
        <span className="[&>svg]:size-3.5" aria-hidden>
          {icon}
        </span>
        {label}
      </p>

      <div className="grid grid-cols-2 gap-2">
        <NumberField
          id={`${idPrefix}-start`}
          label="Đầu kỳ"
          value={start}
          onChange={onStart}
          className="[&_input]:border-dashed [&_input]:bg-muted/40"
        />
        <NumberField
          id={`${idPrefix}-end`}
          label="Cuối kỳ"
          value={end}
          onChange={onEnd}
          className={cn(invalid && "[&_input]:border-destructive")}
        />
      </div>

      <p className="text-muted-foreground mt-1 text-[11px]">
        {used === null ? (
          "Chưa nhập cuối kỳ"
        ) : (
          <>
            Đã dùng{" "}
            <span className="tabular text-foreground font-semibold">{used}</span>{" "}
            {unit}
            {amount !== undefined ? (
              <>
                {" · "}
                <Money value={amount} className="font-semibold" />
              </>
            ) : null}
          </>
        )}
      </p>
    </div>
  );
}
