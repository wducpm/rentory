# SRS — Chức năng Quản lý phòng (Room Management)

**Dự án:** Rentory · **Phiên bản:** 1.2 · **Ngày:** 03/09/2026
**Liên quan:** `nghiep-vu-hoa-don-v2.md` v2.3 · `srs-setting-toa-nha.md` · `srs-chi-so-va-lap-hoa-don.md`

**Thay đổi so với v1.1:** chốt ràng buộc trường thông tin người ở (BR-P17) · chốt phạm vi gợi ý giá thuê (BR-P18). Không còn hạng mục treo.

---

## 1. Mục đích & phạm vi

Quản lý phòng là **trục xoay của toàn hệ thống**: mọi hóa đơn, khoản thu, chỉ số công tơ đều gắn vào một phòng cụ thể. Chức năng này quản lý vòng đời phòng từ lúc trống, có khách, đến khi khách trả phòng.

### Trong phạm vi
Danh sách phòng và trạng thái · chi tiết phòng · nhận phòng · trả phòng · quản lý danh sách người ở · sửa thông tin hợp đồng · lịch sử hoạt động · cảnh báo hợp đồng sắp hết hạn.

### Ngoài phạm vi
Khai báo phòng và đơn giá (Cài đặt tòa nhà) · chốt số công tơ và lập hóa đơn định kỳ (màn Chỉ số) · quy tắc tính tiền (nghiệp vụ hóa đơn) · thu tiền · báo cáo.

---

## 2. Actor

| Actor | Mô tả |
|---|---|
| **Admin** | Chủ tòa nhà, người dùng duy nhất. Toàn quyền trên mọi phòng. |

Khách thuê **không** có tài khoản, không truy cập hệ thống.

---

## 3. Mô hình đối tượng

Bốn khái niệm có vòng đời khác nhau, dễ gắn nhầm chỗ:

| Khái niệm | Thuộc về | Vòng đời |
|---|---|---|
| **Phòng** | Tòa nhà | Vĩnh viễn (chỉ archive) |
| **Hợp đồng thuê** | Phòng | Từ ngày nhận đến ngày trả phòng |
| **Người ở** | Hợp đồng | Theo hợp đồng |
| **Mốc công tơ** | **Phòng** | Liên tục, không đứt khi đổi khách |

**Ba nguyên tắc phân tách:**

- **Giá thuê thuộc về hợp đồng, không thuộc về phòng.** Hai khách khác nhau ở cùng phòng có thể có giá khác nhau. Đổi giá cho khách mới không làm sai hóa đơn của khách cũ.
- **Mốc công tơ thuộc về phòng, không thuộc về hợp đồng.** Đồng hồ không reset khi đổi khách — số cuối của khách cũ chính là điểm bắt đầu của khách mới.
- **Hóa đơn thuộc về hợp đồng**, nhưng tính chỉ số dựa trên mốc của phòng.

Đây là điểm phần mềm quản lý cho thuê hay làm sai: gắn chỉ số vào hợp đồng sẽ làm đứt chuỗi khi đổi khách; gắn giá thuê vào phòng sẽ làm sai hóa đơn lịch sử khi tăng giá.

---

## 4. Mốc công tơ của phòng

Mỗi phòng lưu **một cặp giá trị hiện hành**: chỉ số điện và nước đang có hiệu lực — điểm bắt đầu để tính hóa đơn tiếp theo.

**Bốn nguồn ghi đè mốc** (nguyên tắc N2 nghiệp vụ hóa đơn):

| Nguồn | Khi nào |
|---|---|
| Hóa đơn nhận phòng | Admin chốt số bàn giao với khách mới |
| Hóa đơn định kỳ | Chốt số cuối kỳ hàng tháng |
| Hóa đơn trả phòng | Admin chốt số với khách chuyển đi |
| Sửa thủ công | Thay công tơ, sửa số ghi nhầm |

Lần ghi đè mới nhất luôn thắng. Mỗi lần ghi đè được ghi vào lịch sử hoạt động của phòng.

**Tiêu thụ khi phòng trống** (giữa lúc trả phòng và nhận khách mới) không thuộc hóa đơn nào — chi phí vận hành của tòa nhà. Cơ chế ghi đè mốc tự xử lý, không cần thao tác riêng.

---

## 5. Vòng đời & trạng thái phòng

```
                nhận phòng
   ┌──────────┐ ──────────▶ ┌──────────────┐
   │  TRỐNG   │             │  ĐANG THUÊ   │
   └──────────┘ ◀────────── └──────────────┘
        │         trả phòng
        │
        └──(qua Cài đặt tòa nhà)──▶  ĐÃ ARCHIVE
```

| Trạng thái | Ý nghĩa | Có hợp đồng hiệu lực? |
|---|---|---|
| **Trống** | Sẵn sàng cho thuê | Không |
| **Đang thuê** | Có khách đang ở | Có |
| **Đã archive** | Không còn cho thuê, giữ lịch sử | Không |

Trạng thái phòng **suy ra từ hợp đồng**, không set tay: có hợp đồng hiệu lực → Đang thuê; không có → Trống. Nhờ vậy không thể xảy ra tình trạng trạng thái và hợp đồng lệch nhau.

---

## 6. Yêu cầu chức năng

### FR-201 · Danh sách phòng

| | |
|---|---|
| **Xử lý** | Hiển thị toàn bộ phòng chưa archive |
| **Output** | Mỗi phòng: tên · trạng thái · tên người đại diện (nếu có) · tình trạng hóa đơn kỳ hiện tại |
| **Ưu tiên** | Must |

Phòng Trống **không hiển thị thông tin người thuê**; lịch sử khách cũ vẫn xem được trong chi tiết phòng.

### FR-202 · Chi tiết phòng

| | |
|---|---|
| **Output** | Thông tin hợp đồng · danh sách người ở · danh sách hóa đơn · lịch sử hoạt động · CTA theo trạng thái |
| **Ưu tiên** | Must |

| Trạng thái | CTA |
|---|---|
| Đang thuê | Trả phòng · Sửa hợp đồng · Xem/Tải hóa đơn · Thu tiền |
| Trống | Nhận phòng |

### FR-203 · Nhận phòng

| | |
|---|---|
| **Điều kiện** | Phòng ở trạng thái **Trống** |
| **Input** | Số người ở → danh sách tên + SĐT từng người · ngày vào · ngày hết hạn · giá thuê · **tiền cọc (bắt buộc)** · chỉ số điện/nước bàn giao |
| **Xử lý** | Tạo hợp đồng + danh sách người ở · ghi đè mốc công tơ · sinh hóa đơn nhận phòng |
| **Output** | Phòng chuyển sang Đang thuê |
| **Ưu tiên** | Must |

- **Giá thuê** điền sẵn theo giá của hợp đồng gần nhất của phòng đó (FR-209).
- **Chỉ số bàn giao** điền sẵn = mốc hiện tại của phòng, sửa được (trường hợp phòng có tiêu thụ lúc trống).

### FR-204 · Trả phòng

| | |
|---|---|
| **Điều kiện** | Phòng ở trạng thái **Đang thuê** |
| **Input** | Ngày trả · chỉ số điện/nước chốt với khách · số tiền từng khoản · số tiền hoàn cọc |
| **Xử lý** | Sinh hóa đơn trả phòng · ghi đè mốc · đóng hợp đồng |
| **Output** | Phòng chuyển sang Trống |
| **Ưu tiên** | Must |

Ngày trả **sớm hơn** ngày hết hạn hợp đồng → hiển thị cảnh báo để admin cân nhắc khi quyết định hoàn cọc. Cảnh báo mang tính nhắc nhở, **không chặn**.

### FR-205 · Quản lý danh sách người ở

| | |
|---|---|
| **Input** | Số người ở (số nguyên ≥ 1) → hệ thống sinh đúng số dòng nhập **tên + SĐT** |
| **Xử lý** | Lưu danh sách gắn với hợp đồng; đánh dấu **một người đại diện** |
| **Output** | Danh sách người ở đầy đủ; số người dùng để tính phí dịch vụ chung |
| **Ưu tiên** | Must |

- Tăng số người → thêm dòng trống ở cuối.
- Giảm số người → admin **chọn đích danh** người bị xóa, không tự cắt dòng cuối.
- Thay đổi có hiệu lực cho các lần tính tiền sau đó; hóa đơn đã lập giữ nguyên.
- Ràng buộc trường: họ tên bắt buộc với mọi người; SĐT bắt buộc riêng với người đại diện (BR-P17).

### FR-206 · Sửa thông tin hợp đồng

| | |
|---|---|
| **Input** | Giá thuê · ngày hết hạn · thông tin từng người ở |
| **Xử lý** | **Sửa đè** trực tiếp, không tạo phiên bản mới |
| **Output** | Giá trị mới áp cho các lần tính tiền sau đó |
| **Ưu tiên** | Must |

Ví dụ: giữa tháng 5 thêm một người ở → hóa đơn chốt cuối tháng 5 (dịch vụ tháng 6) tính theo số người mới; hóa đơn trước đó không đổi.

### FR-207 · Lịch sử hoạt động phòng

| | |
|---|---|
| **Output** | Dòng thời gian gộp: hóa đơn đã lập · phiếu thu · nhận phòng · trả phòng · các lần ghi đè mốc công tơ |
| **Ưu tiên** | Must |

Mỗi mục ghi rõ **thuộc về khách nào**. Hóa đơn cũ mở lại được để xem, sửa, và thu tiếp nếu chưa thu đủ.

### FR-208 · Cảnh báo hợp đồng sắp hết hạn

| | |
|---|---|
| **Xử lý** | Hợp đồng còn ≤ **15 ngày** đến ngày hết hạn → hiển thị nhắc gia hạn |
| **Output** | Thông báo kèm tên phòng, lối tắt sang màn sửa hợp đồng |
| **Ưu tiên** | Should |

Hợp đồng quá hạn mà khách vẫn ở → **không tự đóng**, vẫn lập hóa đơn bình thường, chỉ hiển thị cảnh báo.

### FR-209 · Gợi ý giá thuê khi nhận phòng

| | |
|---|---|
| **Xử lý** | Lấy giá thuê của **hợp đồng gần nhất** của phòng đó |
| **Output** | Ô giá thuê điền sẵn, admin sửa được. Phòng **chưa từng có hợp đồng → để trống**, admin nhập tay |
| **Ưu tiên** | Should |

Không lưu cột giá riêng trên phòng và không có giá mặc định ở Cài đặt — giá thuê chỉ tồn tại một nơi là hợp đồng (BR-P06, BR-P18). Hệ quả đã chấp nhận: lần thiết lập ban đầu, admin nhập giá cho từng phòng ở hợp đồng đầu tiên.

---

## 7. Quy tắc nghiệp vụ

| ID | Quy tắc |
|---|---|
| **BR-P01** | Một phòng có **tối đa một hợp đồng hiệu lực** tại một thời điểm. |
| **BR-P02** | Chỉ phòng **Trống** mới nhận khách được. |
| **BR-P03** | Chỉ phòng **Đang thuê** mới trả phòng được. |
| **BR-P04** | Trạng thái phòng **suy ra từ hợp đồng**, không set tay. |
| **BR-P05** | **Tiền cọc bắt buộc khai báo** khi nhận phòng. Được nhập 0 nếu thực tế không thu, nhưng không được bỏ trống. |
| **BR-P06** | **Giá thuê thuộc hợp đồng.** Sửa giá chỉ ảnh hưởng các lần tính tiền sau đó; hóa đơn đã lập giữ nguyên. |
| **BR-P07** | **Mốc công tơ thuộc phòng**, liên tục qua các đời khách. Nhận phòng và trả phòng đều ghi đè mốc. |
| **BR-P08** | Tiêu thụ điện nước khi phòng trống → chi phí tòa nhà, không thuộc hóa đơn nào. |
| **BR-P09** | Sửa hợp đồng là **sửa đè**, không lưu phiên bản. Cần tra ngược thì dựa vào số tiền đã snapshot trên hóa đơn. |
| **BR-P10** | Phòng Trống không hiển thị thông tin người thuê hiện tại, nhưng **lịch sử giữ đầy đủ** tên các khách cũ. |
| **BR-P11** | Hợp đồng quá hạn không tự động kết thúc. Chỉ admin trả phòng mới đóng hợp đồng. |
| **BR-P12** | **Phòng đã phát sinh hóa đơn không được đổi tên.** Mã hóa đơn snapshot số phòng tại thời điểm lập; đổi tên sẽ làm mã lệch với thực tế. Phòng chưa có hóa đơn nào thì đổi tên tự do. |
| **BR-P13** | Hợp đồng lưu **danh sách đầy đủ người ở** (tên + SĐT từng người), không chỉ số lượng. |
| **BR-P14** | Đúng **một người được đánh dấu đại diện** (mặc định là người đầu tiên). Tên người đại diện hiển thị trên hóa đơn và danh sách phòng. |
| **BR-P15** | Số người dùng tính phí dịch vụ chung = **số dòng trong danh sách người ở**. Không lưu tách rời để tránh hai nguồn sự thật. |
| **BR-P16** | Giảm số người ở → admin **chọn đích danh** người bị xóa. |
| **BR-P17** | **Họ tên bắt buộc** với mọi người ở. **SĐT bắt buộc** với người đại diện, **tùy chọn** với người còn lại. Người đại diện là đầu mối liên lạc khi thu tiền và xử lý sự cố nên phải có số; người ở cùng chỉ cần tên để tính phí và biết ai đang ở. |
| **BR-P18** | Gợi ý giá thuê chỉ áp dụng **từ hợp đồng thứ hai trở đi** của phòng. Hợp đồng đầu tiên: ô giá để trống, admin nhập tay. **Không** có trường giá mặc định ở Cài đặt tòa nhà — giá thuê giữ đúng một nguồn là hợp đồng. |

---

## 8. User story & Acceptance Criteria

### US-21 · Nhận khách mới vào phòng trống
*Là admin, tôi muốn đăng ký khách mới kèm danh sách người ở và chốt số công tơ, để bắt đầu tính tiền chính xác.*

- **AC-21.1** — Given phòng P503 ở trạng thái Trống, When mở chi tiết phòng, Then hiển thị CTA "Nhận phòng" và không hiển thị thông tin người thuê.
- **AC-21.2** — Given form nhận phòng, When admin nhập số người ở = 3, Then hệ thống hiển thị đúng 3 dòng nhập tên + SĐT.
- **AC-21.3** — Given 3 dòng người ở, Then dòng đầu tiên mặc định được đánh dấu là người đại diện; admin đổi được sang người khác.
- **AC-21.4** — Given admin bỏ trống ô tiền cọc, When lưu, Then chặn và báo bắt buộc nhập (BR-P05).
- **AC-21.5** — Given phòng P503 từng có hợp đồng giá 4.200.000, When mở form nhận phòng, Then ô giá thuê điền sẵn 4.200.000 và sửa được (FR-209).
- **AC-21.6** — Given mốc hiện tại của phòng là điện 5033, Then ô chỉ số bàn giao điền sẵn 5033 và sửa được.
- **AC-21.7** — Given admin hoàn tất nhận phòng với số bàn giao 5040, Then phòng chuyển sang Đang thuê, mốc phòng thành 5040, sinh hóa đơn nhận phòng, và lịch sử có thêm mục nhận phòng kèm tên người đại diện.
- **AC-21.8** — Given form người ở, When bỏ trống họ tên của bất kỳ người nào, Then chặn lưu và báo lỗi tại đúng dòng (BR-P17).
- **AC-21.9** — Given bỏ trống SĐT của **người đại diện**, Then chặn lưu. Given bỏ trống SĐT của người ở cùng, Then vẫn lưu được (BR-P17).
- **AC-21.10** — Given phòng **chưa từng có hợp đồng nào**, When mở form nhận phòng, Then ô giá thuê để trống (BR-P18).

### US-22 · Trả phòng
*Là admin, tôi muốn tất toán khi khách chuyển đi, để chốt số và xử lý cọc dứt điểm.*

- **AC-22.1** — Given phòng Đang thuê, When mở CTA Trả phòng, Then form hiển thị chỉ số đầu = mốc hiện tại và ô nhập chỉ số chốt.
- **AC-22.2** — Given ngày trả sớm hơn ngày hết hạn hợp đồng, Then hiển thị cảnh báo nhắc cân nhắc hoàn cọc; **không chặn** thao tác.
- **AC-22.3** — Given admin hoàn tất trả phòng, Then hợp đồng đóng, phòng chuyển sang Trống, mốc phòng cập nhật theo số vừa chốt.
- **AC-22.4** — Given phòng vừa chuyển sang Trống, When xem chi tiết phòng, Then không hiển thị thông tin người thuê nhưng lịch sử vẫn có đầy đủ tên khách cũ (BR-P10).

### US-23 · Chuyển giao khách giữa tháng
*Là admin, tôi muốn phòng có khách cũ đi và khách mới đến trong cùng tháng vẫn tính đúng cho từng người.*

- **AC-23.1** — Given P503 có khách A trả phòng ngày 20/9 với số chốt 4180, và khách B nhận phòng ngày 22/9 với số bàn giao 4184, Then hóa đơn của A tính đến 4180, hóa đơn của B bắt đầu từ 4184.
- **AC-23.2** — Then phần chênh lệch 4 số giữa hai mốc **không xuất hiện trên hóa đơn nào** (BR-P08).
- **AC-23.3** — Then lịch sử phòng hiển thị tách bạch các mục của khách A và khách B, ghi rõ mục nào của ai.

### US-24 · Sửa hợp đồng và danh sách người ở
*Là admin, tôi muốn cập nhật giá thuê hoặc người ở khi có thay đổi, mà không làm sai hóa đơn cũ.*

- **AC-24.1** — Given hợp đồng đang có 1 người ở, When admin thêm 1 người giữa tháng 5, Then hóa đơn chốt cuối tháng 5 tính dịch vụ chung theo 2 người.
- **AC-24.2** — Given đã có hóa đơn tính theo 1 người, When admin thêm người, Then hóa đơn cũ **không thay đổi** (BR-P06).
- **AC-24.3** — Given hợp đồng có 3 người ở, When admin giảm xuống 2, Then hệ thống yêu cầu chọn đích danh người bị xóa (BR-P16).
- **AC-24.4** — Given admin xóa người đang là đại diện, Then bắt buộc chọn người đại diện mới trước khi lưu (BR-P14).
- **AC-24.5** — Given admin gia hạn ngày hết hạn hợp đồng, Then cảnh báo sắp hết hạn tắt đi.

### US-25 · Theo dõi hợp đồng sắp hết hạn
*Là admin, tôi muốn được nhắc khi hợp đồng gần hết hạn, để chủ động gia hạn hoặc tìm khách mới.*

- **AC-25.1** — Given hợp đồng hết hạn sau 10 ngày, Then danh sách phòng hiển thị cảnh báo gia hạn kèm tên phòng.
- **AC-25.2** — Given hợp đồng hết hạn sau 20 ngày, Then **chưa** hiển thị cảnh báo (ngưỡng 15 ngày).
- **AC-25.3** — Given hợp đồng đã quá hạn nhưng khách vẫn ở, Then hợp đồng vẫn hiệu lực, phòng vẫn lập hóa đơn bình thường, và cảnh báo vẫn hiển thị (BR-P11).

---

## 9. Màn hình

### 9.1 Danh sách phòng

```
┌─────────────────────────────────────────────┐
│  190 Nguyễn Trãi        20 phòng · 18 thuê  │
├─────────────────────────────────────────────┤
│  ⚠ HĐ phòng P302 hết hạn 12/09 — gia hạn    │
├─────────────────────────────────────────────┤
│  P802  Đỗ Minh Dũng      Chưa thu   4.847k  │
│  P801  Lê Thị Bình       Đã thu     4.210k  │
│  P503  — Trống —         Sẵn sàng cho thuê  │
│  …                                          │
└─────────────────────────────────────────────┘
```

### 9.2 Chi tiết phòng (Đang thuê)

Bốn khối: **thông tin hợp đồng** (thời hạn, giá thuê, cọc — có nút Sửa) · **danh sách người ở** (tên + SĐT, đánh dấu người đại diện) · **danh sách hóa đơn** (mới nhất trên cùng, mỗi dòng có trạng thái thu và lối vào Xem/Tải/Thu tiền) · **lịch sử hoạt động**.

### 9.3 Chi tiết phòng (Trống)

Không hiển thị khối hợp đồng và người ở. Hiển thị mốc công tơ hiện tại, CTA Nhận phòng, và lịch sử hoạt động của các khách cũ.

### 9.4 Form nhập người ở

Nhập **số người trước**, hệ thống sinh đúng số dòng tương ứng, mỗi dòng gồm tên và SĐT. Người đầu tiên mặc định là đại diện, đổi được. Giảm số người thì mở bước chọn người bị xóa.

**Quy ước chung:** mobile-first · nhận phòng và trả phòng mở form riêng, không xử lý inline.

---

## 10. Dữ liệu

| Bảng | Trường liên quan |
|---|---|
| `rooms` | `code`, `current_elec`, `current_water`, `archived` — **không có** cột giá thuê, **không có** cột trạng thái (suy từ hợp đồng) |
| `contracts` | `start_date`, `end_date`, `deposit`, `rent`, `active` |
| `contract_occupants` | `contract_id`, `full_name`, `phone`, `is_primary` — **bảng mới** |
| `invoices` | gắn theo `room_id` + `contract_id` |
| `meter_mark_logs` | lịch sử ghi đè mốc của phòng |
| `receipts` | phiếu thu, gắn theo hóa đơn |

**Ràng buộc ở tầng cơ sở dữ liệu (không chỉ kiểm ở ứng dụng):**
- Tối đa một hợp đồng hiệu lực trên mỗi phòng — unique index có điều kiện.
- Tối đa một người đại diện trên mỗi hợp đồng — unique index có điều kiện.
- Số người ở = đếm `contract_occupants`, không lưu cột riêng (BR-P15).

---

## 11. Hạng mục đã xác nhận

| No | Hạng mục | Kết luận |
|---|---|---|
| 1 | Đổi tên phòng đã có hóa đơn | Không cho phép (BR-P12, BR-S10) |
| 2 | Thông tin người ở | Lưu danh sách đầy đủ; tên bắt buộc mọi người, SĐT bắt buộc riêng người đại diện (BR-P13, BR-P17) |
| 3 | Khôi phục phòng đã archive | Không có ở v1 |
| 4 | Ngưỡng cảnh báo hết hạn | 15 ngày (FR-208) |
| 5 | Trạng thái Bảo trì | Bỏ — chỉ còn Đang thuê / Trống, suy ra từ hợp đồng (BR-P04) |
| 6 | Giá thuê mặc định ở Cài đặt | Không làm. Gợi ý chỉ từ hợp đồng thứ hai trở đi (BR-P18) |

## 12. Ma trận truy vết

| Chủ đề | FR | BR | US / AC |
|---|---|---|---|
| Danh sách & chi tiết phòng | FR-201, FR-202 | BR-P04, BR-P10 | AC-21.1, AC-22.4 |
| Nhận phòng | FR-203 | BR-P02, BR-P05, BR-P07 | US-21 |
| Trả phòng | FR-204 | BR-P03, BR-P07 | US-22 |
| Chuyển giao giữa tháng | FR-203, FR-204 | BR-P07, BR-P08 | US-23 |
| Danh sách người ở | FR-205 | BR-P13, BR-P14, BR-P15, BR-P16 | AC-21.2, AC-21.3, AC-24.3, AC-24.4 |
| Sửa hợp đồng | FR-206 | BR-P01, BR-P06, BR-P09 | US-24 |
| Lịch sử hoạt động | FR-207 | BR-P10 | AC-21.7, AC-23.3 |
| Cảnh báo hết hạn 15 ngày | FR-208 | BR-P11 | US-25 |
| Gợi ý giá thuê | FR-209 | BR-P06, BR-P18 | AC-21.5, AC-21.10 |
| Ràng buộc trường người ở | FR-205 | BR-P17 | AC-21.8, AC-21.9 |
| Đổi tên phòng | — | BR-P12 | — (thuộc SRS Cài đặt tòa nhà) |
