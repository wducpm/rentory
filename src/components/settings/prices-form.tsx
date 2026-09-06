"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NumberField } from "@/components/forms/number-field";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveSettings } from "@/lib/actions";

type Prices = {
  elec_price: number;
  water_price: number;
  internet_fee: number;
  common_fee: number;
};

type Initial = Prices & { invoice_note: string };

const PRICE_KEYS = [
  "elec_price",
  "water_price",
  "internet_fee",
  "common_fee",
] as const;

export function PricesForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [v, setV] = useState<Record<(typeof PRICE_KEYS)[number], number | "">>({
    elec_price: initial.elec_price,
    water_price: initial.water_price,
    internet_fee: initial.internet_fee,
    common_fee: initial.common_fee,
  });
  const [note, setNote] = useState(initial.invoice_note);

  const dirty =
    PRICE_KEYS.some((k) => v[k] !== initial[k]) ||
    note !== initial.invoice_note;

  function save() {
    start(async () => {
      const payload = {
        ...(Object.fromEntries(
          PRICE_KEYS.map((k) => [k, v[k] === "" ? 0 : Number(v[k])]),
        ) as Prices),
        invoice_note: note.trim() || null,
      };

      const res = await saveSettings(payload);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      // BR-S04: đơn giá mới chỉ áp cho hóa đơn lập sau đó (AC-02.4)
      toast.success("Đã lưu. Đơn giá mới áp cho hóa đơn lập từ giờ trở đi.");
      router.refresh();
    });
  }

  return (
    <div className="bg-card border-border space-y-3 rounded-2xl border p-4">
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          id="elec_price"
          label="Điện"
          suffix="đ/số"
          value={v.elec_price}
          onChange={(x) => setV({ ...v, elec_price: x })}
        />
        <NumberField
          id="water_price"
          label="Nước"
          suffix="đ/khối"
          value={v.water_price}
          onChange={(x) => setV({ ...v, water_price: x })}
        />
        <NumberField
          id="internet_fee"
          label="Internet"
          suffix="đ/kỳ"
          value={v.internet_fee}
          onChange={(x) => setV({ ...v, internet_fee: x })}
        />
        <NumberField
          id="common_fee"
          label="Dịch vụ chung"
          suffix="đ/người"
          value={v.common_fee}
          onChange={(x) => setV({ ...v, common_fee: x })}
        />
      </div>

      {/* AC-14.4 — ghi chú in ở cuối hóa đơn, tùy từng tòa */}
      <div className="grid gap-1.5">
        <Label htmlFor="invoice_note" className="text-xs">
          Ghi chú cuối hóa đơn
        </Label>
        <Textarea
          id="invoice_note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={"ĐỂ XE DƯỚI TẦNG HẦM\nTHANH TOÁN TỪ MÙNG 01 - 05"}
          className="rounded-xl"
        />
        <p className="text-muted-foreground text-[11px]">
          In màu đỏ ở cuối mọi hóa đơn tải về. Xuống dòng được.
        </p>
      </div>

      <button
        type="button"
        onClick={save}
        disabled={pending || !dirty}
        className="bg-primary text-primary-foreground focus-visible:ring-ring h-11 w-full rounded-xl text-sm font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-40"
      >
        {pending ? "Đang lưu…" : "Lưu đơn giá"}
      </button>

      <p className="text-muted-foreground text-[11px]">
        Đơn giá chỉ dùng để tính <em>số mặc định</em> khi lập hóa đơn. Admin vẫn
        sửa được mọi con số trên từng hóa đơn (N6).
      </p>
    </div>
  );
}
