"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NumberField } from "@/components/forms/number-field";
import { saveSettings } from "@/lib/actions";

type Prices = {
  elec_price: number;
  water_price: number;
  internet_fee: number;
  common_fee: number;
};

export function PricesForm({ initial }: { initial: Prices }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [v, setV] = useState<Record<keyof Prices, number | "">>(initial);

  const dirty = (Object.keys(initial) as (keyof Prices)[]).some(
    (k) => v[k] !== initial[k],
  );

  function save() {
    start(async () => {
      const payload = Object.fromEntries(
        (Object.keys(initial) as (keyof Prices)[]).map((k) => [
          k,
          v[k] === "" ? 0 : Number(v[k]),
        ]),
      ) as Prices;

      const res = await saveSettings(payload);
      if (res.ok) {
        toast.success("Đã lưu đơn giá");
        router.refresh();
      } else {
        toast.error(res.error);
      }
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
