import { Skeleton } from "@/components/ui/skeleton";

/**
 * Mọi màn trong app đều render phía server nên có một khoảng chờ trước khi
 * nội dung tới. Không có gì hiện ra thì người dùng tưởng app treo và bấm lại.
 * Khung xương này hiện ngay lúc chạm, giữ đúng bố cục chung: header + thẻ.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-6 md:px-6" aria-busy>
      <span className="sr-only">Đang tải…</span>

      <div className="flex items-center gap-3 py-3">
        <Skeleton className="size-11 rounded-xl" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-40" />
        </div>
      </div>

      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
