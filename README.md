# Rentory

Quản lý hóa đơn phòng trọ — một codebase, một deployment, nhiều tòa nhà (định tuyến theo subdomain).

Tòa nhà đầu tiên: **190 Nguyễn Trãi** → `190nguyentrai.ducpm.work`

Nguồn sự thật nghiệp vụ: [`HANDOFF-rentory.md`](./HANDOFF-rentory.md) mục 4.

---

## Stack

| Layer | Chọn |
|---|---|
| Framework | Next.js 15 App Router + TypeScript strict |
| UI | Tailwind CSS v4 + shadcn/ui + lucide-react |
| Data | Supabase (Postgres + Auth + RLS), `@supabase/supabase-js`, `@supabase/ssr` |
| Client state | TanStack Query v5 |
| Validation | Zod |
| Date | date-fns |
| Font | Space Grotesk (tiêu đề + số tiền), Manrope (body), subset `vietnamese` |
| Test | Vitest |

---

## Chạy local

```bash
npm install
cp .env.example .env.local   # rồi điền key thật
npm run dev
```

`.env.local` (không commit):

```
NEXT_PUBLIC_SUPABASE_URL=https://hmymrmnrtreblizpvwbe.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...        # server-only
DEFAULT_BUILDING_SLUG=190nguyentrai
```

Dùng cặp key mới `sb_publishable_` / `sb_secret_`, **không** dùng `anon` / `service_role`.
`SUPABASE_SECRET_KEY` chỉ được import từ server — không bao giờ đặt sau tiền tố `NEXT_PUBLIC_`.

Trên `localhost` và `*.vercel.app`, host không có subdomain hợp lệ nên middleware rơi về
`DEFAULT_BUILDING_SLUG`. Thiếu biến này thì local dev và Preview sẽ chết.

## Lệnh

```bash
npm run dev        # dev server
npm run build      # production build
npm run test       # vitest (bắt buộc xanh trước khi merge)
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
```

---

## Database

**Mọi thay đổi schema chỉ qua migration file** trong `supabase/migrations/`, commit vào Git.
Không sửa tay trên Dashboard.

```bash
export SUPABASE_ACCESS_TOKEN=...            # Personal Access Token
npx supabase link --project-ref hmymrmnrtreblizpvwbe
npx supabase db push                        # đẩy migration mới
npx supabase gen types typescript --project-id hmymrmnrtreblizpvwbe --schema public > src/types/database.ts
```

RLS: 1 admin / tòa nhà. Mọi bảng dẫn về `buildings.admin_id = auth.uid()` qua các
hàm `is_my_building` / `building_of_room` / `building_of_invoice` / `building_of_receipt`.

---

## Cấu trúc

```
src/
  app/                    # App Router
    login/                # S-01 đăng nhập
    auth/signout/         # route đăng xuất
  components/
    ui/                   # shadcn/ui
  lib/
    billing/              # ★ toàn bộ nghiệp vụ tính toán — pure function, có test
      code.ts             #   4.4 mã hóa đơn
      periods.ts          #   4.1 kỳ thu trước / thu sau
      defaults.ts         #   HD-01/02/03 số liệu mặc định 3 loại hóa đơn
      recognized.ts       #   TT-03/TT-06 số ghi nhận & trạng thái thu
      marks.ts            #   HD-04/HD-08a mốc công tơ + log
    supabase/             # client (browser) · server (RLS) · admin (bypass RLS)
    tenant.ts             # 2.5 host → slug tòa nhà
    env.ts                # validate env bằng Zod
  middleware.ts           # subdomain + refresh session + chặn route
supabase/migrations/      # nguồn sự thật của schema
```

**Nguyên tắc:** tiền là số nguyên VND (`int`), không float. Kỳ là chuỗi `YYYY-MM`.
Toàn bộ tính toán nằm trong `lib/billing/` dưới dạng pure function có unit test; UI chỉ gọi.
Mỗi function comment mã quy tắc tương ứng (`// HD-02`).

---

## Deploy

- `main` → Production (Vercel project `rentory`, account `ducpm103`)
- PR → Preview

Domain `190nguyentrai.ducpm.work` cần bản ghi DNS tại nơi quản lý `ducpm.work`:

```
CNAME   190nguyentrai   cname.vercel-dns.com
```

Chỉ **thêm** bản ghi, không sửa/xóa bản ghi có sẵn của domain gốc. Không dùng wildcard.
