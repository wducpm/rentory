# SRS — Màn Cài đặt tòa nhà (Building Settings)

**Dự án:** Rentory · **Phiên bản:** 1.2 · **Ngày:** 03/09/2026
**Nguồn yêu cầu:** Admin (chủ tòa nhà) · **Liên quan:** `nghiep-vu-hoa-don-v2.md` v2.3, `HANDOFF-rentory.md`
**Thay đổi so với v1.1:** không cho đổi tên phòng đã có hóa đơn (BR-S10) · bỏ trạng thái Bảo trì.

---

## 1. Mục đích & phạm vi

Màn Cài đặt tòa nhà là nơi khai báo **dữ liệu nền** (master data) để hệ thống tính hóa đơn. Không có dữ liệu này thì không tạo được hóa đơn nào.

### Trong phạm vi
- Thiết lập tổng số phòng có thể cho thuê
- Thiết lập 4 đơn giá dịch vụ cấp tòa nhà
- Khai báo **tên phòng**
- **Hiển thị** giá thuê hiện tại của từng phòng (chỉ đọc)

### Ngoài phạm vi
Nhập/sửa giá thuê phòng (thuộc luồng nhận phòng và màn chi tiết phòng) · thông tin tòa nhà · tài khoản admin · trạng thái phòng · sổ chi · báo cáo.

---

## 2. Actor & bối cảnh

| Actor | Mô tả |
|---|---|
| **Admin** | Chủ tòa nhà, người dùng duy nhất (1 tòa = 1 admin). Toàn quyền trên màn này. |

| Bối cảnh | Tần suất | Đặc điểm |
|---|---|---|
| **Thiết lập ban đầu** | 1 lần khi khai trương hệ thống | Nhập 20 tên phòng + 4 đơn giá |
| **Chỉnh sửa về sau** | Thỉnh thoảng | Sửa lẻ 1–2 mục, cần thận trọng vì đã có dữ liệu thật |

Ưu tiên: bối cảnh 2 an toàn hơn là bối cảnh 1 nhanh.

---

## 3. Yêu cầu chức năng

### FR-001 · Thiết lập tổng số phòng có thể cho thuê

| | |
|---|---|
| **Input** | Số nguyên dương (1–999) |
| **Xử lý** | So sánh với số phòng hiện có → sinh thêm hoặc yêu cầu loại bớt |
| **Output** | Danh sách phòng có đúng số lượng đã khai báo |
| **Ưu tiên** | Must |

Lần đầu (chưa có phòng nào): nhập N → sinh N dòng phòng trống chờ đặt tên. Về sau: ô này hiển thị số phòng đang có, sửa được để tăng/giảm.

### FR-002 · Tăng tổng số phòng

| | |
|---|---|
| **Input** | Số mới > số hiện tại |
| **Xử lý** | Sinh thêm (mới − cũ) dòng phòng trống ở cuối danh sách |
| **Output** | Các dòng mới chưa đặt tên, chờ admin nhập |
| **Ưu tiên** | Must |

Không ảnh hưởng phòng đang có. Thao tác an toàn, không cần xác nhận riêng.

### FR-003 · Giảm tổng số phòng

| | |
|---|---|
| **Input** | Số mới < số hiện tại |
| **Xử lý** | Yêu cầu admin **chọn đích danh** phòng cần loại. Kiểm tra ràng buộc BR-S06, BR-S07 |
| **Output** | Phòng được chọn bị archive (giữ lịch sử) hoặc xóa cứng (nếu chưa phát sinh gì) |
| **Ưu tiên** | Must |

Thao tác **có rủi ro mất dữ liệu** — bắt buộc có bước xác nhận riêng, không gộp vào nút Lưu chung.

### FR-004 · Thiết lập đơn giá dịch vụ tòa nhà

| Mục | Đơn vị | Mặc định | Ràng buộc |
|---|---|---|---|
| Giá điện | đ / số | 3.800 | số nguyên ≥ 0 |
| Giá nước | đ / khối | 30.000 | số nguyên ≥ 0 |
| Dịch vụ chung | đ / người / tháng | 150.000 | số nguyên ≥ 0 |
| Internet | đ / phòng / tháng | 100.000 | số nguyên ≥ 0 |

**Ưu tiên:** Must. Mỗi mục **một mức giá duy nhất**, không bậc thang (BR-S09). Áp dụng theo BR-S04.

### FR-005 · Khai báo tên phòng

| | |
|---|---|
| **Input** | Số phòng do admin nhập (VD `201`). Tiền tố `P` do hệ thống gắn cố định |
| **Xử lý** | Validate theo BR-S02 |
| **Output** | Tên phòng dạng `P201`, dùng thống nhất toàn hệ thống kể cả trên mã hóa đơn |
| **Ưu tiên** | Must |

Số dòng = tổng số phòng ở FR-001. Không thêm/bớt dòng trực tiếp tại đây — thay đổi số lượng phải qua FR-002/FR-003 để có bước kiểm tra ràng buộc.

### FR-006 · Hiển thị giá thuê hiện tại (chỉ đọc)

| | |
|---|---|
| **Input** | Không có — lấy từ hợp đồng đang hiệu lực của phòng |
| **Xử lý** | Phòng có khách → hiện giá thuê của hợp đồng. Phòng trống → hiện `—` |
| **Output** | Cột giá thuê dạng view, **không sửa được tại màn này** |
| **Ưu tiên** | Must |

Mục đích: cho admin nhìn tổng quan mặt bằng giá cả tòa trong một màn. Sửa giá thực hiện ở màn chi tiết phòng (BR-S05).

### FR-007 · Lưu và kiểm tra hợp lệ

| | |
|---|---|
| **Xử lý** | Chặn lưu khi vi phạm BR-S02, BR-S03. Hiển thị lỗi tại đúng dòng vi phạm |
| **Output** | Lưu thành công → thông báo xác nhận |
| **Ưu tiên** | Must |

Phòng chưa đặt tên **được phép tồn tại** (chưa hoàn tất) nhưng không chọn được trong luồng nhận phòng.

---

## 4. Quy tắc nghiệp vụ

| ID | Quy tắc |
|---|---|
| **BR-S01** | Tổng số phòng = số bản ghi phòng **chưa archive** của tòa. Hai con số luôn khớp, không lưu tách rời. |
| **BR-S02** | Tên phòng có format `P{số}`. Tiền tố `P` cố định do hệ thống gắn; phần số do admin nhập (chuỗi 2–4 chữ số, VD `201` = phòng 01 tầng 2). Phần số **duy nhất** trong phạm vi một tòa. |
| **BR-S03** | Mọi giá tiền là **số nguyên VND ≥ 0**. Không dùng số thập phân. |
| **BR-S04** | Đổi đơn giá dịch vụ → **áp ngay cho mọi lần tính sau đó**. Hóa đơn đã lập **giữ nguyên** số tiền đã snapshot (nguyên tắc N5 nghiệp vụ hóa đơn). Không tính lại hồi tố. |
| **BR-S05** | **Giá thuê phòng thuộc về hợp đồng, không thuộc về phòng.** Được set khi admin nhận khách mới vào phòng trống; sửa tại màn chi tiết phòng. Màn Cài đặt chỉ hiển thị, không cho sửa. |
| **BR-S06** | Không được loại phòng đang có **hợp đồng hiệu lực**. Phải trả phòng trước. |
| **BR-S07** | Phòng đã phát sinh hóa đơn → chỉ **archive**, không xóa cứng; lịch sử hóa đơn giữ nguyên và tra cứu được. Phòng chưa có hóa đơn và không có hợp đồng → xóa cứng được. |
| **BR-S08** | Không lưu lịch sử phiên bản đơn giá. Hóa đơn đã snapshot số tiền nên không cần tra ngược đơn giá cũ. |
| **BR-S09** | Đơn giá điện và nước là **một mức duy nhất**, không tính bậc thang theo mức tiêu thụ. |
| **BR-S10** | **Phòng đã phát sinh hóa đơn không được đổi tên** — mã hóa đơn snapshot số phòng, đổi tên sẽ làm mã lệch thực tế. Phòng chưa có hóa đơn nào thì đổi tên tự do. |

---

## 5. User story & Acceptance Criteria

### US-01 · Thiết lập ban đầu
*Là admin, tôi muốn khai báo phòng và đơn giá khi mới dùng hệ thống, để bắt đầu tạo hóa đơn được ngay.*

- **AC-01.1** — Given tòa nhà chưa có phòng nào, When admin nhập tổng số phòng = 20 và lưu, Then hệ thống tạo 20 dòng phòng trống chờ đặt tên.
- **AC-01.2** — Given một dòng phòng trống, When admin nhập `201`, Then hệ thống hiển thị tên phòng là `P201`; admin không nhập được ký tự `P` (tiền tố do hệ thống gắn).
- **AC-01.3** — Given 4 đơn giá để trống, When mở màn lần đầu, Then hiển thị giá mặc định (3.800 / 30.000 / 150.000 / 100.000) và sửa được.
- **AC-01.4** — Given còn phòng chưa đặt tên, When admin lưu, Then vẫn lưu thành công nhưng phòng đó không xuất hiện trong danh sách chọn ở luồng nhận phòng.
- **AC-01.5** — Given vừa tạo 20 phòng chưa có hợp đồng nào, Then cột Giá thuê của cả 20 dòng hiển thị `—`.

### US-02 · Sửa đơn giá dịch vụ
*Là admin, tôi muốn cập nhật đơn giá khi giá điện nước thay đổi, để hóa đơn kỳ tới tính đúng.*

- **AC-02.1** — Given giá điện đang là 3.800, When admin đổi thành 4.000 và lưu, Then mọi hóa đơn tạo **sau** thời điểm lưu dùng giá 4.000.
- **AC-02.2** — Given đã tồn tại hóa đơn tính theo giá 3.800, When admin đổi giá thành 4.000, Then số tiền trên hóa đơn cũ **không thay đổi** (BR-S04).
- **AC-02.3** — Given admin nhập giá âm hoặc có ký tự chữ, When lưu, Then hiển thị lỗi tại ô đó và không lưu.
- **AC-02.4** — When admin lưu thay đổi đơn giá, Then hiển thị cảnh báo ngắn cho biết thay đổi chỉ áp cho hóa đơn tạo sau đó.

### US-03 · Tăng số phòng
*Là admin, tôi muốn thêm phòng khi tòa nhà mở rộng, để đưa phòng mới vào cho thuê.*

- **AC-03.1** — Given đang có 20 phòng, When admin đổi tổng số thành 22 và lưu, Then danh sách có thêm 2 dòng trống ở cuối; 20 phòng cũ không đổi.
- **AC-03.2** — Given vừa thêm 2 dòng, When admin chưa đặt tên, Then 2 phòng đó không chọn được trong luồng nhận phòng.

### US-04 · Giảm số phòng
*Là admin, tôi muốn loại phòng không còn cho thuê, mà không làm mất lịch sử hóa đơn của phòng đó.*

- **AC-04.1** — Given đang có 20 phòng, When admin đổi tổng số thành 18, Then hệ thống yêu cầu **chọn đích danh** 2 phòng cần loại, không tự cắt 2 phòng cuối.
- **AC-04.2** — Given phòng được chọn **đang có hợp đồng hiệu lực**, When xác nhận loại, Then chặn thao tác và báo rõ phải trả phòng trước (BR-S06).
- **AC-04.3** — Given phòng được chọn **đã có hóa đơn**, When xác nhận loại, Then phòng chuyển sang archive; lịch sử hóa đơn vẫn tra cứu được (BR-S07).
- **AC-04.4** — Given phòng được chọn **chưa có hóa đơn và không có hợp đồng**, When xác nhận loại, Then xóa cứng bản ghi phòng.
- **AC-04.5** — When admin thực hiện giảm số phòng, Then phải qua bước xác nhận riêng nêu rõ tên phòng bị ảnh hưởng, không gộp vào nút Lưu chung.

### US-05 · Sửa tên phòng
*Là admin, tôi muốn sửa số phòng khi đặt sai, để tên phòng khớp thực tế.*

- **AC-05.1** — Given phòng đang là `P201`, When admin đổi số thành `202` mà `P202` đã tồn tại, Then báo lỗi trùng và không lưu (BR-S02).
- **AC-05.2** — Given admin nhập số phòng chứa chữ cái hoặc quá 4 chữ số, When lưu, Then báo lỗi định dạng và không lưu.
- **AC-05.3** — Given phòng **đã có ít nhất một hóa đơn**, When admin sửa số phòng, Then chặn thao tác và báo rõ lý do (BR-S10).
- **AC-05.4** — Given phòng **chưa có hóa đơn nào**, When admin sửa số phòng hợp lệ, Then lưu thành công.

### US-06 · Xem mặt bằng giá thuê
*Là admin, tôi muốn nhìn giá thuê của toàn bộ phòng trong một màn, để nắm mặt bằng giá.*

- **AC-06.1** — Given phòng có hợp đồng hiệu lực giá 4.400.000, Then cột Giá thuê hiển thị 4.400.000 ở chế độ **chỉ đọc**.
- **AC-06.2** — Given phòng đang trống, Then cột Giá thuê hiển thị `—`.
- **AC-06.3** — When admin chạm vào ô giá thuê, Then không mở được ô nhập; hệ thống điều hướng sang màn chi tiết phòng (nơi sửa được).

---

## 6. Màn hình & luồng

```
┌─ Khối 1 · Quy mô ────────────────────────────┐
│  Tổng số phòng có thể cho thuê:  [ 20 ]      │
└──────────────────────────────────────────────┘
┌─ Khối 2 · Đơn giá dịch vụ tòa nhà ───────────┐
│  Giá điện          [ 3.800 ]   đ/số          │
│  Giá nước          [ 30.000 ]  đ/khối        │
│  Dịch vụ chung     [ 150.000 ] đ/người/tháng │
│  Internet          [ 100.000 ] đ/phòng/tháng │
│  ⚠ Áp cho hóa đơn tạo sau khi lưu            │
└──────────────────────────────────────────────┘
┌─ Khối 3 · Danh sách phòng (20) ──────────────┐
│  Tên phòng          Giá thuê / tháng         │
│  P [ 201 ]          4.400.000        (view)  │
│  P [ 202 ]          —                (view)  │
│  P [    ]           —                        │
│  …                                            │
└──────────────────────────────────────────────┘
                                  [ Lưu cài đặt ]
```

**Nguyên tắc trình bày:**
- Khối 3 phụ thuộc khối 1 → đặt sau; số dòng bám theo giá trị khối 1.
- Tiền tố `P` hiển thị cố định ngoài ô nhập, admin chỉ gõ phần số.
- Cột giá thuê khác biệt rõ về mặt thị giác so với ô nhập (nền phẳng, không viền) để không gây hiểu nhầm là sửa được.
- Thao tác giảm số phòng mở dialog riêng, không xử lý inline.
- Mobile-first: mỗi phòng là một card; desktop hiển thị dạng bảng.

---

## 7. Dữ liệu

| Bảng | Trường liên quan |
|---|---|
| `building_settings` | `elec_price`, `water_price`, `common_fee`, `internet_fee` |
| `rooms` | `code` (lưu phần số, VD `201`), `archived`, `building_id` |
| `contracts` | `rent` — nguồn duy nhất của giá thuê (BR-S05) |

**Lưu ý triển khai:**
- `rooms.code` lưu **phần số** (`201`), không lưu tiền tố `P`. Tiền tố gắn ở tầng hiển thị và ở hàm sinh mã hóa đơn (`HĐ-P201-…`), đảm bảo thống nhất một chỗ.
- Tổng số phòng **không lưu thành cột riêng** — là kết quả đếm `rooms` chưa archive (BR-S01). Lưu tách rời sẽ tạo hai nguồn sự thật có thể lệch nhau.
- ✅ **Đã giải quyết:** cột `rooms.base_rent` đã được **bỏ khỏi schema**. Giá thuê chỉ tồn tại ở `contracts.rent`. Khi nhận phòng, ô giá thuê điền sẵn theo **giá của hợp đồng gần nhất** của phòng đó (FR-209 trong SRS Quản lý phòng).

---

## 8. Giả định & phụ thuộc

**Giả định:**
- GĐ-01 — Phần số của tên phòng là chuỗi 2–4 chữ số, không ràng buộc phải khớp tầng thực tế; hệ thống chỉ kiểm tra trùng và định dạng.
- GĐ-02 — Phòng chỉ có 2 trạng thái: Đang thuê / Trống, **suy ra từ hợp đồng**, không set tại màn này.
- GĐ-03 — Không cần lưu lịch sử thay đổi đơn giá (BR-S08).
- GĐ-04 — Một tòa nhà, một admin. Không phân quyền chỉnh sửa.
- GĐ-05 — Không có chức năng sinh tên phòng hàng loạt; admin nhập tay từng số. Khối lượng 20 dòng × 1 trường được đánh giá là chấp nhận được.

**Phụ thuộc:**
- PT-01 — Nghiệp vụ hóa đơn (`nghiep-vu-hoa-don-v2.md` v2.3), đặc biệt N5 (snapshot) và N6 (admin quyết mọi con số).
- PT-02 — Luồng nhận phòng: cần danh sách phòng đã đặt tên, và là nơi set giá thuê lần đầu.
- PT-03 — Màn chi tiết phòng: nơi duy nhất sửa được giá thuê.

---

## 9. Hạng mục đã xác nhận

| No | Hạng mục | Kết luận |
|---|---|---|
| 1 | Giảm số phòng | Chọn đích danh phòng cần loại |
| 2 | Giá thuê phòng | Set khi nhận khách mới; sửa ở chi tiết phòng; Cài đặt chỉ hiển thị |
| 3 | Tên phòng | Format `P{số}` — `P` cố định, admin nhập phần số (VD `201`) |
| 4 | Sinh tên tự động | Không làm — admin nhập tay (hệ quả của mục 3) |
| 6 | Đổi tên phòng đã có hóa đơn | Không cho phép (BR-S10) |
| 5 | Đơn giá điện/nước | Một mức duy nhất, không bậc thang |

---

## 10. Ma trận truy vết

| Yêu cầu gốc | FR | BR | US / AC |
|---|---|---|---|
| Tổng số phòng có thể cho thuê | FR-001, FR-002, FR-003 | BR-S01, BR-S06, BR-S07 | US-01, US-03, US-04 |
| Giá điện · nước · DV chung · internet | FR-004 | BR-S03, BR-S04, BR-S08, BR-S09 | US-02 |
| Tên phòng | FR-005, FR-007 | BR-S02 | US-01, US-05 |
| Giá thuê từng phòng | FR-006 | BR-S05 | US-06 |
