# Rentory — Design System

Rút từ design tham chiếu (màn Trang Chủ, Stitch). **Mobile-first, chỉ tối ưu
mobile + tablet (iPad 11in). Không làm layout desktop** — trên màn rộng chỉ
canh giữa với `max-w-3xl`, vẫn dùng bottom-nav.

Token khai báo tại `src/app/globals.css`. **Không hardcode màu / spacing / radius** —
luôn dùng utility Tailwind trỏ về token.

---

## 1. Màu

| Token | Utility | Dùng cho |
|---|---|---|
| `--primary` | `bg-primary` `text-primary` | indigo thương hiệu: nút chính, tab đang chọn, số liệu nhấn |
| `--primary-soft` | `bg-primary-soft` | nền ô icon / pill indigo |
| `--success` / `--success-soft` | `text-success` `bg-success-soft` | trạng thái tốt: đang hoạt động, đã thu, phòng đầy |
| `--warning` / `--warning-soft` | `text-warning` `bg-warning-soft` | cần chú ý: còn phòng chưa thu, sắp hết hạn |
| `--destructive` / `--destructive-soft` | `text-destructive` `bg-destructive-soft` | quá hạn, sự cố, hành động phá hủy |
| `--info` / `--info-soft` | `text-info` `bg-info-soft` | thông tin trung tính |
| `--neutral-soft` | `bg-neutral-soft` | pill xám (phòng trống, nhãn phụ) |
| `--background` | `bg-background` | nền trang `#F6F6FA` xám ngả tím |
| `--card` | `bg-card` | nền thẻ trắng |
| `--muted-foreground` | `text-muted-foreground` | text phụ, nhãn |
| `--border` | `border-border` | viền thẻ, mảnh |

Quy tắc: **mỗi màn chỉ một màu nhấn**. Indigo dành cho hành động chính; xanh /
hổ phách / đỏ chỉ dùng để báo *trạng thái*, không dùng để trang trí.

## 2. Chữ

| Vai trò | Class | Ghi chú |
|---|---|---|
| Eyebrow | `text-[11px] font-semibold uppercase tracking-wider text-muted-foreground` | nhãn nhỏ trên tiêu đề |
| Tiêu đề màn | `text-xl font-bold` + `font-display` | Space Grotesk |
| Tiêu đề thẻ | `text-base font-semibold` | |
| Số liệu lớn | `text-3xl font-bold tabular` | Space Grotesk, `tabular-nums` |
| Body | `text-sm` | Manrope |
| Meta | `text-xs text-muted-foreground` | |
| **Số tiền** | luôn kèm class `tabular` | cột tiền phải thẳng hàng |

## 3. Nhịp & bo góc

- Padding trang: `px-4` (mobile) → `md:px-6`
- Khoảng cách giữa thẻ: `gap-3`; giữa khối: `space-y-5`
- Padding trong thẻ: `p-4`
- Bo: thẻ `rounded-2xl` · ô icon `rounded-xl` · pill `rounded-full` · nút `rounded-xl`
- Viền: `border border-border` — **không dùng shadow nặng**, design này phẳng và dựa vào viền + nền

## 4. Touch target

Tối thiểu **44px** (`h-11`) cho mọi thứ bấm được. Ô nhập số trong lưới chỉ số
dùng `h-11` luôn, không thu nhỏ.
Focus: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`.

## 5. Breakpoint

| | Rộng | Bố cục |
|---|---|---|
| Mobile | < 768px | 1 cột, thẻ tràn ngang, bottom-nav 4 tab |
| Tablet (iPad 11in) | ≥ 768px | lưới 2 cột cho danh sách phòng và thẻ chức năng, container `max-w-3xl mx-auto`, bottom-nav giữ nguyên |

Không có breakpoint desktop. `lg:` chỉ dùng để tăng `max-w`, không đổi bố cục.

## 6. Component

| Component | File | Mô tả |
|---|---|---|
| `AppHeader` | `components/app-header.tsx` | ô icon + eyebrow + tiêu đề, slot hành động bên phải |
| `BottomNav` | `components/bottom-nav.tsx` | 4 tab: Trang chủ · Phòng · Chỉ số · Cài đặt |
| `StatCard` | `components/ui-kit/stat-card.tsx` | nhãn + pill % + số lớn / mẫu số + thanh tiến độ + footer |
| `FeatureCard` | `components/ui-kit/feature-card.tsx` | ô icon màu + pill trạng thái + tiêu đề + phụ đề |
| `IconTile` | `components/ui-kit/icon-tile.tsx` | ô icon bo góc, 6 tone màu |
| `Pill` | `components/ui-kit/pill.tsx` | nhãn trạng thái bo tròn, 6 tone |
| `SectionHeader` | `components/ui-kit/section-header.tsx` | tiêu đề mục + badge đếm + link "Xem tất cả" |
| `AlertRow` | `components/ui-kit/alert-row.tsx` | dòng việc cần xử lý: icon + nội dung + nút hành động |
| `Money` | `components/ui-kit/money.tsx` | hiển thị tiền VND, `tabular`, âm thì đổi màu |
| `EmptyState` | `components/ui-kit/empty-state.tsx` | trạng thái rỗng: icon + câu dẫn + CTA |

## 7. Lệch so với design tham chiếu

Design gốc có tab **Hoá đơn** (danh sách toàn tòa) và **Báo cáo & Lãi lỗ**.
Cả hai nằm trong mục "Ngoài phạm vi" của HANDOFF nên **không implement**;
bottom-nav còn 4 tab. Trang chủ vì vậy cũng không có thẻ doanh thu / lãi lỗ —
thay bằng thẻ *Lấp đầy* và *Hóa đơn chưa thu* (đều là dữ liệu trong phạm vi).
