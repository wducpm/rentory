"use client";

import { useState } from "react";
import {
  CalendarClock,
  CalendarX2,
  Pencil,
  Phone,
  Receipt,
  Star,
  Users,
} from "lucide-react";
import { Money, Pill } from "@/components/ui-kit";
import {
  ContractSheet,
  type EditableContract,
} from "@/components/contract/contract-sheet";
import { dateLabel, todayIso } from "@/lib/labels";
import {
  CONTRACT_EXPIRY_WARNING_DAYS,
  daysUntil,
  primaryName,
} from "@/lib/billing";

/** Thẻ hợp đồng hiện tại ở S-03, kèm CTA Sửa HĐ. */
export function ContractCard({ contract }: { contract: EditableContract }) {
  const [editing, setEditing] = useState(false);

  const expiring = daysUntil(contract.end_date, todayIso());

  return (
    <>
      <div className="bg-card border-border space-y-3 rounded-2xl border p-4">
        <div className="flex items-start gap-2">
          <div className="min-w-0">
            <p className="text-base font-semibold">
              {primaryName(contract.occupants)}
            </p>
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

        {/* CR-06 · FR-208: ngưỡng 15 ngày, hằng số đặt ở lib/billing */}
        {expiring !== null && expiring <= CONTRACT_EXPIRY_WARNING_DAYS ? (
          <Pill tone={expiring < 0 ? "destructive" : "warning"}>
            {expiring < 0 ? "Hợp đồng đã hết hạn" : "Sắp hết hạn"}
          </Pill>
        ) : null}

        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          <Field icon={<Users />} label="Số người ở">
            {contract.occupants.length}
          </Field>
          <Field icon={<Phone />} label="Điện thoại">
            {contract.occupants.find((o) => o.is_primary)?.phone ?? "—"}
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

        {/* CR-02 · FR-202 — danh sách đầy đủ người ở, đánh dấu người đại diện */}
        <div className="border-border border-t pt-3">
          <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Người ở ({contract.occupants.length})
          </p>
          <ul className="mt-2 grid gap-1.5">
            {contract.occupants.map((o, i) => (
              <li key={o.id ?? i} className="flex items-start gap-2 text-xs">
                {o.is_primary ? (
                  <Star
                    className="text-primary mt-0.5 size-3.5 shrink-0"
                    aria-label="Người đại diện"
                  />
                ) : (
                  <span className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {o.full_name}
                  </span>
                  {o.national_id ? (
                    <span className="text-muted-foreground tabular block text-[11px]">
                      CCCD {o.national_id}
                    </span>
                  ) : null}
                </span>
                <span className="text-muted-foreground tabular shrink-0">
                  {o.phone || "—"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <ContractSheet
        contract={contract}
        open={editing}
        onOpenChange={setEditing}
      />
    </>
  );
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
