# SRS — Màn Chỉ số & Lập hóa đơn (Meter Reading)

**Dự án:** Rentory · **Phiên bản:** 1.1 · **Ngày:** 03/09/2026
**Nguồn yêu cầu:** Admin (chủ tòa nhà) + mẫu hóa đơn in đính kèm
**Liên quan:** `nghiep-vu-hoa-don-v2.md` v2.3 · `srs-setting-toa-nha.md` v1.1 · `HANDOFF-rentory.md`

---

## 1. Mục đích & phạm vi

Màn Chỉ số là **điểm vào chính của chu kỳ vận hành hàng tháng**: admin chốt số công tơ toàn tòa rồi sinh hóa đơn hàng loạt. Đây là màn được dùng nhiều nhất trong tháng.

### Trong phạm vi
- Chọn ngày chốt số
- Nhập chỉ số đầu kỳ / cuối kỳ cho toàn bộ phòng đang thuê
- Sửa chỉ số kể cả sau khi đã lập hóa đơn
- Lập hóa đơn định kỳ hàng loạt
- Xem và tải hóa đơn theo mẫu in

### Ngoài phạm vi
Hóa đơn nhận phòng / trả phòng (thuộc luồng nhận–trả phòng) · thu tiền · sửa mốc thủ công khi thay công tơ (chức năng riêng, xem GĐ-03) · gửi hóa đơn cho khách.

---

## 2. Actor & bối cảnh

| Actor | Mô tả |
|---|---|
| **Admin** | Chủ tòa nhà. Thực hiện toàn bộ thao tác trên màn này. |

**Bối cảnh:** mỗi tháng một lần, thường vào ngày cuối tháng. Admin đi đọc công tơ từng phòng (từ tầng cao xuống tầng thấp) rồi nhập vào hệ thống. Thứ tự hiển thị phải khớp thứ tự đi thực tế để nhập liên tục không phải tìm dòng.

---

## 3. Yêu cầu chức năng

### FR-101 · Chọn ngày chốt số

| | |
|---|---|
| **Input** | Ngày (date picker), mặc định = ngày cuối tháng hiện tại |
| **Xử lý** | Suy ra kỳ điện nước = tháng của ngày chốt; kỳ dịch vụ = tháng kế tiếp |
| **Output** | Hiển thị rõ hai kỳ đã suy ra, admin sửa được nếu cần |
| **Ưu tiên** | Must |

Ví dụ chọn 31/08/2026 → kỳ điện nước T8/2026, kỳ dịch vụ T9/2026.

### FR-102 · Hiển thị danh sách chỉ số

| | |
|---|---|
| **Input** | Ngày chốt đã chọn |
| **Xử lý** | Lấy toàn bộ phòng **đang có hợp đồng hiệu lực**, sắp xếp **giảm dần** theo số phòng |
| **Output** | Danh sách: P802 → P801 → P703 → … → P201 |
| **Ưu tiên** | Must |

Mỗi dòng gồm: tên phòng · tên khách · điện (đầu kỳ / cuối kỳ / đã dùng) · nước (đầu kỳ / cuối kỳ / đã dùng) · thành tiền tạm tính.

Phòng Trống **không xuất hiện** — không có ai để lập hóa đơn.

### FR-103 · Tự điền số đầu kỳ

| | |
|---|---|
| **Xử lý** | Số đầu kỳ = **mốc hiện tại của phòng** (nguyên tắc N1) |
| **Output** | Ô đầu kỳ điền sẵn, phân biệt thị giác với ô nhập tay, vẫn sửa được |
| **Ưu tiên** | Must |

Mốc hiện tại là số cuối kỳ của lần chốt trước, **trừ khi** đã bị ghi đè bởi hóa đơn nhận phòng, hóa đơn trả phòng, hoặc sửa thủ công (N2). Màn này không cần biết nguồn ghi đè — chỉ lấy giá trị hiện hành.

### FR-104 · Nhập số cuối kỳ

| | |
|---|---|
| **Input** | Số cuối kỳ điện và nước cho từng phòng |
| **Xử lý** | Tính tiêu thụ = cuối − đầu; tính tiền theo đơn giá tòa nhà; validate BR-M03 |
| **Output** | Số đã dùng và thành tiền cập nhật tức thời |
| **Ưu tiên** | Must |

### FR-105 · Lập hóa đơn hàng loạt

| | |
|---|---|
| **Input** | CTA "Lập hóa đơn" |
| **Xử lý** | Với mỗi phòng đủ dữ liệu: tạo hóa đơn định kỳ, sinh mã theo chuẩn, ghi đè mốc phòng |
| **Output** | Danh sách hóa đơn đã tạo + số phòng bị bỏ qua (nếu có) |
| **Ưu tiên** | Must |

Phòng thiếu số cuối kỳ → **bỏ qua, không chặn cả lô**, và báo rõ danh sách phòng bị bỏ để admin bổ sung sau (BR-M04).

### FR-106 · Sửa chỉ số sau khi đã lập hóa đơn

| | |
|---|---|
| **Input** | Sửa ô đầu kỳ hoặc cuối kỳ của phòng đã có hóa đơn kỳ đó |
| **Xử lý** | Cập nhật hóa đơn tương ứng; tính lại tiền điện/nước theo mặc định; ghi đè mốc theo BR-M06 |
| **Output** | Hóa đơn cập nhật, ghi log thay đổi mốc |
| **Ưu tiên** | Must |

⚠ Nếu số tiền điện/nước trên hóa đơn **đã bị admin chỉnh tay** khác giá trị mặc định (VD thu bù công tơ cũ theo HD-12), hệ thống **hỏi xác nhận** trước khi ghi đè, vì tính lại sẽ xóa mất phần chỉnh tay đó (nguyên tắc N7).

### FR-107 · Xem và tải hóa đơn

| | |
|---|---|
| **Input** | Từ màn chi tiết phòng: nút Xem / Tải về |
| **Xử lý** | Render hóa đơn theo mẫu ở mục 7 |
| **Output** | Xem trên màn hình; tải file về máy |
| **Ưu tiên** | Must |

---

## 4. Quy tắc nghiệp vụ

| ID | Quy tắc |
|---|---|
| **BR-M01** | Thứ tự hiển thị phòng: **giảm dần** theo phần số của tên phòng (802 → 801 → 703 → … → 201), khớp thứ tự admin đi đọc công tơ từ tầng cao xuống. |
| **BR-M02** | Chỉ hiển thị phòng **đang có hợp đồng hiệu lực**. Phòng Trống không lập hóa đơn định kỳ. |
| **BR-M03** | Số cuối kỳ ≥ số đầu kỳ. Vi phạm → chặn lưu dòng đó, không chặn các dòng khác. |
| **BR-M04** | Cho phép lập hóa đơn khi còn phòng thiếu số. Phòng thiếu bị bỏ qua và được liệt kê để nhắc bổ sung. |
| **BR-M05** | Lập hóa đơn thành công → **mốc phòng = số cuối kỳ của hóa đơn** (HD-04), ghi log. |
| **BR-M06** | Sửa chỉ số sau khi lập hóa đơn: cập nhật chính hóa đơn đó, **không lan truyền** sang hóa đơn khác (HD-08). Chỉ ghi đè mốc nếu hóa đơn đó là hóa đơn mới nhất của phòng (HD-08a). |
| **BR-M07** | Không lập trùng: một hợp đồng chỉ có **một hóa đơn định kỳ** cho mỗi kỳ dịch vụ. Bấm "Lập hóa đơn" lần hai cho cùng kỳ → cập nhật hóa đơn đã có, không tạo bản mới. |
| **BR-M08** | Đơn giá dùng để tính là đơn giá **tại thời điểm lập hóa đơn**; số tiền được snapshot vào hóa đơn (N5). |

---

## 5. User story & Acceptance Criteria

### US-11 · Chốt số công tơ toàn tòa
*Là admin, tôi muốn nhập số công tơ của tất cả phòng trong một màn theo đúng thứ tự tôi đi đọc, để chốt số nhanh và không sót phòng.*

- **AC-11.1** — Given tòa có phòng từ P201 đến P802, When mở màn Chỉ số, Then danh sách hiển thị theo thứ tự giảm dần P802 → P801 → P703 → … → P201.
- **AC-11.2** — Given phòng P503 có mốc hiện tại điện 5033, When mở màn, Then ô đầu kỳ điện của P503 hiển thị sẵn 5033 và phân biệt rõ với ô nhập tay.
- **AC-11.3** — Given admin nhập số cuối kỳ 5106, Then dòng đó hiển thị ngay "73 kWh" và thành tiền 277.400 VND (73 × 3.800).
- **AC-11.4** — Given admin nhập số cuối kỳ nhỏ hơn đầu kỳ, Then ô báo lỗi và không lưu dòng đó; các dòng khác không bị ảnh hưởng.
- **AC-11.5** — Given phòng P601 đang Trống, Then P601 không xuất hiện trong danh sách.
- **AC-11.6** — Given admin chọn ngày chốt 31/08/2026, Then màn hiển thị kỳ điện nước T8/2026 và kỳ dịch vụ T9/2026.

### US-12 · Lập hóa đơn hàng loạt
*Là admin, tôi muốn sinh hóa đơn cho tất cả phòng bằng một thao tác, để không phải tạo thủ công từng phòng.*

- **AC-12.1** — Given đã nhập đủ số cho 18/20 phòng, When bấm "Lập hóa đơn", Then hệ thống tạo 18 hóa đơn và báo rõ 2 phòng bị bỏ qua kèm tên phòng.
- **AC-12.2** — Given hóa đơn vừa tạo cho P503 kỳ ĐN T8/2026, Then mã hóa đơn là `HĐ-P503-ĐN/T8.26-DV/T9.26`.
- **AC-12.3** — Given lập hóa đơn thành công cho P503 với số cuối kỳ 5106, Then mốc hiện tại của P503 được cập nhật thành 5106 và ghi log.
- **AC-12.4** — Given đã lập hóa đơn kỳ T9/2026 cho P503, When bấm "Lập hóa đơn" lần nữa cùng kỳ, Then hóa đơn hiện có được cập nhật, không tạo hóa đơn thứ hai (BR-M07).

### US-13 · Sửa chỉ số sau khi chốt
*Là admin, tôi muốn sửa lại số công tơ ghi nhầm ngay cả khi đã lập hóa đơn, để số liệu khớp thực tế.*

- **AC-13.1** — Given P503 đã có hóa đơn với số cuối kỳ 5106, When admin sửa thành 5116, Then hóa đơn cập nhật thành 83 kWh và 315.400 VND.
- **AC-13.2** — Given tiền điện của hóa đơn đã bị admin chỉnh tay thành 400.000 (khác mặc định), When admin sửa chỉ số, Then hệ thống hỏi xác nhận trước khi ghi đè số tiền đã chỉnh.
- **AC-13.3** — Given P503 đã có hóa đơn kỳ sau đó, When admin sửa hóa đơn kỳ trước, Then hóa đơn kỳ sau **không bị thay đổi** và mốc phòng **không** bị ghi lùi (BR-M06).

### US-14 · Tải hóa đơn gửi khách
*Là admin, tôi muốn tải hóa đơn của từng phòng theo mẫu chuẩn, để gửi cho khách.*

- **AC-14.1** — Given hóa đơn của P503 kỳ dịch vụ T9/2026, When bấm Tải về, Then file có tiêu đề "HÓA ĐƠN THÁNG 9/2026" và bố cục đúng mẫu ở mục 7.
- **AC-14.2** — Then hóa đơn hiển thị đủ: tên phòng + tên khách, thời hạn hợp đồng, giá thuê, chi tiết điện (đầu/cuối/đã dùng/tổng), nước, dịch vụ chung kèm số người, internet.
- **AC-14.3** — Then khối tổng kết hiển thị Tiền phòng, Tiền dịch vụ (tổng 4 khoản dịch vụ), và Tổng cộng.
- **AC-14.4** — Then phần ghi chú cuối hóa đơn hiển thị đúng nội dung đã cấu hình cho tòa nhà.

---

## 6. Màn hình

```
┌──────────────────────────────────────────────────────┐
│  Chỉ số công tơ                                      │
│  Ngày chốt số:  [ 31/08/2026 ]                       │
│  → Điện nước T8/2026 · Dịch vụ T9/2026               │
├──────────────────────────────────────────────────────┤
│  P802 · Đỗ Minh Dũng                                 │
│    Điện   đầu [ 9720 ]  cuối [ 10145 ]  = 425 kWh    │
│    Nước   đầu [  295 ]  cuối [   310 ]  = 15 m³      │
│                                    Tạm tính 2.065.000│
├──────────────────────────────────────────────────────┤
│  P801 · …                                            │
├──────────────────────────────────────────────────────┤
│  …                                                   │
│  P201 · …                                            │
├──────────────────────────────────────────────────────┤
│  Đã nhập 18/20 phòng    Tổng tạm tính: 98.400.000    │
│                              [ Lập hóa đơn ]         │
└──────────────────────────────────────────────────────┘
```

- Ô đầu kỳ: nền mờ / viền nét đứt (giá trị tự điền), vẫn sửa được.
- Ô cuối kỳ: ô nhập bình thường, là nơi admin gõ.
- Mobile-first: mỗi phòng một card, thứ tự dọc khớp thứ tự đi đọc công tơ.
- Bàn phím số cho mọi ô nhập chỉ số; hỗ trợ nhảy ô tuần tự để nhập liên tục không cần chạm.

---

## 7. Mẫu hóa đơn (bản in / tải về)

Ánh xạ từng trường trên mẫu đính kèm sang nguồn dữ liệu:

| Vùng | Nội dung hiển thị | Nguồn dữ liệu |
|---|---|---|
| Tiêu đề | `HÓA ĐƠN THÁNG {tháng}/{năm}` | **kỳ dịch vụ** của hóa đơn |
| Dòng phòng | `P503 - HỒ THỊ TRANG` (in hoa) | `rooms.code` + tên **người đại diện** trong `contract_occupants` |
| Thời hạn hợp đồng | `01/07/2026 - 30/06/2027` | `contracts.start_date` – `end_date` |
| GIÁ THUÊ | `4,200,000 VND` | dòng phí `rent` |
| ĐIỆN | Số đầu kì · Số cuối kì · Số điện đã sử dụng (`kWh`) · Tổng | `elec_start`, `elec_end`, hiệu số, dòng phí `elec` |
| NƯỚC | Số đầu kì · Số cuối kì · Số nước đã sử dụng (`m³`) · Tổng | `water_start`, `water_end`, hiệu số, dòng phí `water` |
| DỊCH VỤ CHUNG | Số người · Tổng | số dòng `contract_occupants`, dòng phí `common` |
| INTERNET | Tổng | dòng phí `internet` |
| TIỀN PHÒNG | `4,200,000 VND` | dòng phí `rent` |
| TIỀN DỊCH VỤ | `647,400 VND` | tổng `elec + water + common + internet` |
| TỔNG | `4,847,400 VND` | tổng toàn bộ dòng phí |
| Ghi chú cuối | Nội dung tùy tòa nhà, chữ đỏ | **cần bổ sung trường cấu hình** — xem mục 10 |

**Quy ước hiển thị:**
- Định dạng số: dấu phẩy ngăn nghìn, hậu tố ` VND` (theo mẫu: `4,200,000 VND`).
- Đơn vị tiêu thụ: `kWh` cho điện, `m³` cho nước.
- Số tiền hiển thị là **số đã snapshot trên hóa đơn**, không tính lại từ chỉ số (N7). Nếu admin đã chỉnh tay, bản in thể hiện số đã chỉnh — kể cả khi không khớp với tiêu thụ.

**Ba loại hóa đơn dùng chung mẫu, khác ở các dòng bổ sung:**

| Loại | Khác biệt trên bản in |
|---|---|
| Định kỳ | Đúng như mẫu đính kèm |
| Nhận phòng | Điện/nước hiển thị 0 và cùng chỉ số đầu = cuối; **thêm dòng CỌC** trước khối tổng |
| Trả phòng | **Thêm dòng HOÀN CỌC** (số âm); các dòng dịch vụ hiển thị theo số admin quyết |

---

## 8. Dữ liệu

| Bảng | Trường liên quan |
|---|---|
| `rooms` | `code`, `current_elec`, `current_water` (mốc hiện tại) |
| `contracts` | `rent`, `start_date`, `end_date`, `active` |
| `contract_occupants` | `full_name`, `phone`, `is_primary` — số người = số dòng |
| `invoices` | `code`, `type`, `issue_date`, `utility_period`, `service_period`, `elec_start/end`, `water_start/end` |
| `invoice_items` | `fee`, `amount` |
| `building_settings` | 4 đơn giá + **ghi chú cuối hóa đơn** (trường mới) |
| `meter_mark_logs` | log mỗi lần ghi đè mốc |

---

## 9. Giả định & phụ thuộc

**Giả định:**
- GĐ-01 — Admin đọc công tơ theo thứ tự tầng cao → tầng thấp, nên danh sách sắp giảm dần (BR-M01).
- GĐ-02 — Một đợt chốt số áp dụng cho toàn bộ phòng cùng một ngày. Không hỗ trợ chốt lệch ngày theo từng phòng.
- GĐ-03 — Sửa mốc do thay công tơ (HD-11) là chức năng riêng trong menu này, thao tác trên một phòng cụ thể, không nằm trong luồng chốt số hàng loạt.
- GĐ-04 — Tải về là thao tác cho từng phòng, không tải hàng loạt.

**Phụ thuộc:**
- PT-01 — Nghiệp vụ hóa đơn v2.3: N1, N2, N5, N7, HD-04, HD-06, HD-08, HD-08a, HD-12, HD-13.
- PT-02 — Cài đặt tòa nhà: 4 đơn giá và ghi chú cuối hóa đơn.
- PT-03 — Màn chi tiết phòng: nơi đặt nút Xem / Tải hóa đơn.

---

## 10. Hạng mục cần xác nhận

| No | Hạng mục | Vấn đề | Đề xuất |
|---|---|---|---|
| **1** | **Tiêu đề hóa đơn** | Mẫu in ghi `HÓA ĐƠN THÁNG 9/2026` — chỉ nêu **một** kỳ, trong khi HD-13 yêu cầu ghi rõ **hai** kỳ ("Điện nước tháng 8 · Dịch vụ tháng 9"). Khách nhìn hóa đơn "tháng 9" nhưng số điện là của tháng 8, dễ thắc mắc. | Giữ tiêu đề lớn theo kỳ dịch vụ (quen thuộc với khách), thêm dòng nhỏ dưới tiêu đề: *"Điện nước T8/2026 · Dịch vụ T9/2026"* và mã hóa đơn. Vừa giữ mẫu cũ vừa thỏa HD-13. |
| **2** | **Định dạng file tải về** | Chưa xác định PDF hay ảnh | PDF để in/lưu; PNG tiện gửi Zalo. Đề xuất làm PNG trước vì kênh gửi chính là Zalo. |
| **3** | **Ghi chú cuối hóa đơn** | Nội dung *"ĐỂ XE DƯỚI TẦNG HẦM… THANH TOÁN TỪ MÙNG 01 - 5"* đang cố định trong mẫu | Thêm trường **Ghi chú cuối hóa đơn** vào Cài đặt tòa nhà để admin tự sửa, không hard-code |
| **4** | **Ngày chốt lệch tháng** | Nếu admin chốt ngày 01/09 cho kỳ tháng 8, kỳ suy tự động sẽ ra sai | Cho sửa tay hai ô kỳ (FR-101). Xác nhận cách này ổn? |
| **5** | **Tải hàng loạt** | Có cần nút tải toàn bộ hóa đơn của kỳ trong một lần không? | Chưa làm ở v1 (GĐ-04) |

---

## 11. Ma trận truy vết

| Yêu cầu gốc | FR | BR | US / AC |
|---|---|---|---|
| Chọn ngày chốt số | FR-101 | — | AC-11.6 |
| Danh sách chỉ số thứ tự P802→P201 | FR-102 | BR-M01, BR-M02 | AC-11.1, AC-11.5 |
| Đầu kỳ mặc định = cuối kỳ trước, trừ khi bị ghi đè | FR-103 | — (N1, N2) | AC-11.2 |
| Cuối kỳ do admin nhập | FR-104 | BR-M03 | AC-11.3, AC-11.4 |
| Sửa chỉ số sau khi chốt | FR-106 | BR-M06 | US-13 |
| CTA Lập hóa đơn hàng loạt | FR-105 | BR-M04, BR-M05, BR-M07, BR-M08 | US-12 |
| View / Tải hóa đơn theo mẫu | FR-107 | — | US-14, mục 7 |
