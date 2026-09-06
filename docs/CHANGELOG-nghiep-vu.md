# CHANGELOG NGHIỆP VỤ — bản giao cho dev

**Ngày:** 03/09/2026 · **Dự án:** Rentory
**Mục đích:** liệt kê toàn bộ thay đổi nghiệp vụ đã chốt, kèm tác động cụ thể lên schema, logic và màn hình.

**Cách dùng tài liệu này:**
- **Chưa bắt đầu code** → không cần đọc chi tiết, chỉ đọc bản mới nhất của từng tài liệu ở mục 6. Tài liệu này chỉ để tra ngược lý do khi thắc mắc "sao lại thiết kế thế này".
- **Đã bắt đầu code theo bản cũ** → đây là delta bắt buộc phải áp. Xem mục 3 (schema) và mục 4 (logic) trước.

---

## 1. Tổng quan

| Nhóm | Số thay đổi | Ảnh hưởng schema |
|---|---|---|
| Trạng thái phòng | 1 | Có — xóa enum + cột |
| Người thuê | 2 | Có — thêm bảng mới, xóa 3 cột |
| Giá thuê | 1 | Có — xóa cột |
| Ràng buộc nghiệp vụ | 3 | Không |

**7 thay đổi**, trong đó **4 thay đổi schema**. Không có thay đổi nào ảnh hưởng tới nghiệp vụ hóa đơn cốt lõi (N1–N7, HD-01→15 giữ nguyên).

---

## 2. Danh sách thay đổi

### CR-01 · Bỏ trạng thái "Bảo trì"

| | |
|---|---|
| **Trước** | Phòng có 3 trạng thái: Đang thuê · Trống · Bảo trì. Lưu ở cột `rooms.status` kiểu enum. |
| **Sau** | Chỉ còn 2 trạng thái: **Đang thuê · Trống**. Không lưu thành cột — **suy ra từ hợp đồng**: có hợp đồng `active` → Đang thuê; không có → Trống. |
| **Lý do** | Với 2 trạng thái tương ứng 1-1 với "có/không có hợp đồng hiệu lực", lưu thành cột riêng chỉ tạo cơ hội lệch dữ liệu giữa `rooms.status` và `contracts.active`. |
| **File** | `srs-quan-ly-phong` v1.2 (BR-P04) · `srs-setting-toa-nha` v1.2 (GĐ-02) · `srs-chi-so-va-lap-hoa-don` v1.1 (BR-M02) · `HANDOFF` |
| **Dev cần làm** | Xóa `create type room_status`, xóa cột `rooms.status`. Mọi chỗ đọc trạng thái phòng chuyển sang truy vấn hợp đồng active. Xóa UI chuyển trạng thái bảo trì. |

### CR-02 · Lưu danh sách đầy đủ người ở

| | |
|---|---|
| **Trước** | `contracts` lưu `tenant_name` (một tên) + `phone` + `occupants` (số lượng). |
| **Sau** | Bảng mới **`contract_occupants`**: mỗi người một dòng với `full_name`, `phone`, `is_primary`. Số người ở = **đếm số dòng**, không lưu cột riêng. |
| **Lý do** | Yêu cầu nghiệp vụ: admin nhập số người trước, hệ thống sinh đúng số dòng nhập tên + SĐT từng người. |
| **File** | `srs-quan-ly-phong` v1.2 (BR-P13, BR-P14, BR-P15, BR-P16, FR-205) · `srs-chi-so-va-lap-hoa-don` v1.1 (§7, §8) · `HANDOFF` (§4, §5, §6, §7) |
| **Dev cần làm** | Xem mục 3 và 4. Chú ý 3 chỗ dùng gián tiếp: công thức DV chung, tên hiển thị trên hóa đơn, tên hiển thị ở danh sách phòng. |

### CR-03 · Ràng buộc trường thông tin người ở

| | |
|---|---|
| **Nội dung** | Họ tên **bắt buộc** với mọi người ở. SĐT **bắt buộc với người đại diện**, **tùy chọn** với người còn lại. |
| **Lý do** | Người đại diện là đầu mối liên lạc khi thu tiền và xử lý sự cố nên phải có số. Người ở cùng chỉ cần tên để tính phí và biết ai đang ở. |
| **File** | `srs-quan-ly-phong` v1.2 (BR-P17, AC-21.8, AC-21.9) |
| **Dev cần làm** | Validate ở tầng ứng dụng. Cột `phone` để nullable ở DB (vì chỉ bắt buộc có điều kiện). |

### CR-04 · Không cho đổi tên phòng đã có hóa đơn

| | |
|---|---|
| **Trước** | Đổi tên phòng tự do; hóa đơn cũ hiển thị theo tên mới. |
| **Sau** | Phòng **đã phát sinh hóa đơn không được đổi tên**. Phòng chưa có hóa đơn nào thì đổi tự do. |
| **Lý do** | Mã hóa đơn snapshot số phòng tại thời điểm lập (`HĐ-P201-ĐN/T8.26`). Đổi tên phòng thành P205 sẽ làm mã hóa đơn cũ lệch với tên phòng thực tế, khách tra cứu thấy sai. |
| **File** | `srs-quan-ly-phong` v1.2 (BR-P12) · `srs-setting-toa-nha` v1.2 (BR-S10, AC-05.3, AC-05.4) |
| **Dev cần làm** | Trước khi cho sửa `rooms.code`, kiểm tra tồn tại hóa đơn của phòng đó. Có → chặn kèm thông báo lý do. |

### CR-05 · Bỏ cột giá thuê trên phòng

| | |
|---|---|
| **Trước** | `rooms.base_rent` là giá cơ bản, dùng điền sẵn khi tạo hợp đồng. Sửa được ở màn Cài đặt tòa nhà. |
| **Sau** | **Xóa cột `rooms.base_rent`**. Giá thuê chỉ tồn tại ở `contracts.rent`. Ô giá thuê khi nhận phòng điền sẵn theo **giá của hợp đồng gần nhất** của phòng đó. Hợp đồng **đầu tiên** của phòng: ô để trống, admin nhập tay. Màn Cài đặt hiển thị giá thuê ở dạng **chỉ đọc**. |
| **Lý do** | Giá thuê thuộc về hợp đồng, không thuộc về phòng — hai khách khác nhau ở cùng phòng có thể có giá khác nhau. Giữ hai nguồn giá sẽ dẫn tới lệch. |
| **File** | `srs-quan-ly-phong` v1.2 (BR-P06, BR-P18, FR-209) · `srs-setting-toa-nha` v1.2 (BR-S05, FR-006) · `HANDOFF` |
| **Dev cần làm** | Xóa cột. Viết truy vấn lấy `rent` của hợp đồng gần nhất theo `room_id` (kể cả hợp đồng đã đóng) làm giá trị điền sẵn. |

### CR-06 · Ngưỡng cảnh báo hợp đồng sắp hết hạn: 30 → 15 ngày

| | |
|---|---|
| **Nội dung** | Cảnh báo gia hạn hiển thị khi hợp đồng còn **≤ 15 ngày** đến ngày hết hạn. |
| **File** | `srs-quan-ly-phong` v1.2 (FR-208, AC-25.1, AC-25.2) |
| **Dev cần làm** | Đổi hằng số. Nên để ở một chỗ (constant), không rải rác. |

### CR-07 · Không có chức năng khôi phục phòng đã archive

| | |
|---|---|
| **Nội dung** | Phòng archive rồi thì không khôi phục được ở v1. |
| **File** | `srs-quan-ly-phong` v1.2 (mục 11) |
| **Dev cần làm** | Không làm gì — xác nhận không cần build chức năng này. |

---

## 3. Tác động lên schema

### 3.1 Bảng `rooms`

```diff
 create table rooms (
   id uuid primary key default gen_random_uuid(),
   building_id uuid not null references buildings(id) on delete cascade,
   code text not null,                              -- '201', không kèm tiền tố P
   floor int,
-  base_rent int not null default 0,                -- CR-05: XÓA
-  status room_status not null default 'vacant',    -- CR-01: XÓA
   current_elec  numeric not null default 0,        -- N1: mốc hiện tại
   current_water numeric not null default 0,
   archived boolean not null default false,
   created_at timestamptz not null default now(),
   unique (building_id, code)
 );
```

```diff
-create type room_status as enum ('occupied','vacant','maintenance');   -- CR-01: XÓA
```

### 3.2 Bảng `contracts`

```diff
 create table contracts (
   id uuid primary key default gen_random_uuid(),
   room_id uuid not null references rooms(id) on delete cascade,
-  tenant_name text not null,                                  -- CR-02: XÓA
-  phone text,                                                 -- CR-02: XÓA
-  occupants int not null default 1 check (occupants >= 1),    -- CR-02: XÓA
   start_date date not null,
   end_date date,
   deposit int not null,
   rent int not null,
   active boolean not null default true,
   created_at timestamptz not null default now(),
   updated_at timestamptz not null default now()
 );
 create unique index one_active_contract_per_room on contracts (room_id) where active;
```

### 3.3 Bảng mới `contract_occupants`

```sql
-- CR-02: danh sách đầy đủ người ở. Số người = đếm số dòng (không có cột lưu sẵn)
create table contract_occupants (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contracts(id) on delete cascade,
  full_name text not null,                         -- CR-03: bắt buộc mọi người
  phone text,                                      -- CR-03: bắt buộc riêng người đại diện (validate ở app)
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
-- Đúng một người đại diện trên mỗi hợp đồng
create unique index one_primary_per_contract on contract_occupants (contract_id) where is_primary;
```

RLS: bật cho bảng mới theo pattern dẫn qua `contracts → rooms → building_id`.

---

## 4. Tác động lên logic

### 4.1 Chữ ký hàm trong `lib/billing`

```diff
-moveInDefaults(contract, settings, marks)
-periodicDefaults(contract, settings, room, endReadings)
+// occupants = ContractOccupant[]; số người ở = occupants.length
+moveInDefaults(contract, occupants, settings, marks)
+periodicDefaults(contract, occupants, settings, room, endReadings)
+primaryOccupant(occupants): ContractOccupant   // tên hiển thị trên hóa đơn
```

### 4.2 Công thức Dịch vụ chung

```diff
-common = settings.common_fee × contract.occupants
+common = settings.common_fee × occupants.length
```

### 4.3 Truy vấn trạng thái phòng

```diff
-room.status === 'occupied'
+// suy từ hợp đồng active của phòng
+contracts.some(c => c.room_id === room.id && c.active)
```

### 4.4 Gợi ý giá thuê khi nhận phòng

```diff
-defaultRent = room.base_rent
+// giá của hợp đồng gần nhất theo start_date, kể cả hợp đồng đã đóng
+// không có hợp đồng nào → để trống, admin nhập tay
+defaultRent = latestContractOf(room)?.rent ?? null
```

### 4.5 Tên khách hiển thị

Ba nơi dùng, đều lấy từ **người đại diện**, không phải cột trên `contracts`:

| Nơi | Trước | Sau |
|---|---|---|
| Danh sách phòng | `contract.tenant_name` | `primaryOccupant(occupants).full_name` |
| Mẫu hóa đơn in (`P503 - HỒ THỊ TRANG`) | `contract.tenant_name` | `primaryOccupant(occupants).full_name` |
| Lịch sử hoạt động phòng | `contract.tenant_name` | `primaryOccupant(occupants).full_name` |

---

## 5. Tác động lên màn hình

| Màn | Thay đổi |
|---|---|
| **Danh sách phòng** | Bỏ chip trạng thái Bảo trì. Tên khách lấy từ người đại diện. Cảnh báo hết hạn đổi ngưỡng 15 ngày. |
| **Chi tiết phòng** | Bỏ CTA "Chuyển Bảo trì". Thêm khối **Danh sách người ở** (tên + SĐT, đánh dấu người đại diện). |
| **Nhận phòng** | Thêm luồng: nhập **số người** → sinh đúng số dòng nhập tên + SĐT. Người đầu tiên mặc định là đại diện, đổi được. Ô giá thuê điền sẵn từ hợp đồng gần nhất, để trống nếu là hợp đồng đầu tiên. |
| **Sửa hợp đồng** | Tăng số người → thêm dòng trống. Giảm số người → **admin chọn đích danh người bị xóa**. Xóa người đang là đại diện → bắt chọn người đại diện mới trước khi lưu. |
| **Cài đặt tòa nhà** | Cột giá thuê ở dạng **chỉ đọc**, khác biệt rõ về thị giác so với ô nhập. Chặn sửa tên phòng đã có hóa đơn kèm thông báo lý do. |
| **Nhập chỉ số** | Danh sách chỉ gồm phòng có hợp đồng hiệu lực (không còn khái niệm Bảo trì). |

---

## 6. Phiên bản tài liệu

| Tài liệu | Phiên bản | Ghi chú |
|---|---|---|
| `nghiep-vu-hoa-don-v2.md` | v2.3 | **Không đổi** — nghiệp vụ hóa đơn cốt lõi giữ nguyên |
| `srs-quan-ly-phong.md` | v1.2 | Chịu phần lớn thay đổi |
| `srs-setting-toa-nha.md` | v1.2 | BR-S10, giá thuê chỉ đọc |
| `srs-chi-so-va-lap-hoa-don.md` | v1.1 | Bỏ Bảo trì, đổi nguồn tên khách |
| `HANDOFF-rentory.md` | cập nhật | Schema, `lib/billing`, màn hình |

---

## 7. Checklist bàn giao

Đánh dấu khi hoàn tất:

**Schema**
- [ ] Xóa `create type room_status`
- [ ] Xóa `rooms.status`, `rooms.base_rent`
- [ ] Xóa `contracts.tenant_name`, `contracts.phone`, `contracts.occupants`
- [ ] Tạo bảng `contract_occupants` + unique index một người đại diện
- [ ] Bật RLS cho `contract_occupants`

**Logic**
- [ ] `moveInDefaults` / `periodicDefaults` nhận thêm `occupants[]`
- [ ] Thêm `primaryOccupant()`
- [ ] Dịch vụ chung tính theo `occupants.length`
- [ ] Trạng thái phòng suy từ hợp đồng active
- [ ] Gợi ý giá thuê từ hợp đồng gần nhất, null nếu chưa có
- [ ] Hằng số ngưỡng cảnh báo = 15 ngày, đặt ở một chỗ

**Validate**
- [ ] Họ tên bắt buộc mọi người ở
- [ ] SĐT bắt buộc riêng người đại diện
- [ ] Chặn xóa người đại diện nếu chưa chọn người thay
- [ ] Chặn sửa `rooms.code` khi phòng đã có hóa đơn

**UI**
- [ ] Gỡ mọi dấu vết trạng thái Bảo trì
- [ ] Form nhập người ở theo số lượng
- [ ] Giảm số người → chọn đích danh
- [ ] Cột giá thuê ở Cài đặt là chỉ đọc
- [ ] Tên khách ở 3 nơi lấy từ người đại diện

**Test**
- [ ] Dịch vụ chung đổi theo số người; hóa đơn cũ giữ nguyên
- [ ] Cảnh báo hiện ở 10 ngày, không hiện ở 20 ngày
- [ ] Phòng có hóa đơn không đổi được tên; phòng chưa có thì đổi được
- [ ] Hợp đồng đầu tiên của phòng: ô giá thuê trống
