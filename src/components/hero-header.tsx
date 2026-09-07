import { MapPin } from "lucide-react";

/**
 * Header cho các màn cấp 1 (Trang chủ · Phòng · Chỉ số · Cài đặt).
 *
 * Theo hai file code.html trong `docs/ui`: thẻ tối màu bo 24px, gradient xanh đen ngả lục,
 * hai đốm sáng mờ ở hai góc đối nhau. Mang tên và địa chỉ tòa nhà — thông tin
 * này trước đây nằm trong một thẻ riêng ở trang chủ, giờ gộp vào header nên
 * mọi màn đều biết mình đang ở tòa nào.
 *
 * Màn con (có nút quay lại) vẫn dùng `AppHeader` gọn nhẹ — xem app-header.tsx.
 */
export function HeroHeader({
  buildingName,
  address,
  actions,
}: {
  buildingName: string;
  address?: string | null;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mx-auto max-w-3xl px-4 pt-3 pb-2 md:px-6">
      <div className="relative overflow-hidden rounded-3xl border border-slate-800/90 bg-[linear-gradient(to_bottom_right,#0c1524,#0e1d2c,#04241d)] p-4 text-white shadow-xl">
        {/* Hai đốm sáng mờ tạo chiều sâu, không mang thông tin */}
        <span
          aria-hidden
          className="pointer-events-none absolute -top-12 -right-12 size-48 rounded-full bg-emerald-500/15 blur-3xl"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-12 -left-12 size-48 rounded-full bg-indigo-600/20 blur-3xl"
        />

        <div className="relative flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-heading truncate text-[15.5px] font-bold text-white">
              {buildingName}
            </h1>
            {address ? (
              <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-slate-200">
                <MapPin className="size-3.5 shrink-0 text-emerald-400" aria-hidden />
                <span className="truncate">{address}</span>
              </p>
            ) : null}
          </div>

          {actions ? (
            <div className="flex shrink-0 items-center gap-1.5">{actions}</div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

/** Nút 40×40 trong hero — kiểu gradient indigo như mockup. */
export function HeroAction({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      aria-label={label}
      className="inline-flex size-10 items-center justify-center rounded-xl border border-indigo-400/40 bg-[linear-gradient(to_top_right,#4f46e5,#6366f1)] text-white focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
    >
      {children}
    </button>
  );
}
