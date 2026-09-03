"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Droplets, PencilRuler, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { NumberField } from "@/components/forms/number-field";
import { TextField } from "@/components/forms/text-field";
import { SubmitBar } from "@/components/forms/submit-bar";
import { Money } from "@/components/ui-kit";
import { Checkbox } from "@/components/ui/checkbox";
import { MarkSheet } from "@/components/meters/mark-sheet";
import { createPeriodicInvoice } from "@/lib/actions";
import {
  consumption,
  derivePeriods,
  periodicDefaults,
  type BuildingSettings,
} from "@/lib/billing";
import { periodLabel, todayIso } from "@/lib/labels";

export type MeterRow = {
  roomId: string;
  roomCode: string;
  status: "occupied" | "vacant" | "maintenance";
  currentElec: number;
  currentWater: number;
  contract: {
    id: string;
    tenant_name: string;
    occupants: number;
    rent: number;
    deposit: number;
  } | null;
};

type Entry = { elec: number | ""; water: number | ""; checked: boolean };

export function MetersGrid({
  rows,
  settings,
}: {
  rows: MeterRow[];
  settings: BuildingSettings;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [issueDate, setIssueDate] = useState(todayIso());
  const [markRoom, setMarkRoom] = useState<MeterRow | null>(null);
  const [showVacant, setShowVacant] = useState(false);
  const [entries, setEntries] = useState<Record<string, Entry>>(() =>
    Object.fromEntries(
      rows.map((r) => [r.roomId, { elec: "", water: "", checked: false }]),
    ),
  );

  const periods = derivePeriods("periodic", issueDate);
  const occupied = rows.filter((r) => r.contract !== null);
  const vacant = rows.filter((r) => r.contract === null);

  /** Xem trước hóa đơn định kỳ của từng phòng — tính real-time (HD-02). */
  const previews = useMemo(() => {
    const map = new Map<string, ReturnType<typeof periodicDefaults>>();
    for (const row of occupied) {
      const e = entries[row.roomId];
      if (!e || e.elec === "" || e.water === "") continue;
      map.set(
        row.roomId,
        periodicDefaults(
          row.contract!,
          settings,
          {
            code: row.roomCode,
            current_elec: row.currentElec,
            current_water: row.currentWater,
          },
          { elec: Number(e.elec), water: Number(e.water) },
          issueDate,
        ),
      );
    }
    return map;
  }, [entries, occupied, settings, issueDate]);

  const selected = occupied.filter((r) => {
    const e = entries[r.roomId];
    return e?.checked && previews.has(r.roomId);
  });

  const grandTotal = selected.reduce((sum, r) => {
    const p = previews.get(r.roomId)!;
    return sum + p.items.reduce((s, i) => s + i.amount, 0);
  }, 0);

  const invalid = selected.filter((r) => {
    const e = entries[r.roomId];
    return Number(e.elec) < r.currentElec || Number(e.water) < r.currentWater;
  });

  function update(roomId: string, patch: Partial<Entry>) {
    setEntries((prev) => {
      const next = { ...prev[roomId], ...patch };
      // Nhập đủ hai chỉ số thì tự tick, đỡ một thao tác
      if (
        patch.checked === undefined &&
        next.elec !== "" &&
        next.water !== ""
      ) {
        next.checked = true;
      }
      return { ...prev, [roomId]: next };
    });
  }

  function submit() {
    if (invalid.length > 0) {
      toast.error(
        `Phòng ${invalid.map((r) => r.roomCode).join(", ")}: chỉ số cuối nhỏ hơn mốc. Sửa mốc thủ công trước nếu vừa thay công tơ.`,
      );
      return;
    }

    start(async () => {
      let ok = 0;
      const failed: string[] = [];

      for (const row of selected) {
        const draft = previews.get(row.roomId)!;
        const res = await createPeriodicInvoice({
          room_id: row.roomId,
          contract_id: row.contract!.id,
          room_code: row.roomCode,
          issue_date: issueDate,
          utility_period: draft.utility_period!,
          service_period: draft.service_period!,
          elec_start: draft.elec_start,
          elec_end: draft.elec_end,
          water_start: draft.water_start,
          water_end: draft.water_end,
          items: draft.items,
          note: null,
        });
        if (res.ok) ok += 1;
        else failed.push(`P.${row.roomCode}: ${res.error}`);
      }

      if (ok > 0) toast.success(`Đã lập ${ok} hóa đơn định kỳ`);
      if (failed.length > 0) toast.error(failed.join(" · "));

      setEntries((prev) => {
        const next = { ...prev };
        for (const row of selected)
          next[row.roomId] = { elec: "", water: "", checked: false };
        return next;
      });
      router.refresh();
    });
  }

  return (
    <>
      <div className="bg-card border-border mb-3 rounded-2xl border p-4">
        <TextField
          id="issue-date"
          type="date"
          label="Ngày chốt số"
          value={issueDate}
          onChange={setIssueDate}
        />
        {/* HD-13 + 4.1: hóa đơn ghi rõ hai kỳ */}
        <p className="text-muted-foreground mt-2 text-[11px]">
          Điện nước {periodLabel(periods.utility_period)} · Dịch vụ{" "}
          {periodLabel(periods.service_period)}
        </p>
      </div>

      <ul className="space-y-2">
        {occupied.map((row) => {
          const entry = entries[row.roomId];
          const preview = previews.get(row.roomId);
          const elecUsed =
            entry.elec === ""
              ? null
              : consumption(row.currentElec, Number(entry.elec));
          const waterUsed =
            entry.water === ""
              ? null
              : consumption(row.currentWater, Number(entry.water));
          const rollback =
            (entry.elec !== "" && Number(entry.elec) < row.currentElec) ||
            (entry.water !== "" && Number(entry.water) < row.currentWater);

          return (
            <li
              key={row.roomId}
              className="bg-card border-border rounded-2xl border p-4"
            >
              <div className="flex items-center gap-2">
                <Checkbox
                    id={`pick-${row.roomId}`}
                    checked={entry.checked}
                    disabled={!preview}
                    onCheckedChange={(c) =>
                      update(row.roomId, { checked: c === true })
                    }
                    aria-label={`Chốt kỳ phòng ${row.roomCode}`}
                  className="size-5"
                />
                <label
                  htmlFor={`pick-${row.roomId}`}
                  className="text-sm font-semibold"
                >
                  P.{row.roomCode}
                </label>
                <span className="text-muted-foreground truncate text-xs">
                  {row.contract!.tenant_name}
                </span>

                <button
                  type="button"
                  onClick={() => setMarkRoom(row)}
                  className="border-border text-muted-foreground focus-visible:ring-ring ml-auto inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border px-2.5 text-[11px] font-semibold focus-visible:ring-2 focus-visible:outline-none"
                >
                  <PencilRuler className="size-3.5" aria-hidden />
                  Sửa mốc
                </button>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <MeterInput
                    icon={<Zap />}
                    id={`elec-${row.roomId}`}
                    label="Điện"
                    mark={row.currentElec}
                    value={entry.elec}
                    onChange={(x) => update(row.roomId, { elec: x })}
                    used={elecUsed}
                    unit="số"
                    amount={preview?.items.find((i) => i.fee === "elec")?.amount}
                  />
                  <MeterInput
                    icon={<Droplets />}
                    id={`water-${row.roomId}`}
                    label="Nước"
                    mark={row.currentWater}
                    value={entry.water}
                    onChange={(x) => update(row.roomId, { water: x })}
                    used={waterUsed}
                    unit="khối"
                  amount={preview?.items.find((i) => i.fee === "water")?.amount}
                />
              </div>

              {rollback ? (
                <p className="text-destructive mt-2 text-[11px] font-medium">
                  Chỉ số cuối nhỏ hơn mốc. Nếu vừa thay công tơ, bấm “Sửa mốc”
                  để đưa mốc về 0 trước (HD-11).
                </p>
              ) : null}

              {preview ? (
                <p className="border-border mt-3 flex items-center border-t pt-3 text-xs">
                  <span className="text-muted-foreground">Tổng hóa đơn</span>
                  <Money
                    value={preview.items.reduce((s, i) => s + i.amount, 0)}
                    className="ml-auto text-sm font-bold"
                  />
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>

      {occupied.length === 0 ? (
        <p className="bg-card border-border rounded-2xl border p-4 text-sm">
          Chưa có phòng nào đang thuê để chốt kỳ.
        </p>
      ) : null}

      {/* Phòng trống: không sinh hóa đơn (HD-05), nhưng vẫn sửa mốc được
          — VD chủ nhà dùng điện lúc phòng bỏ trống, hoặc thay công tơ. */}
      {vacant.length > 0 ? (
        <section className="mt-5 pb-32">
          <button
            type="button"
            onClick={() => setShowVacant((v) => !v)}
            aria-expanded={showVacant}
            className="text-muted-foreground focus-visible:ring-ring flex min-h-11 w-full items-center gap-2 rounded-xl px-1 text-[11px] font-semibold tracking-wider uppercase focus-visible:ring-2 focus-visible:outline-none"
          >
            Phòng trống ({vacant.length})
            <ChevronDown
              className={cn("size-4 transition-transform", showVacant && "rotate-180")}
              aria-hidden
            />
          </button>

          {showVacant ? (
            <>
              <p className="text-muted-foreground mb-2 px-1 text-[11px]">
                Phòng trống không sinh hóa đơn. Tiêu thụ ở đây tính là chi phí
                tòa nhà (HD-05) — chỉ cần cập nhật mốc.
              </p>
              <ul className="space-y-2">
                {vacant.map((row) => (
                  <li
                    key={row.roomId}
                    className="bg-card border-border flex items-center gap-3 rounded-2xl border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">P.{row.roomCode}</p>
                      <p className="text-muted-foreground text-[11px]">
                        Mốc <span className="tabular">{row.currentElec}</span> điện ·{" "}
                        <span className="tabular">{row.currentWater}</span> nước
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMarkRoom(row)}
                      className="border-border text-muted-foreground focus-visible:ring-ring inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-[11px] font-semibold focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <PencilRuler className="size-3.5" aria-hidden />
                      Sửa mốc
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </section>
      ) : (
        <div className="pb-32" />
      )}

      <SubmitBar
        label={
          selected.length === 0
            ? "Chọn phòng để chốt kỳ"
            : `Chốt kỳ ${selected.length} phòng`
        }
        hint={
          selected.length > 0
            ? `Tổng ${grandTotal.toLocaleString("vi-VN")}đ · mốc sẽ được ghi đè sau khi lưu (HD-04)`
            : undefined
        }
        disabled={selected.length === 0}
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

function MeterInput({
  icon,
  id,
  label,
  mark,
  value,
  onChange,
  used,
  unit,
  amount,
}: {
  icon: React.ReactNode;
  id: string;
  label: string;
  mark: number;
  value: number | "";
  onChange: (v: number | "") => void;
  used: number | null;
  unit: string;
  amount?: number;
}) {
  return (
    <div>
      <div className="text-muted-foreground mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold">
        <span className="[&>svg]:size-3.5" aria-hidden>
          {icon}
        </span>
        {label} · mốc <span className="tabular text-foreground">{mark}</span>
      </div>
      <NumberField
        id={id}
        value={value}
        onChange={onChange}
        suffix={unit}
      />
      {used !== null ? (
        <p className="text-muted-foreground mt-1 text-[11px]">
          Dùng <span className="tabular text-foreground font-semibold">{used}</span>{" "}
          {unit}
          {amount !== undefined ? (
            <>
              {" · "}
              <Money value={amount} className="font-semibold" />
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
