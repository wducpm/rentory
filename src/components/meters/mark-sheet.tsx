"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { setMeterMark } from "@/lib/actions";
import { todayIso } from "@/lib/labels";
import type { MeterRow } from "./meters-grid";

/**
 * HD-11 — sửa mốc thủ công (thay công tơ). Bắt buộc ghi lý do; mọi lần ghi đè
 * đều vào `meter_mark_logs` (N3).
 */
export function MarkSheet({
  room,
  open,
  onOpenChange,
}: {
  room: MeterRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [elec, setElec] = useState<number | "">(room.currentElec);
  const [water, setWater] = useState<number | "">(room.currentWater);
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState("");

  function save() {
    start(async () => {
      const res = await setMeterMark({
        room_id: room.roomId,
        elec: elec === "" ? 0 : Number(elec),
        water: water === "" ? 0 : Number(water),
        effective_date: date,
        note,
      });
      if (res.ok) {
        toast.success(`Đã sửa mốc phòng ${room.roomCode}`);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Sửa mốc phòng {room.roomCode}</SheetTitle>
          <SheetDescription>
            Dùng khi thay công tơ hoặc cần chỉnh lại mốc. Lần ghi đè này sẽ được
            lưu vào lịch sử phòng.
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-3 px-4 pb-4">
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              id="mark-elec"
              label="Mốc điện mới"
              value={elec}
              onChange={setElec}
              hint={`Đang là ${room.currentElec}`}
            />
            <NumberField
              id="mark-water"
              label="Mốc nước mới"
              value={water}
              onChange={setWater}
              hint={`Đang là ${room.currentWater}`}
            />
          </div>

          <TextField
            id="mark-date"
            type="date"
            label="Ngày hiệu lực"
            value={date}
            onChange={setDate}
          />

          <TextField
            id="mark-note"
            label="Lý do"
            value={note}
            onChange={setNote}
            placeholder="VD: thay công tơ điện"
            required
          />

          <p className="text-muted-foreground text-[11px]">
            Đoạn tiêu thụ trước khi sửa mốc sẽ không nằm trên hóa đơn nào. Nếu
            cần thu bù, admin tự cộng vào tiền điện/nước của hóa đơn kỳ sau —
            chỉ số vẫn giữ nguyên (HD-12).
          </p>

          <button
            type="button"
            onClick={save}
            disabled={pending || !note.trim()}
            className="bg-primary text-primary-foreground focus-visible:ring-ring h-12 w-full rounded-xl text-sm font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-40"
          >
            {pending ? "Đang lưu…" : "Ghi đè mốc"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
