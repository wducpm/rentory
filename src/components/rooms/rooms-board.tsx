"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui-kit";
import { RoomCard, type RoomCardData } from "./room-card";
import { dateLabel } from "@/lib/labels";

type Filter = "all" | "occupied" | "vacant" | "due";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "occupied", label: "Đang thuê" },
  { key: "vacant", label: "Phòng trống" },
  { key: "due", label: "Chưa thu" },
];

/**
 * Màn Quản lý phòng, dựng theo `docs/ui/menu quản lý phòng`.
 *
 * Lọc và tìm kiếm chạy hoàn toàn phía client: một tòa cỡ vài chục phòng thì
 * lọc tại chỗ phản hồi tức thì, rẻ hơn nhiều so với mỗi lần gõ lại đi một
 * vòng lên server.
 *
 * Không có ô "Bảo trì": CR-01 đã bỏ trạng thái này, phòng chỉ còn Đang thuê /
 * Trống và suy ra từ hợp đồng hiệu lực (BR-P04).
 */
export function RoomsBoard({
  rooms,
  initialFilter = "all",
}: {
  rooms: RoomCardData[];
  initialFilter?: Filter;
}) {
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [query, setQuery] = useState("");

  const occupied = rooms.filter((r) => r.status === "occupied");
  const vacant = rooms.filter((r) => r.status === "vacant");
  const due = rooms.filter((r) => r.dueCount > 0);
  const occupancy = rooms.length
    ? Math.round((occupied.length / rooms.length) * 1000) / 10
    : 0;

  const counts: Record<Filter, number> = {
    all: rooms.length,
    occupied: occupied.length,
    vacant: vacant.length,
    due: due.length,
  };

  const expiring = rooms
    .filter((r) => r.expiringSoon)
    .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0));

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rooms
      .filter((r) =>
        filter === "occupied"
          ? r.status === "occupied"
          : filter === "vacant"
            ? r.status === "vacant"
            : filter === "due"
              ? r.dueCount > 0
              : true,
      )
      .filter(
        (r) =>
          !q ||
          r.code.toLowerCase().includes(q) ||
          (r.tenantName ?? "").toLowerCase().includes(q),
      );
  }, [rooms, filter, query]);

  // Chưa phòng nào có tầng thì nhóm là vô nghĩa — một header ôm trọn danh sách
  // còn tệ hơn không nhóm.
  const anyFloor = rooms.some((r) => r.floor !== null);

  // Sĩ số thật của từng tầng, tính trên toàn bộ danh sách chứ không phải phần
  // đang hiển thị: lọc "Phòng trống" mà header ghi "0/1 đã lấp đầy" thì con số
  // vô nghĩa — admin cần biết tầng đó có bao nhiêu phòng.
  const floorTotals = useMemo(() => {
    const map = new Map<number | null, { total: number; inUse: number }>();
    for (const r of rooms) {
      const cur = map.get(r.floor) ?? { total: 0, inUse: 0 };
      cur.total += 1;
      if (r.status === "occupied") cur.inUse += 1;
      map.set(r.floor, cur);
    }
    return map;
  }, [rooms]);

  // Nhóm theo tầng, tầng cao lên trước — khớp thứ tự admin đi từ trên xuống
  const floors = useMemo(() => {
    const map = new Map<number | null, RoomCardData[]>();
    for (const r of visible) {
      const list = map.get(r.floor) ?? [];
      list.push(r);
      map.set(r.floor, list);
    }
    return [...map.entries()]
      .sort((a, b) => (b[0] ?? -1) - (a[0] ?? -1))
      .map(([floor, list]) => ({
        floor,
        // Giảm dần trong tầng, khớp thứ tự admin đi đọc công tơ (BR-M01)
        rooms: [...list].sort((a, b) => (a.code < b.code ? 1 : -1)),
      }));
  }, [visible]);

  return (
    <div className="space-y-3">
      {/* Tỷ lệ lấp đầy — không có mũi tên xu hướng vì không lưu lịch sử theo kỳ */}
      <section className="bg-card border-border rounded-2xl border p-4">
        <p className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
          Tỷ lệ lấp đầy
        </p>
        <p className="tabular mt-1 text-3xl leading-none font-bold">
          {occupancy}%
        </p>

        <div
          className="bg-secondary mt-3 flex h-2 w-full overflow-hidden rounded-full"
          role="img"
          aria-label={`${occupied.length} phòng đang thuê, ${vacant.length} phòng trống`}
        >
          <span
            className="bg-primary h-full"
            style={{ width: `${rooms.length ? (occupied.length / rooms.length) * 100 : 0}%` }}
          />
          <span
            className="bg-destructive h-full"
            style={{ width: `${rooms.length ? (vacant.length / rooms.length) * 100 : 0}%` }}
          />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <Stat label="Tổng số" value={rooms.length} />
          <Stat label="Đang thuê" value={occupied.length} tone="text-success" />
          <Stat label="Trống" value={vacant.length} tone="text-destructive" />
        </div>
      </section>

      {/* Banner HĐ sắp hết hạn — ngưỡng 15 ngày (CR-06) */}
      {expiring.map((r) => (
        <div
          key={r.id}
          className="bg-warning-soft flex items-center gap-3 rounded-2xl p-3"
        >
          <CalendarClock className="text-warning size-5 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              P.{r.code} · {r.tenantName}
            </p>
            <p className="text-muted-foreground truncate text-[11px]">
              HĐ hết hiệu lực {dateLabel(r.endDate)}
              {r.daysLeft !== null
                ? r.daysLeft < 0
                  ? ` — quá hạn ${-r.daysLeft} ngày`
                  : ` — còn ${r.daysLeft} ngày`
                : ""}
            </p>
          </div>
          <Link
            href={`/rooms/${r.id}`}
            className="bg-primary text-primary-foreground focus-visible:ring-ring inline-flex h-9 shrink-0 items-center rounded-xl px-3 text-xs font-semibold focus-visible:ring-2 focus-visible:outline-none"
          >
            Gia hạn
          </Link>
        </div>
      ))}

      {/* Tìm kiếm + lọc */}
      <div className="space-y-2">
        <div className="relative">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm số phòng, tên khách (VD: 802, Trang)"
            aria-label="Tìm phòng"
            className="border-input bg-card focus-visible:ring-ring h-11 w-full rounded-xl border pr-3 pl-9 text-sm focus-visible:ring-2 focus-visible:outline-none"
          />
        </div>

        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
              className={cn(
                "focus-visible:ring-ring inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold focus-visible:ring-2 focus-visible:outline-none",
                filter === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border-border text-muted-foreground border",
              )}
            >
              {label}
              <span
                className={cn(
                  "tabular rounded-full px-1.5 text-[10px]",
                  filter === key ? "bg-white/20" : "bg-secondary",
                )}
              >
                {counts[key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Danh sách theo tầng */}
      {visible.length === 0 ? (
        <EmptyState
          icon={<Search />}
          title="Không tìm thấy phòng nào"
          description="Thử đổi từ khóa hoặc bộ lọc."
        />
      ) : !anyFloor ? (
        <ul className="grid gap-2 pt-1 md:grid-cols-2">
          {visible.map((r) => (
            <li key={r.id}>
              <RoomCard room={r} />
            </li>
          ))}
        </ul>
      ) : (
        floors.map(({ floor, rooms: list }) => {
          const { total, inUse } = floorTotals.get(floor) ?? {
            total: list.length,
            inUse: 0,
          };
          return (
            <section key={String(floor)} className="space-y-2 pt-1">
              <div className="flex items-center gap-2 px-1">
                <span
                  className={cn(
                    "size-2.5 shrink-0 rounded-full",
                    inUse === total ? "bg-primary" : "bg-destructive",
                  )}
                  aria-hidden
                />
                <h2 className="text-sm font-semibold">
                  {floor === null ? "Chưa gán tầng" : `Tầng ${floor}`}
                </h2>
                <span className="text-muted-foreground text-[11px]">
                  ({inUse}/{total} đã lấp đầy)
                </span>
                <span
                  className={cn(
                    "ml-auto text-[11px] font-semibold",
                    inUse === total ? "text-success" : "text-destructive",
                  )}
                >
                  {inUse === total ? "100% thuê" : `${total - inUse} phòng trống`}
                </span>
              </div>

              <ul className="grid gap-2 md:grid-cols-2">
                {list.map((r) => (
                  <li key={r.id}>
                    <RoomCard room={r} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <div className="bg-muted rounded-xl p-2 text-center">
      <p className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
        {label}
      </p>
      <p className={cn("tabular mt-0.5 text-base font-semibold", tone)}>
        {value}
      </p>
    </div>
  );
}
