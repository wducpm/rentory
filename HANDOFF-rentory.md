# HANDOFF — Rentory

**Cho:** Claude Code · **Ngày:** 03/09/2026 · **Loại:** dự án mới, greenfield
**Tòa nhà đầu tiên:** 190 Nguyễn Trãi → `190nguyentrai.ducpm.work`
**Repo:** `wducpm/rentory` · **Supabase:** `hmymrmnrtreblizpvwbe` · **Vercel account:** `ducpm103`

Tài liệu này **tự chứa** — toàn bộ nghiệp vụ cần thiết nằm ở mục 4. Không cần đọc tài liệu nào khác.

---

## 1. Phạm vi

### Trong phạm vi
Nghiệp vụ **hóa đơn phòng** đã chốt: mốc công tơ, 3 loại hóa đơn, mã hóa đơn, thu tiền trên hóa đơn, lịch sử phòng. Kèm các thực thể tối thiểu để hóa đơn chạy được: tòa nhà, phòng, hợp đồng thuê, đơn giá.

### Ngoài phạm vi — KHÔNG implement
Sổ chi · báo cáo doanh thu / lời lỗ · màn "Hóa đơn" toàn tòa (danh sách + lọc) · gửi hóa đơn cho khách · UI đa tòa nhà · audit log chi tiết · di trú dữ liệu từ app cũ.

Nếu gặp yêu cầu mơ hồ ngoài phạm vi → **hỏi lại, không tự bịa nghiệp vụ**.

---

## 2. Hạ tầng — đã tạo sẵn

Ba project **đã tồn tại**. KHÔNG tạo mới — kết nối vào đúng những cái này:

| Nơi | Định danh | Link |
|---|---|---|
| GitHub | `wducpm/rentory` | https://github.com/wducpm/rentory |
| Supabase | project ref `hmymrmnrtreblizpvwbe` | https://supabase.com/dashboard/project/hmymrmnrtreblizpvwbe |
| Vercel | account `ducpm103` | https://vercel.com/ducpm103 |

Token người dùng cung cấp khi bắt đầu:

| Nơi | Token | Quyền cần |
|---|---|---|
| GitHub | dùng `gh auth login` — không cần token | — |
| Supabase | Personal Access Token → `SUPABASE_ACCESS_TOKEN` | truy cập project `hmymrmnrtreblizpvwbe` |
| Vercel | API token → `VERCEL_TOKEN` | tạo/sửa project, set env, add domain trong account `ducpm103` |

🔐 **Token nằm trong `.env.local` tại thư mục dự án** (đã gitignore) — đọc từ đó, KHÔNG yêu cầu người dùng dán token vào khung chat, KHÔNG ghi token vào bất kỳ file nào được commit, KHÔNG in token ra log hay output.

⚠️ **Trước khi ghi bất cứ thứ gì:** kiểm tra repo và Supabase project còn trống hay không. Nếu đã có nội dung / đã có bảng → **dừng lại và hỏi**, không ghi đè.

### 2.1 GitHub — `wducpm/rentory`
Push scaffold Next.js lên nhánh `main`. Commit đầu tiên gồm scaffold + `.gitignore` + `README.md`. Conventional commits từ đó trở đi.

### 2.2 Supabase — `hmymrmnrtreblizpvwbe`
- URL: `https://hmymrmnrtreblizpvwbe.supabase.co`
- `supabase init` → `supabase link --project-ref hmymrmnrtreblizpvwbe`
- Lấy **publishable key** và **secret key** tại Settings → API Keys (tab *Publishable and secret API keys*)
- **Mọi thay đổi schema chỉ qua migration file** trong `supabase/migrations/`, không sửa tay trên Dashboard

### 2.3 Vercel — account `ducpm103`
Tạo project tên `rentory` trong account này (nếu đã có thì dùng lại), link vào repo `wducpm/rentory`. Framework preset: Next.js. `main` → Production, PR → Preview.

Env vars (set cho cả Production · Preview · Development):
```
NEXT_PUBLIC_SUPABASE_URL=https://hmymrmnrtreblizpvwbe.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...   # thay cho anon key
SUPABASE_SECRET_KEY=sb_secret_...                          # server-only, thay cho service_role
DEFAULT_BUILDING_SLUG=190nguyentrai                        # fallback khi host không có subdomain
```

⚠️ Dùng **key mới** (`sb_publishable_` / `sb_secret_`), không dùng `anon` / `service_role` — Supabase deprecate cặp cũ vào cuối 2026. Khởi tạo client vẫn y hệt, chỉ khác giá trị truyền vào. Tuyệt đối không đặt secret key sau tiền tố `NEXT_PUBLIC_`.

### 2.4 Domain
Thêm domain `190nguyentrai.ducpm.work` vào Vercel project.

⚠️ **Bước thủ công của người dùng** (agent không làm được): thêm bản ghi DNS tại nơi quản lý `ducpm.work`:
```
CNAME   190nguyentrai   cname.vercel-dns.com
```
Chỉ **thêm** bản ghi, tuyệt đối không sửa/xóa bản ghi có sẵn của domain gốc. Không dùng wildcard `*.ducpm.work`.

### 2.5 Định tuyến theo subdomain
Một codebase, một deployment, nhiều tòa. Middleware Next.js đọc `host` → tách subdomain → tra `buildings.slug` → gắn `building_id` vào context request.
Khi host không có subdomain hợp lệ (localhost, `*.vercel.app`) → dùng `DEFAULT_BUILDING_SLUG`. Thiếu fallback này thì local dev và Preview sẽ chết.

---

## 3. Stack

| Layer | Chọn |
|---|---|
| Framework | Next.js 15 App Router + TypeScript strict |
| UI | Tailwind CSS + shadcn/ui + lucide-react |
| Data | Supabase (Postgres + Auth + RLS), `@supabase/supabase-js`, `@supabase/ssr` |
| Client state | TanStack Query v5 |
| Validation | Zod |
| Date | date-fns |
| Font | next/font — Space Grotesk (tiêu đề + số tiền), Manrope (body), subset `vietnamese` |
| Test | Vitest (bắt buộc cho `lib/billing`) |

Không dùng: ORM, Redux/Zustand, thư viện biểu đồ. Không tự thêm dependency ngoài danh sách khi chưa hỏi.

**Nguyên tắc kỹ thuật:** tiền là **số nguyên VND** (`int`), không float. Kỳ là chuỗi `YYYY-MM`. Toàn bộ tính toán nằm trong `lib/billing/` dưới dạng pure function có unit test; UI chỉ gọi. Mỗi function comment mã quy tắc tương ứng (`// HD-02`).

---

## 4. NGHIỆP VỤ (nguồn sự thật)

### 4.1 Chu kỳ thu — thu trước / thu sau

Một hóa đơn chứa **hai phần thuộc hai kỳ khác nhau**:

| Phần | Thuộc kỳ | Cách thu |
|---|---|---|
| Điện · Nước | kỳ vừa kết thúc | thu sau, theo thực dùng |
| Tiền phòng · Internet · Dịch vụ chung | kỳ tiếp theo | thu trước |

Ví dụ hóa đơn chốt 31/8: điện nước tháng 8 + dịch vụ tháng 9.
Hệ quả: khách vào giữa tháng **không bị thu trùng** dịch vụ → không cần prorate, không cần cảnh báo trùng.

### 4.2 Nguyên tắc nền

| # | Nguyên tắc |
|---|---|
| **N1** | **Mốc hiện tại** (chỉ số điện/nước đang có hiệu lực) là giá trị lưu trên **phòng**. Mọi hóa đơn tính từ mốc này. |
| **N2** | Mốc bị **ghi đè** bởi 4 nguồn: HĐ nhận phòng · HĐ định kỳ · HĐ trả phòng · **sửa thủ công** tại menu nhập chỉ số. Lần ghi đè mới nhất luôn thắng. |
| **N3** | Mỗi lần ghi đè được **ghi log**. |
| **N4** | Chuỗi công tơ chạy liên tục **theo phòng**; hóa đơn thuộc về **hợp đồng**. Đổi khách không làm đứt chuỗi. |
| **N5** | Hóa đơn **snapshot** chỉ số và số tiền tại thời điểm lập. Hiển thị đúng số đã lưu, **không tính lại**. |
| **N6** | **Admin quyết mọi con số.** Hệ thống tính sẵn mặc định, không ép, không chặn. |
| **N7** | **Chỉ số và số tiền độc lập nhau.** Hóa đơn có thể có số tiền không khớp tiêu thụ tính từ chỉ số — hợp lệ, không phải lỗi. Không được tự động ép khớp. |

### 4.3 Ba loại hóa đơn — cùng một cấu trúc

| | Nhận phòng | Định kỳ | Trả phòng |
|---|---|---|---|
| Thời điểm | ngày khách nhận | ngày cuối kỳ | ngày khách trả |
| Chỉ số đầu | = chỉ số cuối | mốc hiện tại | mốc hiện tại |
| Chỉ số cuối | số chốt với khách | số chốt kỳ | số chốt với khách |
| Điện / Nước | **= 0** | tiêu thụ kỳ vừa qua | tiêu thụ từ mốc đến ngày trả |
| Dịch vụ | phần còn lại **kỳ hiện tại** | **kỳ tiếp theo** | mặc định **0** |
| Dòng cọc | Cọc (+) | không có | Hoàn cọc (−) |
| Sau khi lưu | ghi đè mốc | ghi đè mốc | ghi đè mốc |

### 4.4 Mã hóa đơn

Cấu trúc: `HĐ-P{phòng}-ĐN/T{tháng}-DV/T{tháng}` — **đoạn nào không có thì bỏ hẳn**, nhờ vậy mã tự cho biết loại.

| Loại | Cấu trúc | Ví dụ (mã lưu) |
|---|---|---|
| Nhận phòng | `HĐ-P{x}-DV/T{m}.{yy}` | `HĐ-P201-DV/T8.25` |
| Định kỳ | `HĐ-P{x}-ĐN/T{m}.{yy}-DV/T{m}.{yy}` | `HĐ-P201-ĐN/T8.25-DV/T9.25` |
| Trả phòng | `HĐ-P{x}-ĐN/T{m}.{yy}` | `HĐ-P201-ĐN/T9.25` |

- **Mã lưu** trong DB: luôn có 2 chữ số năm ở mọi đoạn.
- **Mã hiển thị**: bỏ năm cho gọn; **trừ khi hai kỳ khác năm** thì hiện đủ → `HĐ-P201-ĐN/T12.25-DV/T1.26`.
- **Trùng mã**: nếu phòng có hai hóa đơn cùng cấu trúc trong cùng kỳ, thêm hậu tố thứ tự → `HĐ-P201-ĐN/T9.25-2`.

### 4.5 Quy tắc chi tiết

| ID | Quy tắc |
|---|---|
| **HD-01** | **HĐ nhận phòng:** điện = nước = 0. Chỉ số đầu = chỉ số cuối = số chốt. Các khoản dịch vụ của kỳ hiện tại list đầy đủ dù khách chỉ ở vài ngày; admin sửa hoặc đưa về 0. Có dòng **Cọc**. |
| **HD-02** | **HĐ định kỳ:** chỉ số đầu = mốc hiện tại, chỉ số cuối = số chốt kỳ. Điện/nước thuộc kỳ vừa kết thúc; dịch vụ thuộc kỳ tiếp theo. Không có dòng cọc. |
| **HD-03** | **HĐ trả phòng:** chỉ số đầu = mốc hiện tại, chỉ số cuối = số chốt. Dòng dịch vụ mặc định **0** (đã thu trước ở kỳ liền trước), admin quyết có hoàn lại không. Dòng **Hoàn cọc** do admin quyết, không bắt khớp cọc gốc. Vẫn hiển thị đầy đủ mọi khoản. |
| **HD-04** | Lưu bất kỳ hóa đơn nào → **mốc hiện tại = chỉ số cuối của hóa đơn đó**. |
| **HD-05** | Tiêu thụ giữa hai lần ghi đè mà không thuộc hóa đơn nào (phòng trống, chủ dùng) → chi phí tòa nhà, **không hiển thị trên bất kỳ hóa đơn nào**. |
| **HD-06** | Mọi số tiền sửa được, cả trước và sau khi lưu. Hóa đơn thể hiện đúng con số admin nhập. |
| **HD-07** | Khách nhận phòng giữa kỳ → đến ngày cuối kỳ vẫn sinh HĐ định kỳ bình thường. Không phải trường hợp đặc biệt. |
| **HD-08** | **Không lan truyền (no cascade).** Sửa chỉ số hoặc số tiền của một hóa đơn chỉ ảnh hưởng **chính hóa đơn đó**, đồng thời ghi đè mốc. Hóa đơn khác giữ nguyên snapshot. Thiếu/thừa xử lý bằng thu bù ở kỳ sau. |
| **HD-09** | Chặn lưu khi chỉ số cuối < chỉ số đầu, **trừ** trường hợp thay công tơ (HD-11). |
| **HD-10** | Một phòng có thể có nhiều hóa đơn trong cùng kỳ, thuộc nhiều hợp đồng khác nhau. Mỗi hóa đơn **thu độc lập**, lịch sử thu tách riêng theo từng người. |
| **HD-11** | **Thay công tơ giữa kỳ:** admin sửa mốc thủ công tại menu nhập chỉ số (VD đưa về 0), ghi vào log. HĐ cuối kỳ mặc định tính từ mốc đã sửa đến số chốt cuối kỳ. |
| **HD-12** | **Thu bù đoạn công tơ cũ:** hệ thống **không lưu** chỉ số cuối của công tơ cũ. Admin tự cộng khoản thiếu vào tiền điện/nước của hóa đơn kỳ sau. Khi đó tiền cao hơn mức tính từ chỉ số — **chỉ số vẫn giữ nguyên**, không sửa cho khớp tiền (N7). |
| **HD-13** | Hóa đơn mang mã theo 4.4 và ghi rõ hai kỳ trên mặt hóa đơn: "Điện nước tháng X · Dịch vụ tháng Y". |
| **HD-14** | **Mọi hóa đơn, ở bất kỳ đâu, đều có CTA "Thu tiền".** Hóa đơn cũ chưa thu hoặc thu thiếu vẫn tra cứu, xem lại, chỉnh sửa và thu tiếp được từ lịch sử hoạt động của phòng. |
| **HD-15** | Cọc và hoàn cọc thể hiện đầy đủ trên hóa đơn để biết đã thu / đã trả, nhưng **không tính vào doanh thu** — đánh cờ `is_deposit` để phần báo cáo sau này loại trừ. |

**HD-08a — quy tắc dẫn xuất, cần cho implement:** ghi đè mốc khi sửa hóa đơn **chỉ áp dụng nếu hóa đơn đó là hóa đơn mới nhất của phòng** (tức đang sở hữu mốc). Sửa một hóa đơn cũ hơn thì chỉ đổi chính nó, không đụng mốc — nếu không mốc sẽ nhảy lùi. *(Suy ra từ HD-08 + N2, chưa được xác nhận trực tiếp — nếu thấy sai, hỏi lại.)*

### 4.6 Quy tắc thu tiền

| ID | Quy tắc |
|---|---|
| **TT-01** | Phiếu thu = ngày thu (admin nhập, mặc định hôm nay) + các khoản được tick, **mỗi khoản mang số tiền sửa được** (mặc định = số trên hóa đơn). |
| **TT-02** | Một hóa đơn thu nhiều lần. Một khoản có thể có nhiều bản ghi thu, log riêng từng lần theo ngày. |
| **TT-03** | Số ghi nhận của một khoản = **bản ghi mới nhất** theo khóa `(invoice_id, fee)`. **Không cộng dồn.** |
| **TT-04** | **Không có hủy phiếu thu.** Ghi sai → sửa số tiền của bản ghi. |
| **TT-05** | Khoản đã thu vẫn tick lại được (tạo bản ghi mới) — không disable, không chặn. |
| **TT-06** | Trạng thái hóa đơn **suy ra**, không set tay: mọi khoản đều có bản ghi thu → Đã thu; còn sót → Chưa thu (kèm danh sách khoản thiếu). |

### 4.7 Ba kịch bản kiểm chứng

```
■ Khách mới nhận phòng giữa kỳ
20/8  nhận phòng, chốt 4184/106
      → HĐ-P201-DV/T8.25 : điện 0, nước 0, chỉ số 4184/106,
                            dịch vụ T8 (admin quyết), cọc +4.400.000
      → mốc ← 4184/106
31/8  chốt kỳ, số 4300/112
      → HĐ-P201-ĐN/T8.25-DV/T9.25 : điện 4184→4300 =116 số,
                            nước 106→112 =6 khối, dịch vụ T9 đầy đủ
      → mốc ← 4300/112

■ Thay công tơ giữa kỳ, thu bù kỳ sau
mốc đầu T8: điện 100
15/8  thay công tơ → admin sửa mốc thủ công về 0 (ghi log)
      → đoạn 1/8→15/8 hệ thống không lưu, không tự tính
31/8  chốt kỳ, số 60
      → HĐ định kỳ: chỉ số 0→60 = 60 số (mặc định)
      → admin cộng thêm phần công tơ cũ vào tiền điện
      → tiền cao hơn 60 số, CHỈ SỐ VẪN GHI 0→60
      → mốc ← 60

■ Khách trả phòng
mốc: 4000/100 (đã thu dịch vụ T9 ở HĐ 31/8)
20/9  trả phòng, chốt 4180/106
      → HĐ-P201-ĐN/T9.25 : điện 4000→4180 =180 số, nước 100→106 =6 khối
                            dịch vụ mặc định 0, hoàn cọc admin quyết
      → mốc ← 4180/106
```

---

## 5. Schema (migration `0001_init.sql`)

```sql
create type room_status  as enum ('occupied','vacant','maintenance');
create type invoice_type as enum ('move_in','periodic','move_out');
create type fee_type     as enum ('rent','elec','water','internet','common','deposit','deposit_refund');
create type mark_source  as enum ('invoice_move_in','invoice_periodic','invoice_move_out','manual');

create table buildings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,                       -- '190nguyentrai' → subdomain
  name text not null,                              -- '190 Nguyễn Trãi'
  address text,
  admin_id uuid not null references auth.users(id),-- 1 admin / tòa
  created_at timestamptz not null default now()
);

create table building_settings (
  building_id uuid primary key references buildings(id) on delete cascade,
  elec_price   int not null default 3800,          -- đ / số
  water_price  int not null default 30000,         -- đ / khối
  internet_fee int not null default 100000,        -- đ / phòng / kỳ
  common_fee   int not null default 150000,        -- đ / người / kỳ
  updated_at timestamptz not null default now()
);

create table rooms (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references buildings(id) on delete cascade,
  code text not null,                              -- '201'
  floor int,
  base_rent int not null default 0,
  status room_status not null default 'vacant',
  current_elec  numeric not null default 0,        -- N1: mốc hiện tại
  current_water numeric not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  unique (building_id, code)
);

create table contracts (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  tenant_name text not null,
  phone text,
  occupants int not null default 1 check (occupants >= 1),
  start_date date not null,
  end_date date,
  deposit int not null,                            -- bắt buộc khai báo khi nhận phòng
  rent int not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index one_active_contract_per_room on contracts (room_id) where active;

create table invoices (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references buildings(id) on delete cascade,
  room_id     uuid not null references rooms(id)     on delete cascade,
  contract_id uuid not null references contracts(id) on delete cascade,
  code text not null,                              -- mã lưu, đủ năm (4.4)
  type invoice_type not null,
  issue_date date not null,                        -- ngày lập / ngày chốt số
  utility_period char(7),                          -- 'YYYY-MM', NULL với move_in
  service_period char(7),                          -- 'YYYY-MM', NULL với move_out
  elec_start numeric not null, elec_end  numeric not null,   -- N5 snapshot
  water_start numeric not null, water_end numeric not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (building_id, code)
);
create index invoices_room_date on invoices (room_id, issue_date desc, created_at desc);

create table invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  fee fee_type not null,
  amount int not null,                             -- N7: độc lập với chỉ số
  is_deposit boolean not null default false,       -- HD-15
  unique (invoice_id, fee)
);

create table meter_mark_logs (                     -- N3
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  effective_date date not null,
  elec numeric not null, water numeric not null,           -- giá trị sau ghi đè
  prev_elec numeric, prev_water numeric,                   -- giá trị trước
  source mark_source not null,
  invoice_id uuid references invoices(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create table receipts (                            -- TT-01
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  receipt_date date not null,
  edited boolean not null default false,
  created_at timestamptz not null default now()
);

create table receipt_items (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references receipts(id) on delete cascade,
  fee fee_type not null,
  amount int not null,
  unique (receipt_id, fee)
);

-- TT-03: số ghi nhận = bản ghi mới nhất, KHÔNG cộng dồn
create view recognized_items as
select distinct on (r.invoice_id, ri.fee)
  r.invoice_id, ri.fee, ri.amount, r.receipt_date, r.id as receipt_id
from receipts r
join receipt_items ri on ri.receipt_id = r.id
order by r.invoice_id, ri.fee, r.receipt_date desc, r.created_at desc;

-- RLS
create function is_my_building(b uuid) returns boolean
language sql stable security definer as
$$ select exists (select 1 from buildings where id = b and admin_id = auth.uid()); $$;

alter table buildings enable row level security;
create policy own_building on buildings for all using (admin_id = auth.uid());
-- Bật RLS + policy cho MỌI bảng còn lại theo pattern:
--   có building_id  → using (is_my_building(building_id))
--   qua room        → using (is_my_building((select building_id from rooms where rooms.id = room_id)))
--   qua invoice     → dẫn tiếp qua invoices.building_id
```

**Seed:** tạo building `190nguyentrai` / "190 Nguyễn Trãi", `building_settings` với 4 giá mặc định ở trên, tài khoản admin. Danh sách phòng do người dùng cung cấp — hỏi trước khi seed, đừng bịa.

---

## 6. Hợp đồng của `lib/billing`

```ts
// defaults.ts
moveInDefaults(contract, settings, marks)   // HD-01: elec=water=0, +deposit
periodicDefaults(contract, settings, room, endReadings)  // HD-02
moveOutDefaults(contract, settings, room, endReadings)   // HD-03: dịch vụ=0, +deposit_refund
consumption(start, end): number             // max(0, end-start)

// code.ts
buildInvoiceCode(roomCode, type, utilityPeriod, servicePeriod, seq?): string  // 4.4, mã lưu
displayInvoiceCode(storedCode): string      // 4.4, bỏ năm trừ khi khác năm

// periods.ts
derivePeriods(type, issueDate)              // utility = tháng issueDate; service = tháng kế tiếp
                                            // (mặc định, admin sửa được)
// recognized.ts
recognizedAmount(receipts, fee): int | null // TT-03 bản mới nhất
paidTotal(invoice, receipts): int
invoiceStatus(invoice, receipts): 'paid'|'due'  // TT-06

// marks.ts
applyMark(room, elec, water, source, invoiceId?)  // HD-04 + N3 ghi log
isLatestInvoice(invoice, room): boolean           // HD-08a
```

**Unit test bắt buộc (Vitest):**
- Sinh mã đúng cho cả 3 loại, có năm, có hậu tố trùng, và `displayInvoiceCode` bỏ/giữ năm đúng.
- HD-01: HĐ nhận phòng ra điện = nước = 0 và `elec_start === elec_end`.
- HD-02: kỳ điện nước và kỳ dịch vụ lệch nhau đúng 1 tháng.
- HD-04: lưu hóa đơn → `room.current_elec` = `invoice.elec_end`, có log.
- HD-08a: sửa hóa đơn cũ **không** đổi mốc; sửa hóa đơn mới nhất **có** đổi.
- TT-03: 2 bản ghi cùng khoản → lấy bản mới nhất, không cộng dồn.
- N7: sửa tiền điện lệch khỏi chỉ số → lưu được, chỉ số không đổi.

---

## 7. Màn hình

| ID | Màn | Nội dung |
|---|---|---|
| **S-01** | Đăng nhập | Supabase Auth email + password, 1 admin |
| **S-02** | Danh sách phòng | Trạng thái phòng, khách hiện tại, hóa đơn chưa thu, mốc hiện tại |
| **S-03** | Chi tiết phòng | Thông tin hợp đồng · danh sách hóa đơn của phòng · CTA Nhận/Trả phòng · Ghi chỉ số |
| **S-04** | Chi tiết hóa đơn | Mã hiển thị + hai kỳ (HD-13) · chỉ số đầu–cuối · các dòng tiền (sửa được) · tổng · trạng thái thu · **CTA Thu tiền** (HD-14) |
| **S-05** | Sheet Thu tiền | Ngày thu · tick khoản · **ô số tiền mỗi khoản sửa được** (TT-01) |
| **S-06** | Nhập chỉ số / Chốt kỳ | Lưới toàn bộ phòng đang thuê: mốc hiện tại (chỉ đọc) + ô nhập số chốt → tính real-time → tạo HĐ định kỳ hàng loạt. Kèm chức năng **sửa mốc thủ công** (HD-11) có ghi chú lý do |
| **S-07** | Nhận phòng | Tạo hợp đồng (cọc bắt buộc) + số chốt bàn giao → sinh HĐ nhận phòng |
| **S-08** | Trả phòng | Số chốt + bill tất toán sửa từng dòng + hoàn cọc → đóng HĐ, phòng về Trống |
| **S-09** | Lịch sử phòng | Timeline gộp: hóa đơn · phiếu thu · lần ghi đè mốc. Mở lại hóa đơn cũ để xem/sửa/thu tiếp (HD-14) |
| **S-10** | Cài đặt tòa | 4 đơn giá · quản lý phòng (thêm/sửa/archive) |

**UI:** mobile-first, breakpoint `md:768` / `lg:1024` (mobile bottom-nav ↔ desktop sidebar; bottom-sheet ↔ modal giữa màn). Touch target ≥ 44px, focus-visible ring, không dùng emoji làm icon. Toàn bộ text UI tiếng Việt; code và identifier tiếng Anh.

---

## 8. Milestones

Mỗi milestone = 1 nhánh + 1 PR. DoD: quy tắc liên quan chạy đúng + unit test xanh + `tsc --noEmit` + `next build` sạch.

| M | Nội dung |
|---|---|
| **M0** | Kết nối 3 project đã có (mục 2); scaffold Next.js + Tailwind + shadcn + fonts; env vars; domain; báo người dùng thêm bản ghi CNAME |
| **M1** | Migration `0001` + RLS + seed building/settings/admin; middleware subdomain + fallback; Auth + S-01 |
| **M2** | `lib/billing` đầy đủ + toàn bộ unit test ở mục 6 (làm **trước** UI) |
| **M3** | S-02, S-03, S-10 — phòng, hợp đồng, đơn giá |
| **M4** | S-06 nhập chỉ số + chốt kỳ → HĐ định kỳ; sửa mốc thủ công (HD-11) |
| **M5** | S-07 nhận phòng, S-08 trả phòng |
| **M6** | S-04 chi tiết hóa đơn, S-05 thu tiền, S-09 lịch sử phòng |
| **M7** | Polish: a11y, empty/loading state, README vận hành; deploy Production và kiểm tra trên domain thật |

---

## 9. Quy ước cho agent

- **Nguồn sự thật là mục 4.** Mâu thuẫn ở đâu → mục 4 thắng. Mơ hồ → hỏi, không tự bịa.
- **Không implement mục 1 "Ngoài phạm vi".**
- Comment mã quy tắc tại nơi implement (`// HD-04: ghi đè mốc sau khi lưu`).
- Schema chỉ đổi qua migration file commit vào Git, không sửa tay Dashboard.
- `SUPABASE_SECRET_KEY` chỉ dùng server-side. Không commit token hay key vào repo dưới bất kỳ hình thức nào.
- Conventional commits: `feat: S-05 thu tiền (TT-01)`. Nhánh `m5-move-in-out`.
- Sau mỗi milestone: chạy `tsc`, `next build`, unit test; báo cáo quy tắc nào đã phủ, còn thiếu gì.
