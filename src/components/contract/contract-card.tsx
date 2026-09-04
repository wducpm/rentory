"use client";

import { useState } from "react";
import {
  CalendarClock,
  CalendarX2,
  Pencil,
  Phone,
  Receipt,
  Users,
} from "lucide-react";
import { Money, Pill } from "@/components/ui-kit";
import {
  ContractSheet,
  type EditableContract,
} from "@/components/contract/contract-sheet";
import { dateLabel, todayIso } from "@/lib/labels";

/** Thẻ hợp đồng hiện tại ở S-03, kèm CTA Sửa HĐ. */
export function ContractCard({ contract }: { contract: EditableContract }) {
  const [editing, setEditing] = useState(false);

  const expiring = daysLeft(contract.end_date);

  return (
    <>
      <div className="bg-card border-border space-y-3 rounded-2xl border p-4">
        <div className="flex items-start gap-2">
          <div className="min-w-0">
            <p className="text-base font-semibold">{contract.tenant_name}</p>
            {expiring !== null ? (
              <p className="text-muted-foreground mt-0.5 text-[11px]">
                {expiring < 0
                  ? `Đã hết hạn ${-expiring} ngày`
                  : `Còn ${expiring} ngày`}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setEditing(true)}
            className="border-border focus-visible:ring-ring ml-auto inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold focus-visible:ring-2 focus-visible:outline-none"
          >
            <Pencil className="size-3.5" aria-hidden />
            Sửa HĐ
          </button>
        </div>

        {expiring !== null && expiring <= 30 ? (
          <Pill tone={expiring < 0 ? "destructive" : "warning"}>
            {expiring < 0 ? "Hợp đồng đã hết hạn" : "Sắp hết hạn"}
          </Pill>
        ) : null}

        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          <Field icon={<Users />} label="Số người ở">
            {contract.occupants}
          </Field>
          <Field icon={<Phone />} label="Điện thoại">
            {contract.phone ?? "—"}
          </Field>
          <Field icon={<CalendarClock />} label="Ngày vào">
            {dateLabel(contract.start_date)}
          </Field>
          <Field icon={<CalendarX2 />} label="Ngày hết hạn">
            {contract.end_date ? dateLabel(contract.end_date) : "Không thời hạn"}
          </Field>
          <Field icon={<Receipt />} label="Giá thuê / tháng">
            <Money value={contract.rent} />
          </Field>
          <Field icon={<Receipt />} label="Cọc gốc">
            <Money value={contract.deposit} />
          </Field>
        </dl>
      </div>

      <ContractSheet
        contract={contract}
        open={editing}
        onOpenChange={setEditing}
      />
    </>
  );
}

function daysLeft(endDate: string | null): number | null {
  if (!endDate) return null;
  const today = todayIso();
  const ms =
    new Date(`${endDate}T00:00:00`).getTime() -
    new Date(`${today}T00:00:00`).getTime();
  return Math.round(ms / 86_400_000);
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-muted-foreground flex items-center gap-1 text-[11px]">
        <span className="[&>svg]:size-3" aria-hidden>
          {icon}
        </span>
        {label}
      </dt>
      <dd className="mt-0.5 font-semibold">{children}</dd>
    </div>
  );
}
