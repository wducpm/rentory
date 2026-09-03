"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NumberField } from "@/components/forms/number-field";
import { TextField } from "@/components/forms/text-field";
import { SubmitBar } from "@/components/forms/submit-bar";
import { ItemsEditor } from "@/components/invoice/items-editor";
import { SectionHeader } from "@/components/ui-kit";
import { moveIn } from "@/lib/actions";
import {
  buildInvoiceCode,
  displayInvoiceCode,
  moveInDefaults,
  type BuildingSettings,
  type InvoiceItem,
} from "@/lib/billing";
import { periodsLine, todayIso } from "@/lib/labels";

export function MoveInForm({
  room,
  settings,
}: {
  room: {
    id: string;
    code: string;
    base_rent: number;
    current_elec: number;
    current_water: number;
  };
  settings: BuildingSettings;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const [tenantName, setTenantName] = useState("");
  const [phone, setPhone] = useState("");
  const [occupants, setOccupants] = useState<number | "">(1);
  const [startDate, setStartDate] = useState(todayIso());
  const [rent, setRent] = useState<number | "">(room.base_rent);
  const [deposit, setDeposit] = useState<number | "">(room.base_rent);
  const [elec, setElec] = useState<number | "">(room.current_elec);
  const [water, setWater] = useState<number | "">(room.current_water);

  const contract = {
    rent: rent === "" ? 0 : Number(rent),
    occupants: occupants === "" ? 1 : Number(occupants),
    deposit: deposit === "" ? 0 : Number(deposit),
  };

  // HD-01: điện = nước = 0, chỉ số đầu = chỉ số cuối = số chốt bàn giao
  const draft = useMemo(
    () =>
      moveInDefaults(
        contract,
        settings,
        { elec: elec === "" ? 0 : Number(elec), water: water === "" ? 0 : Number(water) },
        startDate,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [contract.rent, contract.occupants, contract.deposit, settings, elec, water, startDate],
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
    if (!tenantName.trim()) {
      toast.error("Chưa nhập tên khách");
      return;
    }
    start(async () => {
      const res = await moveIn({
        room_id: room.id,
        room_code: room.code,
        tenant_name: tenantName,
        phone,
        occupants: contract.occupants,
        start_date: startDate,
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
        <SectionHeader title="Khách thuê" />
        <div className="bg-card border-border grid gap-3 rounded-2xl border p-4">
          <TextField
            id="tenant"
            label="Tên khách"
            value={tenantName}
            onChange={setTenantName}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <TextField
              id="phone"
              type="tel"
              label="Điện thoại"
              value={phone}
              onChange={setPhone}
            />
            <NumberField
              id="occupants"
              label="Số người"
              min={1}
              step="1"
              value={occupants}
              onChange={setOccupants}
            />
          </div>
          <TextField
            id="start-date"
            type="date"
            label="Ngày nhận phòng"
            value={startDate}
            onChange={setStartDate}
          />
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              id="rent"
              label="Tiền phòng"
              suffix="đ"
              step="1000"
              value={rent}
              onChange={setRent}
            />
            <NumberField
              id="deposit"
              label="Cọc"
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
          idPrefix="mi"
        />
        <p className="text-muted-foreground mt-2 px-1 text-[11px]">
          Dịch vụ của kỳ hiện tại liệt kê đầy đủ dù khách chỉ ở vài ngày — sửa
          hoặc đưa về 0 tùy ý (HD-01).
        </p>
      </section>

      <SubmitBar
        label="Nhận phòng & lập hóa đơn"
        pending={pending}
        disabled={!tenantName.trim()}
        onClick={submit}
      />
    </div>
  );
}
