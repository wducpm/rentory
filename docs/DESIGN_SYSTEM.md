# Rentory — Design System

Rút từ `docs/ui/` (`structure_operations_admin/DESIGN.md`, `trang chu/code.html`,
`menu quản lý phòng/code.html`). **Mobile-first, chỉ tối ưu mobile + tablet
(iPad 11in). Không làm layout desktop** — trên màn rộng chỉ canh giữa với
`max-w-3xl`, vẫn dùng bottom-nav.

Token khai báo tại `src/app/globals.css`. **Không hardcode màu / spacing / radius** —
luôn dùng utility Tailwind trỏ về token.

> Ba tài liệu trong `docs/ui` mâu thuẫn nhau về màu. Chốt theo **palette của
> `trang chu/code.html`** (Tailwind slate + indigo + emerald/amber/rose), vì
> phần văn xuôi của DESIGN.md mô tả đúng bảng này — hai trong ba nguồn trùng
> nhau, chỉ frontmatter Material 3 là lệch. `menu quản lý phòng` chỉ dùng để
> lấy **bố cục**, không lấy màu.

---

## 1. Màu

| Token | Utility | Dùng cho |
|---|---|---|
| `--primary` | `bg-primary` `text-primary` | indigo `#4f46e5`: nút chính, tab đang chọn, số liệu nhấn |
| `--primary-soft` / `--primary-strong` | `bg-primary-soft` / `text-primary-strong` | nền pill indigo / chữ trên nền đó |
| `--success` / `-soft` / `-strong` | `text-success` `bg-success-soft` | emerald: đang thuê, đã thu, phòng đầy |
| `--warning` / `-soft` / `-strong` | `text-warning` `bg-warning-soft` | amber: chưa thu, HĐ sắp hết hạn |
| `--destructive` / `-soft` / `-strong` | `text-destructive` `bg-destructive-soft` | rose: quá hạn, phòng trống, hành động phá hủy |
| `--info` / `-soft` / `-strong` | `text-info` `bg-info-soft` | blue: chỉ số công tơ, thông tin trung tính |
| `--neutral-soft` / `--neutral-strong` | `bg-neutral-soft` `text-neutral-strong` | pill xám, nhãn phụ |
| `--background` | `bg-background` | nền trang `#f8fafc` |
| `--card` | `bg-card` | nền thẻ `#ffffff` |
| `--muted` / `--muted-foreground` | `bg-muted` `text-muted-foreground` | nền ô số liệu phụ / text phụ |
| `--border` | `border-border` | viền thẻ `#e2e8f0` |

**Quy tắc `*-strong`.** Nền `*-soft` rất nhạt, đặt chữ `*-` (màu gốc) lên trên
chỉ đạt tương phản 2.07–3.44:1 — dưới ngưỡng WCAG AA. Mọi pill nền nhạt phải
dùng foreground `*-strong` (≥ 4.8:1). Xem `src/components/ui-kit/tone.ts`.

**Quy tắc một màu nhấn.** Mỗi màn chỉ một màu hành động: indigo. Xanh / hổ phách
/ đỏ chỉ báo *trạng thái*, không trang trí.

## 2. Chữ

Hai họ chữ, nạp qua `next/font` ở `src/app/layout.tsx`, cả hai có subset
`vietnamese`:

- **Hanken Grotesk** → `--font-sans` (và `--font-heading`): mọi chữ đọc.
- **JetBrains Mono** → `--font-mono`: mọi **số liệu**.

| Vai trò | Class | Ghi chú |
|---|---|---|
| Eyebrow | `text-[11px] font-semibold uppercase tracking-wider text-muted-foreground` | nhãn nhỏ trên tiêu đề |
| Tiêu đề màn | `text-xl font-bold` | |
| Tiêu đề thẻ | `text-base font-semibold` | |
| Số liệu lớn | `text-3xl font-bold tabular` | |
| Body | `text-sm` | |
| Meta | `text-xs text-muted-foreground` | |
| **Số liệu** | luôn kèm class `tabular` | mã phòng, tiền, chỉ số công tơ |

`.tabular` = `font-family: var(--font-mono)` + `font-variant-numeric: tabular-nums`.
DESIGN.md gọi đây là "monospaced data anchors": cột tiền và cột chỉ số phải
thẳng hàng khi quét mắt từ trên xuống.

## 3. Nhịp & bo góc

- Padding trang: `px-4` (mobile) → `md:px-6`
- Khoảng cách giữa thẻ: `gap-2`/`gap-3`; giữa khối: `space-y-5`
- Padding trong thẻ: `p-4`
- Viền `border border-border` + **bóng rất nhẹ** (`--shadow-xs`/`--shadow-sm`):
  canvas `#f8fafc` và thẻ `#ffffff` gần trùng màu nên thiếu bóng thì thẻ dính nền.

Thang bo góc là **giá trị tuyệt đối**, không nhân từ `--radius` như preset
shadcn — công thức `calc(var(--radius) * N)` làm `rounded-2xl` thành **28.8px**
trong khi mockup dùng thẻ bo 16px:

| Utility | Giá trị | Dùng cho |
|---|---|---|
| `rounded-lg` | 12px | nút, input |
| `rounded-xl` | 12px | ô icon, nút nhỏ trên thẻ |
| `rounded-2xl` | 16px | thẻ |
| `rounded-3xl` | 24px | hero header |
| `rounded-full` | — | pill, thanh tiến độ |

## 4. Touch target

Tối thiểu **40px** cho mọi thứ bấm được (nút header, nút trên thẻ dùng `h-9`
nhưng nằm trong vùng bấm rộng hơn). Ô nhập số trong lưới chỉ số giữ `h-11`.
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
| `HeroHeader` | `components/hero-header.tsx` | thẻ tối màu `rounded-3xl` mang tên + địa chỉ tòa, slot nút 40×40 (`HeroAction`). Dùng ở 4 màn cấp 1: `/`, `/rooms`, `/meters`, `/settings` |
| `AppHeader` | `components/app-header.tsx` | header màn con: nút quay lại 40×40 + eyebrow + tiêu đề + slot hành động |
| `BottomNav` | `components/bottom-nav.tsx` | 4 tab: Trang chủ · Phòng · Chỉ số · Cài đặt |
| `RoomsBoard` | `components/rooms/rooms-board.tsx` | màn S-02: khối lấp đầy, 3 ô thống kê, banner HĐ sắp hết hạn, tìm kiếm, pill lọc, nhóm theo tầng |
| `RoomCard` | `components/rooms/room-card.tsx` | thẻ phòng: mã + trạng thái · khách + số người · giá thuê · công nợ · chỉ số · HĐ đến · CTA |
| `MeterPair` | `components/rooms/meter-pair.tsx` | cặp chỉ số điện/nước hai cột, `size="sm"` trên thẻ và `size="lg"` ở chi tiết phòng |
| `StatCard` | `components/ui-kit/stat-card.tsx` | nhãn + pill % + số lớn / mẫu số + thanh tiến độ + footer |
| `FeatureCard` | `components/ui-kit/feature-card.tsx` | ô icon màu + pill trạng thái + tiêu đề + phụ đề |
| `IconTile` | `components/ui-kit/icon-tile.tsx` | ô icon bo góc, 6 tone màu |
| `Pill` | `components/ui-kit/pill.tsx` | nhãn trạng thái bo tròn, 6 tone, foreground `*-strong` |
| `SectionHeader` | `components/ui-kit/section-header.tsx` | tiêu đề mục + badge đếm + link "Xem tất cả" |
| `AlertRow` | `components/ui-kit/alert-row.tsx` | dòng việc cần xử lý: icon + nội dung + nút hành động |
| `Money` | `components/ui-kit/money.tsx` | hiển thị tiền VND, `tabular`, âm thì đổi màu |
| `EmptyState` | `components/ui-kit/empty-state.tsx` | trạng thái rỗng: icon + câu dẫn + CTA |

### Ngoại lệ — `components/invoice/invoice-print.tsx`

File này **cố tình không dùng token Tailwind hay webfont**: nó được nhân bản vào
`<foreignObject>` của SVG để xuất PNG (`src/lib/png.ts`), mà stylesheet ngoài và
webfont không đi theo vào ảnh. Phải giữ inline style tuyệt đối + font hệ thống.
**Không "đồng bộ design system" cho file này.**

## 7. Lệch so với mockup trong `docs/ui`

Mockup là bản vẽ cho một sản phẩm rộng hơn Rentory. Những phần sau **không
implement**, kèm lý do:

| Trong mockup | Vì sao bỏ |
|---|---|
| Thẻ **Báo cáo & Lãi lỗ** | HANDOFF mục 1 — ngoài phạm vi |
| Tab **Hoá đơn** toàn tòa | HANDOFF mục 1 — ngoài phạm vi; bottom-nav giữ 4 tab |
| Trạng thái **Bảo trì** (badge, ô thống kê, segment thanh tiến độ, nút chuyển/bỏ bảo trì) | CR-01 đã xóa `room_status` khỏi schema; trạng thái suy từ hợp đồng, chỉ còn Đang thuê / Trống (BR-P04) |
| Luồng **sự cố / sửa chữa** | Chưa từng trong phạm vi; cần bảng work order mới |
| **Nhắc nợ** | HANDOFF mục 1 — ngoài phạm vi |
| **Chuông thông báo** + chấm đỏ | Không có hệ thống thông báo |
| `more_vert` menu tuỳ chọn phòng | Mockup không định nghĩa nội dung menu; vào chi tiết phòng là đủ |

Chỉ số mockup vẽ mà **dữ liệu không có**, nên không dựng:

| Chỉ số | Thiếu gì |
|---|---|
| `↑ +2.8%` biến động lấp đầy | Không lưu lịch sử lấp đầy theo tháng |
| `Chậm thanh toán 3 ngày` | Hóa đơn chỉ có `paid`/`due` (TT-06); không có ngày đến hạn |
| `Sẵn sàng cho thuê — Đã dọn dẹp vệ sinh` | Không có trường tình trạng vệ sinh |
| `2 giờ trước · Báo sự cố` | Không có luồng báo sự cố |
| Tên viết tắt `T.Đ. Khang` | App hiển thị tên đầy đủ người đại diện |

Định dạng tiền dùng **một** quy ước `formatVnd()` (`4.300.000đ`), không dùng
dạng rút gọn `4.3tr` / `4847k` như mockup.
