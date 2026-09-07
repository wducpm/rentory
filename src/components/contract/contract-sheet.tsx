"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { NumberField } from "@/components/forms/number-field";
import { TextField } from "@/components/forms/text-field";
import { TermPicker } from "@/components/forms/term-picker";
import { OccupantsEditor } from "@/components/contract/occupants-editor";
import { Label } from "@/components/ui/label";
import { updateContract } from "@/lib/actions";
import { formatVnd, validateOccupants, type ContractOccupant } from "@/lib/billing";
import { dateLabel } from "@/lib/labels";

export type EditableContract = {
  id: string;
  occupants: ContractOccupant[];
  rent: number;
  deposit: number;
  start_date: string;
  end_date: string | null;
};

/**
 * Sửa hợp đồng đang hiệu lực. Chỉ đổi điều khoản từ đây về sau —
 * hóa đơn đã lập giữ nguyên snapshot (N5) và phiếu thu đã ghi không đổi
 * (HD-08 không lan truyền). Ngày vào và cọc gốc khóa lại vì đã nằm trên
 * hóa đơn nhận phòng.
 */
export function ContractSheet({
  contract,
  open,
  onOpenChange,
}: {
  contract: EditableContract;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const [occupants, setOccupants] = useState<ContractOccupant[]>(
    contract.occupants,
  );
  const [rent, setRent] = useState<number | "">(contract.rent);
  const [endDate, setEndDate] = useState(contract.end_date ?? "");

  function save() {
    // BR-P17 · AC-24.4
    const issues = validateOccupants(occupants);
    if (issues.length > 0) {
      toast.error(issues[0].message);
      return;
    }
    if (endDate && endDate <= contract.start_date) {
      toast.error("Ngày hết hạn phải sau ngày vào.");
      return;
    }

    start(async () => {
      const res = await updateContract({
        contract_id: contract.id,
        occupants: occupants.map((o) => ({
          full_name: o.full_name,
          phone: o.phone ?? "",
          national_id: o.national_id ?? "",
          is_primary: o.is_primary,
        })),
        rent: rent === "" ? 0 : Number(rent),
        end_date: endDate || null,
      });

      if (res.ok) {
        toast.success("Đã lưu hợp đồng");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92dvh] overflow-y-auto rounded-t-2xl"
      >
        <SheetHeader>
          <SheetTitle>Sửa hợp đồng</SheetTitle>
          <SheetDescription>
            Điều khoản mới áp dụng từ đợt thu kế tiếp. Hóa đơn và phiếu thu đã
            ghi giữ nguyên.
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-4 px-4 pb-4">
          <section className="grid gap-3">
            <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              Người ở
            </p>
            <OccupantsEditor
              occupants={occupants}
              onChange={setOccupants}
              idPrefix="ct-occ"
            />
          </section>

          <section className="grid gap-3">
            <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              Điều khoản
            </p>
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                id="ct-rent"
                label="Giá thuê / tháng"
                suffix="đ"
                step="1000"
                value={rent}
                onChange={setRent}
              />
              <TextField
                id="ct-end"
                type="date"
                label="Ngày hết hạn"
                value={endDate}
                onChange={setEndDate}
              />
            </div>

            <TermPicker
              startDate={contract.start_date}
              endDate={endDate}
              onPick={setEndDate}
            />
          </section>

          {/* Khóa lại: đã nằm trên hóa đơn nhận phòng, sửa ở đây sẽ lệch snapshot */}
          <section className="grid grid-cols-2 gap-3">
            <ReadOnlyField label="Ngày vào" value={dateLabel(contract.start_date)} />
            <ReadOnlyField label="Cọc gốc" value={formatVnd(contract.deposit)} />
          </section>

          <p className="text-muted-foreground border-border flex gap-2 rounded-xl border p-3 text-[11px]">
            <Users className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              Đổi số người ở chỉ ảnh hưởng dịch vụ chung của các hóa đơn lập từ
              nay về sau. Hóa đơn cũ giữ nguyên số đã chốt.
            </span>
          </p>

          <button
            type="button"
            onClick={save}
            disabled={pending || validateOccupants(occupants).length > 0}
            className="bg-primary text-primary-foreground focus-visible:ring-ring h-12 w-full rounded-xl text-sm font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-40"
          >
            {pending ? "Đang lưu…" : "Lưu hợp đồng"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <p className="border-border text-muted-foreground flex h-11 items-center rounded-xl border border-dashed px-3 text-sm font-semibold">
        {value}
      </p>
    </div>
  );
}
