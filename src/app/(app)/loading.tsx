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

      {/* Cao bằng hero header để không nhảy layout khi nội dung tới */}
      <Skeleton className="mt-3 mb-2 h-[92px] w-full rounded-3xl" />

      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
