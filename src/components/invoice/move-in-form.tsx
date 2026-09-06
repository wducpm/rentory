"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NumberField } from "@/components/forms/number-field";
import { TextField } from "@/components/forms/text-field";
import { SubmitBar } from "@/components/forms/submit-bar";
import { TermPicker } from "@/components/forms/term-picker";
import { ItemsEditor } from "@/components/invoice/items-editor";
import { OccupantsEditor } from "@/components/contract/occupants-editor";
import { SectionHeader } from "@/components/ui-kit";
import { moveIn } from "@/lib/actions";
import {
  buildInvoiceCode,
  displayInvoiceCode,
  moveInDefaults,
  resizeOccupants,
  validateOccupants,
  type BuildingSettings,
  type ContractOccupant,
  type InvoiceItem,
} from "@/lib/billing";
import { periodsLine, todayIso } from "@/lib/labels";

export function MoveInForm({
  room,
  suggestedRent,
  settings,
}: {
  room: {
    id: string;
    code: string;
    current_elec: number;
    current_water: number;
  };
  /** FR-209 · BR-P18: giá hợp đồng gần nhất; null nếu là hợp đồng đầu tiên. */
  suggestedRent: number | null;
  settings: BuildingSettings;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  // CR-02 · FR-205: danh sách đầy đủ người ở, người đầu là đại diện
  const [occupants, setOccupants] = useState<ContractOccupant[]>(() =>
    resizeOccupants([], 1),
  );
  const [startDate, setStartDate] = useState(todayIso());
  // Ngày bắt đầu HĐ mặc định bám theo ngày nhận phòng cho tới khi admin tự sửa
  const [contractStart, setContractStart] = useState(todayIso());
  const [contractStartTouched, setContractStartTouched] = useState(false);
  const [endDate, setEndDate] = useState("");
  // AC-21.10: phòng chưa từng có hợp đồng → ô giá để trống
  const [rent, setRent] = useState<number | "">(suggestedRent ?? "");
  const [deposit, setDeposit] = useState<number | "">("");
  const [elec, setElec] = useState<number | "">(room.current_elec);
  const [water, setWater] = useState<number | "">(room.current_water);

  const contract = {
    rent: rent === "" ? 0 : Number(rent),
    deposit: deposit === "" ? 0 : Number(deposit),
  };

  // HD-01: điện = nước = 0, chỉ số đầu = chỉ số cuối = số chốt bàn giao
  const draft = useMemo(
    () =>
      moveInDefaults(
        contract,
        occupants,
        settings,
        { elec: elec === "" ? 0 : Number(elec), water: water === "" ? 0 : Number(water) },
        startDate,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [contract.rent, contract.deposit, occupants, settings, elec, water, startDate],
  );

  const [items, setItems] = useState<InvoiceItem[] | null>(null);
  const effectiveItems = items ?? draft.items;

  // Đổi tham số phía trên thì reset về số mặc định, trừ khi admin đã sửa tay
  const previewCode = buildInvoiceCode(
    room.code,
    "move_in",
    null,
    draft.service_period,
  );

  function submit() {
    // BR-P17 · AC-21.8/21.9
    const issues = validateOccupants(occupants);
    if (issues.length > 0) {
      toast.error(issues[0].message);
      return;
    }
    // BR-P05: cọc bắt buộc khai báo, được nhập 0 nhưng không bỏ trống
    if (deposit === "") {
      toast.error("Tiền cọc bắt buộc khai báo (nhập 0 nếu không thu).");
      return;
    }
    if (endDate && endDate <= contractStart) {
      toast.error("Ngày kết thúc hợp đồng phải sau ngày bắt đầu.");
      return;
    }
    start(async () => {
      const res = await moveIn({
        room_id: room.id,
        room_code: room.code,
        occupants: occupants.map((o) => ({
          full_name: o.full_name,
          phone: o.phone ?? "",
          is_primary: o.is_primary,
        })),
        start_date: startDate,
        contract_start: contractStart,
        end_date: endDate || null,
        deposit: contract.deposit,
        rent: contract.rent,
        service_period: draft.service_period!,
        elec: draft.elec_end,
        water: draft.water_end,
        items: effectiveItems,
        note: null,
      });

      if (res.ok) {
        toast.success("Đã nhận phòng và lập hóa đơn");
        router.replace(`/invoices/${res.data}`);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="space-y-5 pb-32">
      <section>
        <SectionHeader title="Người ở" />
        <div className="bg-card border-border grid gap-3 rounded-2xl border p-4">
          <OccupantsEditor
            occupants={occupants}
            onChange={setOccupants}
            idPrefix="mi-occ"
          />
        </div>
      </section>

      <section>
        <SectionHeader title="Hợp đồng" />
        <div className="bg-card border-border grid gap-3 rounded-2xl border p-4">
          <TextField
            id="start-date"
            type="date"
            label="Ngày nhận phòng"
            value={startDate}
            onChange={(v) => {
              setStartDate(v);
              if (!contractStartTouched) setContractStart(v);
            }}
          />

          <div className="grid grid-cols-2 gap-3">
            <TextField
              id="contract-start"
              type="date"
              label="HĐ bắt đầu"
              value={contractStart}
              onChange={(v) => {
                setContractStart(v);
                setContractStartTouched(true);
              }}
              hint={contractStartTouched ? undefined : "Theo ngày nhận phòng"}
            />
            <TextField
              id="contract-end"
              type="date"
              label="HĐ kết thúc"
              value={endDate}
              onChange={setEndDate}
              hint={endDate ? undefined : "Để trống = không thời hạn"}
            />
          </div>

          <TermPicker
            startDate={contractStart}
            endDate={endDate}
            onPick={setEndDate}
          />
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              id="rent"
              label="Tiền phòng"
              suffix="đ"
              step="1000"
              value={rent}
              onChange={setRent}
              hint={
                suggestedRent === null
                  ? "Hợp đồng đầu tiên — nhập tay"
                  : "Theo hợp đồng gần nhất"
              }
            />
            <NumberField
              id="deposit"
              label="Cọc (bắt buộc)"
              suffix="đ"
              step="1000"
              value={deposit}
              onChange={setDeposit}
            />
          </div>
        </div>
      </section>

      <section>
        <SectionHeader title="Số chốt bàn giao" />
        <div className="bg-card border-border grid grid-cols-2 gap-3 rounded-2xl border p-4">
          <NumberField
            id="mi-elec"
            label="Chỉ số điện"
            value={elec}
            onChange={setElec}
            hint={`Mốc đang là ${room.current_elec}`}
          />
          <NumberField
            id="mi-water"
            label="Chỉ số nước"
            value={water}
            onChange={setWater}
            hint={`Mốc đang là ${room.current_water}`}
          />
          <p className="text-muted-foreground col-span-2 text-[11px]">
            Hóa đơn nhận phòng có điện = nước = 0; chỉ số đầu bằng chỉ số cuối
            (HD-01). Sau khi lưu, mốc phòng nhận đúng số này.
          </p>
        </div>
      </section>

      <section>
        <SectionHeader title="Hóa đơn nhận phòng" />
        <p className="text-muted-foreground mb-2 text-xs">
          <span className="font-semibold">{displayInvoiceCode(previewCode)}</span>
          {" · "}
          {periodsLine(null, draft.service_period)}
        </p>
        <ItemsEditor
          items={effectiveItems}
          onChange={setItems}
          idPrefix="mi-fee"
        />
        <p className="text-muted-foreground mt-2 px-1 text-[11px]">
          Dịch vụ của kỳ hiện tại liệt kê đầy đủ dù khách chỉ ở vài ngày — sửa
          hoặc đưa về 0 tùy ý (HD-01).
        </p>
      </section>

      <SubmitBar
        label="Nhận phòng & lập hóa đơn"
        pending={pending}
        disabled={validateOccupants(occupants).length > 0 || deposit === ""}
        onClick={submit}
      />
    </div>
  );
}
