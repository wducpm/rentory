"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NumberField } from "@/components/forms/number-field";
import { TextField } from "@/components/forms/text-field";
import { SubmitBar } from "@/components/forms/submit-bar";
import { ItemsEditor } from "@/components/invoice/items-editor";
import { Money, SectionHeader } from "@/components/ui-kit";
import { moveOut } from "@/lib/actions";
import {
  buildInvoiceCode,
  consumption,
  displayInvoiceCode,
  moveOutDefaults,
  type BuildingSettings,
  type ContractOccupant,
  type InvoiceItem,
} from "@/lib/billing";
import { periodsLine, todayIso } from "@/lib/labels";

export function MoveOutForm({
  room,
  contract,
  occupants,
  tenantName,
  settings,
}: {
  room: { id: string; code: string; current_elec: number; current_water: number };
  contract: { id: string; rent: number; deposit: number };
  occupants: ContractOccupant[];
  tenantName: string;
  settings: BuildingSettings;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const [issueDate, setIssueDate] = useState(todayIso());
  const [elec, setElec] = useState<number | "">(room.current_elec);
  const [water, setWater] = useState<number | "">(room.current_water);
  const [items, setItems] = useState<InvoiceItem[] | null>(null);

  const draft = useMemo(
    () =>
      moveOutDefaults(
        contract,
        occupants,
        settings,
        {
          code: room.code,
          current_elec: room.current_elec,
          current_water: room.current_water,
        },
        {
          elec: elec === "" ? room.current_elec : Number(elec),
          water: water === "" ? room.current_water : Number(water),
        },
        issueDate,
      ),
    [contract, occupants, settings, room, elec, water, issueDate],
  );

  const effectiveItems = items ?? draft.items;
  const rollback =
    Number(elec) < room.current_elec || Number(water) < room.current_water;

  const previewCode = buildInvoiceCode(
    room.code,
    "move_out",
    draft.utility_period,
    null,
  );

  function submit() {
    if (rollback) {
      toast.error(
        "Chỉ số cuối nhỏ hơn mốc. Sửa mốc thủ công ở màn Chỉ số trước (HD-11).",
      );
      return;
    }
    start(async () => {
      const res = await moveOut({
        room_id: room.id,
        room_code: room.code,
        contract_id: contract.id,
        issue_date: issueDate,
        utility_period: draft.utility_period!,
        elec_start: draft.elec_start,
        elec_end: draft.elec_end,
        water_start: draft.water_start,
        water_end: draft.water_end,
        items: effectiveItems,
        note: null,
      });

      if (res.ok) {
        toast.success("Đã tất toán và trả phòng");
        router.replace(`/invoices/${res.data}`);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="space-y-5 pb-32">
      <section className="bg-card border-border rounded-2xl border p-4">
        <p className="text-sm font-semibold">{tenantName}</p>
        <p className="text-muted-foreground mt-0.5 text-xs">
          Cọc đã nhận <Money value={contract.deposit} /> · {occupants.length}{" "}
          người
        </p>
      </section>

      <section>
        <SectionHeader title="Số chốt khi trả phòng" />
        <div className="bg-card border-border grid grid-cols-2 gap-3 rounded-2xl border p-4">
          <TextField
            id="mo-date"
            type="date"
            label="Ngày trả phòng"
            value={issueDate}
            onChange={setIssueDate}
            className="col-span-2"
          />
          <NumberField
            id="mo-elec"
            label="Chỉ số điện"
            value={elec}
            onChange={setElec}
            hint={`Mốc ${room.current_elec} · dùng ${consumption(room.current_elec, elec === "" ? room.current_elec : Number(elec))} số`}
          />
          <NumberField
            id="mo-water"
            label="Chỉ số nước"
            value={water}
            onChange={setWater}
            hint={`Mốc ${room.current_water} · dùng ${consumption(room.current_water, water === "" ? room.current_water : Number(water))} khối`}
          />
          {rollback ? (
            <p className="text-destructive col-span-2 text-[11px] font-medium">
              Chỉ số cuối nhỏ hơn mốc — không lưu được (HD-09).
            </p>
          ) : null}
        </div>
      </section>

      <section>
        <SectionHeader title="Bill tất toán" />
        <p className="text-muted-foreground mb-2 text-xs">
          <span className="font-semibold">{displayInvoiceCode(previewCode)}</span>
          {" · "}
          {periodsLine(draft.utility_period, null)}
        </p>
        <ItemsEditor items={effectiveItems} onChange={setItems} idPrefix="mo-fee" />
        <p className="text-muted-foreground mt-2 px-1 text-[11px]">
          Dịch vụ mặc định 0 vì đã thu trước ở hóa đơn kỳ liền trước — admin
          quyết có hoàn lại không. Hoàn cọc là dòng âm, không bắt khớp cọc gốc
          (HD-03).
        </p>
      </section>

      <SubmitBar
        label="Tất toán & trả phòng"
        tone="destructive"
        pending={pending}
        disabled={rollback}
        onClick={submit}
        hint="Hợp đồng sẽ đóng lại và phòng chuyển về Trống."
      />
    </div>
  );
}
