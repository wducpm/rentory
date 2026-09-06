"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, Lock, Pencil, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { NumberField } from "@/components/forms/number-field";
import { Money, Pill } from "@/components/ui-kit";
import { archiveRoom, createRoom, updateRoom } from "@/lib/actions";
import { ROOM_STATUS_LABEL } from "@/lib/labels";

type Room = {
  id: string;
  code: string;
  floor: number | null;
  status: keyof typeof ROOM_STATUS_LABEL;
  archived: boolean;
  /** FR-006: giá của hợp đồng hiệu lực; phòng trống → null. */
  rent: number | null;
  /** CR-04 · BR-S10: đã có hóa đơn thì không đổi được tên. */
  hasInvoices: boolean;
};

type Draft = { code: string; floor: number | "" };

const EMPTY: Draft = { code: "", floor: "" };

export function RoomsManager({ rooms }: { rooms: Room[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);

  function submit() {
    start(async () => {
      const payload = {
        code: draft.code,
        floor: draft.floor === "" ? null : Number(draft.floor),
      };
      const res = editingId
        ? await updateRoom(editingId, payload)
        : await createRoom(payload);

      if (res.ok) {
        toast.success(editingId ? "Đã cập nhật phòng" : `Đã thêm phòng ${payload.code}`);
        setAdding(false);
        setEditingId(null);
        setDraft(EMPTY);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  // CR-07: archive là một chiều, v1 không có khôi phục
  function archive(room: Room) {
    if (
      !window.confirm(
        `Lưu trữ phòng ${room.code}? Lịch sử hóa đơn vẫn tra cứu được, nhưng bản v1 chưa có chức năng khôi phục.`,
      )
    )
      return;

    start(async () => {
      const res = await archiveRoom(room.id);
      if (res.ok) {
        toast.success(`Đã lưu trữ phòng ${room.code}`);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  const editorOpen = adding || editingId !== null;

  return (
    <div className="space-y-2">
      {editorOpen ? (
        <div className="bg-card border-primary/30 space-y-3 rounded-2xl border-2 p-4">
          <div className="flex items-center">
            <p className="text-sm font-semibold">
              {editingId ? "Sửa phòng" : "Thêm phòng"}
            </p>
            <button
              type="button"
              aria-label="Đóng"
              onClick={() => {
                setAdding(false);
                setEditingId(null);
                setDraft(EMPTY);
              }}
              className="text-muted-foreground focus-visible:ring-ring ml-auto inline-flex size-9 items-center justify-center rounded-lg focus-visible:ring-2 focus-visible:outline-none"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <label htmlFor="room-code" className="text-xs font-medium">
                Số phòng
              </label>
              <div className="flex items-center gap-2">
                {/* BR-S02: tiền tố P do hệ thống gắn, admin chỉ gõ phần số */}
                <span className="text-muted-foreground text-sm font-semibold">
                  P
                </span>
                <input
                  id="room-code"
                  inputMode="numeric"
                  value={draft.code}
                  onChange={(e) =>
                    setDraft({ ...draft, code: e.target.value.replace(/\D/g, "") })
                  }
                  placeholder="201"
                  className="border-input bg-card focus-visible:ring-ring h-11 w-full rounded-xl border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
                />
              </div>
            </div>
            <NumberField
              id="room-floor"
              label="Tầng"
              value={draft.floor}
              onChange={(x) => setDraft({ ...draft, floor: x })}
            />
          </div>
          <p className="text-muted-foreground text-[11px]">
            Giá thuê không đặt ở đây — giá thuộc hợp đồng, nhập khi nhận phòng
            (BR-S05).
          </p>

          <button
            type="button"
            onClick={submit}
            disabled={pending || !draft.code.trim()}
            className="bg-primary text-primary-foreground focus-visible:ring-ring h-11 w-full rounded-xl text-sm font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-40"
          >
            {pending ? "Đang lưu…" : editingId ? "Lưu thay đổi" : "Thêm phòng"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setAdding(true);
            setDraft(EMPTY);
          }}
          className="border-border text-muted-foreground focus-visible:ring-ring flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed text-sm font-semibold focus-visible:ring-2 focus-visible:outline-none"
        >
          <Plus className="size-4" aria-hidden />
          Thêm phòng
        </button>
      )}

      <ul className="space-y-2">
        {rooms.map((room) => (
          <li
            key={room.id}
            className="bg-card border-border flex items-center gap-3 rounded-2xl border p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm font-semibold">
                P.{room.code}
                <Pill tone={room.status === "occupied" ? "success" : "neutral"}>
                  {ROOM_STATUS_LABEL[room.status]}
                </Pill>
              </p>
              <p className="text-muted-foreground mt-0.5 text-[11px]">
                {room.floor !== null ? `Tầng ${room.floor} · ` : ""}
                {/* FR-006 · AC-06.1/06.2: chỉ đọc, phòng trống hiện gạch ngang */}
                {room.rent === null ? "—" : <Money value={room.rent} />}
                {room.rent === null ? "" : "/kỳ"}
              </p>
            </div>

            <button
              type="button"
              aria-label={
                room.hasInvoices
                  ? `Phòng ${room.code} đã có hóa đơn, không đổi được tên`
                  : `Sửa phòng ${room.code}`
              }
              disabled={room.hasInvoices}
              title={
                room.hasInvoices
                  ? "Phòng đã có hóa đơn — mã hóa đơn đã lưu số phòng nên không đổi tên được (BR-S10)"
                  : undefined
              }
              onClick={() => {
                setAdding(false);
                setEditingId(room.id);
                setDraft({ code: room.code, floor: room.floor ?? "" });
              }}
              className="border-border focus-visible:ring-ring inline-flex size-11 shrink-0 items-center justify-center rounded-xl border focus-visible:ring-2 focus-visible:outline-none disabled:opacity-30"
            >
              {room.hasInvoices ? (
                <Lock className="size-4" aria-hidden />
              ) : (
                <Pencil className="size-4" aria-hidden />
              )}
            </button>

            <button
              type="button"
              aria-label={`Lưu trữ phòng ${room.code}`}
              disabled={pending || room.status === "occupied" || room.archived}
              onClick={() => archive(room)}
              className="border-border focus-visible:ring-ring inline-flex size-11 shrink-0 items-center justify-center rounded-xl border focus-visible:ring-2 focus-visible:outline-none disabled:opacity-30"
            >
              <Archive className="size-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
