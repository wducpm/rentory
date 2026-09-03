"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Pencil, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { NumberField } from "@/components/forms/number-field";
import { TextField } from "@/components/forms/text-field";
import { Money, Pill } from "@/components/ui-kit";
import { archiveRoom, createRoom, updateRoom } from "@/lib/actions";
import { ROOM_STATUS_LABEL } from "@/lib/labels";

type Room = {
  id: string;
  code: string;
  floor: number | null;
  base_rent: number;
  status: keyof typeof ROOM_STATUS_LABEL;
  archived: boolean;
};

type Draft = { code: string; floor: number | ""; base_rent: number | "" };

const EMPTY: Draft = { code: "", floor: "", base_rent: "" };

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
        base_rent: draft.base_rent === "" ? 0 : Number(draft.base_rent),
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

  function toggleArchive(room: Room) {
    start(async () => {
      const res = await archiveRoom(room.id, !room.archived);
      if (res.ok) {
        toast.success(room.archived ? "Đã khôi phục phòng" : "Đã lưu trữ phòng");
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
            <TextField
              id="room-code"
              label="Số phòng"
              value={draft.code}
              onChange={(x) => setDraft({ ...draft, code: x })}
              placeholder="201"
            />
            <NumberField
              id="room-floor"
              label="Tầng"
              value={draft.floor}
              onChange={(x) => setDraft({ ...draft, floor: x })}
            />
          </div>
          <NumberField
            id="room-rent"
            label="Tiền phòng mặc định"
            suffix="đ"
            value={draft.base_rent}
            onChange={(x) => setDraft({ ...draft, base_rent: x })}
          />

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
                <Money value={room.base_rent} />/kỳ
              </p>
            </div>

            <button
              type="button"
              aria-label={`Sửa phòng ${room.code}`}
              onClick={() => {
                setAdding(false);
                setEditingId(room.id);
                setDraft({
                  code: room.code,
                  floor: room.floor ?? "",
                  base_rent: room.base_rent,
                });
              }}
              className="border-border focus-visible:ring-ring inline-flex size-11 shrink-0 items-center justify-center rounded-xl border focus-visible:ring-2 focus-visible:outline-none"
            >
              <Pencil className="size-4" aria-hidden />
            </button>

            <button
              type="button"
              aria-label={
                room.archived
                  ? `Khôi phục phòng ${room.code}`
                  : `Lưu trữ phòng ${room.code}`
              }
              disabled={pending || room.status === "occupied"}
              onClick={() => toggleArchive(room)}
              className="border-border focus-visible:ring-ring inline-flex size-11 shrink-0 items-center justify-center rounded-xl border focus-visible:ring-2 focus-visible:outline-none disabled:opacity-30"
            >
              {room.archived ? (
                <ArchiveRestore className="size-4" aria-hidden />
              ) : (
                <Archive className="size-4" aria-hidden />
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
