## Project Proposal

## THÔNG TIN

### Nhóm

- Thành viên 1: Võ Minh Trí - 23720331
- Thành viên 2: Trần Gia Vỹ - 23715831
- Thành viên 3: Lê Thị Hồng Yến - 23712271

---

## HỆ THỐNG KẾT NỐI & QUẢN LÝ HIẾN MÁU NHÂN ĐẠO THÔNG MINH  
**Smart Blood Donation Connection system – SBDCs**

---

### 1. Ý tưởng

- **Tên dự án**: HỆ THỐNG KẾT NỐI & QUẢN LÝ HIẾN MÁU NHÂN ĐẠO THÔNG MINH (Smart Blood Donation Connection system – SBDCs).
- **Mục tiêu**: Xây dựng nền tảng web đóng vai trò “cầu nối” thông minh giữa **Người hiến máu** và **Đơn vị tiếp nhận máu** (Bệnh viện, Viện Huyết học, Trung tâm hiến máu…).

Hệ thống tập trung giải quyết bài toán thiếu hụt máu điều trị thông qua hai trụ cột chính:

1. **Quản lý Ngân hàng máu thông minh**  
   Theo dõi dự trữ máu, cảnh báo thiếu hụt sớm và đề xuất kế hoạch bổ sung phù hợp cho từng nhóm máu.

2. **Khuyến nghị người hiến (Recommendation System)**  
   Kết nối đúng người hiến phù hợp tại đúng thời điểm, dựa trên nhóm máu, vị trí địa lý và lịch sử hiến.

---

### 2. Động lực & Điểm khác biệt

- **Lý do chọn đề tài**  
  - Nhiều bệnh viện thường xuyên thiếu máu dự trữ cho cấp cứu, ảnh hưởng trực tiếp đến tính mạng bệnh nhân.  
  - Nhiều người sẵn sàng hiến máu nhưng: thiếu thông tin, ngại thủ tục, không biết điểm hiến máu gần nhất hoặc thời gian phù hợp.  
  - Dự án hướng tới **số hóa quy trình**, **tối ưu hóa nguồn cung máu cho điều trị** và **xóa bỏ rào cản tâm lý** cho người hiến máu.

- **Điểm khác biệt so với hệ thống hiện có**
  - **Tính chủ động (Proactive)**  
    SBDCs không chỉ lưu trữ dữ liệu thụ động mà còn **dự báo nhu cầu sử dụng máu** và **cảnh báo sớm** khi Ngân hàng máu sắp chạm ngưỡng nguy hiểm.
  - **Matching thông minh**  
    Thay vì gửi thông báo hàng loạt (dễ gây spam), hệ thống dùng **Recommendation Engine** để chọn ra **danh sách người hiến phù hợp nhất** (nhóm máu, khoảng cách, thời điểm đủ điều kiện hiến, độ tin cậy).
  - **Trải nghiệm cá nhân hóa & Gamification**  
    - Dashboard sức khỏe, lịch sử hiến cho từng người.  
    - **Điểm nhân đạo**, **huy hiệu**, **mốc thành tựu**, phần quà ngẫu nhiên khi đạt và duy trì mốc điểm.
  - **Giá trị nhân văn**  
    Tạo cộng đồng hiến máu bền vững, được ghi nhận, khuyến khích giới trẻ tham gia thường xuyên.

---

## PHÂN TÍCH & THIẾT KẾ HỆ THỐNG

### 1. Tác nhân (Actors)

- **Người hiến máu (Donor)**  
  - Đăng ký tài khoản, cập nhật thông tin cá nhân.  
  - Theo dõi lịch sử và sức khỏe liên quan đến hiến máu.  
  - Tìm điểm hiến máu gần nhất, đặt lịch hẹn.  
  - Nhận thông báo kêu gọi hiến máu (đặc biệt với nhóm máu hiếm/khẩn cấp).

- **Đơn vị tiếp nhận (Hospital/Admin)**  
  - Quản lý Ngân hàng máu (nhập/xuất, dự trữ theo nhóm máu).  
  - Cấu hình ngưỡng an toàn cho từng nhóm máu.  
  - Duyệt lịch hẹn hiến máu và cập nhật trạng thái.  
  - Kích hoạt huy động và sử dụng hệ thống khuyến nghị người hiến.

- **Hệ thống (System)**  
  - Tự động theo dõi tình trạng Ngân hàng máu, sinh cảnh báo.  
  - Chạy thuật toán dự báo nhu cầu máu.  
  - Tính điểm và đề xuất danh sách người hiến phù hợp.

---

### 2. Chức năng chính

#### 2.1. Chức năng cho Người hiến máu (Donor)

- **Đăng ký/Đăng nhập & Phân quyền**  
  - Đăng ký tài khoản với thông tin cơ bản, mật khẩu được mã hóa.  
  - Phân quyền `Donor`, `Hospital_Admin`, có thể mở rộng `System_Admin`.

- **Khai báo & Sàng lọc sức khỏe trực tuyến**  
  - Trả lời bộ câu hỏi sàng lọc (tuổi, cân nặng, bệnh nền, lần hiến gần nhất, thuốc đang dùng, v.v.).  
  - Hệ thống đánh giá sơ bộ (đủ điều kiện/không đủ điều kiện/tạm hoãn).  
  - Nếu chưa biết nhóm máu → chọn "Chưa xác định" và được đề xuất đến xét nghiệm tại điểm hiến.

- **Tìm kiếm điểm hiến máu (Map)**  
  - Tích hợp Google Maps API.  
  - Hiển thị các điểm hiến máu dưới dạng marker với khoảng cách tương đối so với vị trí người dùng.

- **Đặt lịch hiến máu**  
  - Chọn điểm hiến, ngày giờ, khung giờ phù hợp.  
  - Gửi yêu cầu và theo dõi trạng thái: `PENDING` → `APPROVED` → `CHECKED_IN` → `COMPLETED`.

- **Dashboard sức khỏe & Gamification**  
  - Hiển thị:
    - Tổng số lần hiến máu, ngày hiến gần nhất, **đếm ngược đến ngày đủ điều kiện hiến tiếp theo**.  
    - **Điểm nhân đạo**, **huy hiệu**, **cấp bậc** (ví dụ: Đồng, Bạc, Vàng, Bạch kim).  
  - Khi đạt mốc điểm nhất định và duy trì trong thời gian quy định → nhận quà/huy hiệu.

- **Nhận thông báo huy động hiến máu**  
  - Khi Ngân hàng máu thiếu nhóm máu phù hợp, Donor nhận thông báo mời hiến (email/notification).

---

#### 2.2. Chức năng cho Admin/Đơn vị tiếp nhận (Hospital/Admin)

- **Quản lý Ngân hàng máu (Blood Bank Management)**  
  - CRUD bản ghi dự trữ máu theo nhóm:
    - `blood_type`, `current_quantity`, `safety_stock`.  
  - Hiển thị cảnh báo trực quan:
    - Xanh: an toàn.  
    - Vàng: tiệm cận ngưỡng.  
    - Đỏ: **Critical Alert** – cần huy động gấp.  
  - Có thể lưu **lịch sử thay đổi**: ai cập nhật, thời điểm cập nhật (audit log đơn giản).

- **Cấu hình ngưỡng an toàn (Safety Stock Config)**  
  - Đặt ngưỡng tối thiểu cho từng nhóm máu.  
  - Cho phép thay đổi linh hoạt khi nhu cầu điều trị tăng/giảm.

- **Dashboard quản trị & Dự báo**  
  - Biểu đồ:
    - **Bar chart**: dự trữ máu hiện tại theo từng nhóm.  
    - **Line chart**: lịch sử sử dụng máu theo tháng + đường dự báo nhu cầu tháng tới.  
  - Thông tin tổng quan:
    - Số lịch hẹn hiến máu hôm nay.  
    - Số nhóm máu đang trong vùng cảnh báo.  
    - Số người hiến tiềm năng trong bán kính X km (dựa vào Recommendation).

- **Quản lý lịch hẹn hiến máu**  
  - Xem danh sách lịch hẹn chờ duyệt.  
  - Duyệt/huỷ lịch, cập nhật trạng thái:  
    - `PENDING` → `APPROVED` → `CHECKED_IN` → `IN_PROGRESS` → `COMPLETED`/`CANCELLED`.

- **Huy động người hiến (Recommendation)**  
  - Chọn:
    - Nhóm máu cần huy động.  
    - Khu vực (bán kính theo tọa độ).  
    - Thời gian mong muốn (trong ngày/xuất hiện tại điểm hiến trong X ngày tới).  
  - Hệ thống trả về **danh sách được khuyến nghị** (Top N Donor phù hợp nhất) kèm chi tiết điểm.

---

### 3. Thiết kế cơ sở dữ liệu (Database Design)

Các bảng dữ liệu chính dự kiến:

- **`Users`**  
  - Thông tin người dùng (Donor/Admin).  
  - Gợi ý thuộc tính:
    - `id` (PK)  
    - `name`  
    - `email`, `password_hash`  
    - `phone`  
    - `blood_type` (cho phép `Unknown`)  
    - `lat`, `lng`  
    - `reliability_score` (điểm tin cậy – ít bùng kèo, đến đúng hẹn)  
    - `total_donations`  
    - `humanitarian_points`  
    - `role` (`DONOR`, `HOSPITAL_ADMIN`, `SYSTEM_ADMIN`)  
    - `created_at`, `updated_at`

- **`Hospitals`**  
  - Thông tin đơn vị tiếp nhận, điểm hiến máu:
    - `id` (PK)  
    - `name`  
    - `address`  
    - `lat`, `lng`  
    - `contact_phone`, `contact_email`  
    - `status` (hoạt động/tạm ngưng)

- **`Blood_Bank`** (Ngân hàng máu – dự trữ theo nhóm)  
  - Quản lý mức dự trữ máu:
    - `id` (PK)  
    - `hospital_id` (FK → `Hospitals`)  
    - `blood_type`  
    - `current_quantity`  
    - `safety_stock`  
    - `updated_at`

- **`Inventory_Transactions`** (Giao dịch Ngân hàng máu)  
  - Lịch sử nhập/xuất dùng cho thống kê và dự báo:
    - `id` (PK)  
    - `hospital_id` (FK)  
    - `blood_type`  
    - `quantity` (dương: nhập, âm: xuất)  
    - `transaction_type` (`IN`, `OUT`)  
    - `note` (lý do: hiến máu, dùng điều trị, điều chuyển, hủy…)  
    - `created_at`

- **`Appointments`**  
  - Quản lý lịch hẹn hiến máu:
    - `id` (PK)  
    - `user_id` (FK → `Users`)  
    - `hospital_id` (FK → `Hospitals`)  
    - `appointment_time`  
    - `status` (`PENDING`, `APPROVED`, `CHECKED_IN`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`)  
    - `pre_screening_result` (đạt/không đạt/tạm hoãn)  
    - `created_at`, `updated_at`

- **`Recommendation_Results`**  
  - Lưu kết quả chạy Recommendation:
    - `id` (PK)  
    - `hospital_id` (FK)  
    - `blood_type` (nhóm máu cần huy động)  
    - `requested_at`  
    - `user_id` (FK → `Users`)  
    - `score` (điểm tổng hợp)  
    - `invitation_status` (`SENT`, `ACCEPTED`, `DECLINED`, `NO_RESPONSE`)

- **(Tuỳ chọn) `Audit_Logs`**  
  - Ghi lại các thao tác nhạy cảm (sửa Ngân hàng máu, ngưỡng an toàn):
    - `id` (PK)  
    - `user_id` (ai thao tác)  
    - `action`  
    - `target_type`, `target_id`  
    - `old_value`, `new_value`  
    - `created_at`

---

### 4. Thuật toán xử lý (Algorithms)

#### 4.1. Thuật toán dự báo nhu cầu máu (Demand Forecasting)

- **Mục tiêu**:  
  Dự đoán nhu cầu sử dụng máu tháng tiếp theo cho từng nhóm máu tại mỗi đơn vị tiếp nhận, giúp:
  - Chủ động huy động người hiến.  
  - Giảm nguy cơ thiếu máu đột xuất trong Ngân hàng máu.

- **Phương pháp**: **Trung bình động (Moving Average)**

Giả sử M1, M2, M3 là lượng máu đã xuất dùng trong 3 tháng gần nhất (theo từng nhóm máu).

Công thức dự báo:

`Forecast = (M1 + M2 + M3) / 3`
- Có thể cấu hình **N tháng gần nhất** (3, 6, …) để tăng/giảm độ nhạy của dự báo.

- **Ứng dụng kết quả**:
  - So sánh `Forecast` với `current_quantity` và `safety_stock`.  
  - Xác định **mức rủi ro** (Thấp/Trung bình/Cao), hỗ trợ quyết định có cần huy động hay không.  
  - Hiển thị trực quan trên Dashboard bằng biểu đồ.

> Ghi chú: Với phạm vi đồ án, Moving Average là thuật toán phù hợp, dễ cài đặt và dễ giải thích. Trong phần “Hạn chế & Hướng phát triển”, có thể đề xuất mở rộng sang ARIMA, mô hình ML nâng cao.

---

#### 4.2. Thuật toán khuyến nghị người hiến (Recommendation Engine)

- **Mục tiêu**:  
  Khi Ngân hàng máu thiếu một nhóm máu nhất định, hệ thống chọn ra **danh sách người hiến phù hợp nhất** thay vì gửi thông báo hàng loạt.

- **Yếu tố chấm điểm**:
  - **BloodMatch**: mức độ phù hợp nhóm máu (tương thích 0/1 hoặc nhiều mức).
  - **DistanceScore**: điểm dựa trên khoảng cách địa lý giữa Donor và điểm hiến.
  - **Eligibility**: mức độ sẵn sàng hiến (đã đủ ngày kể từ lần hiến gần nhất, sàng lọc sức khỏe đạt…).
  - **Reliability**: độ tin cậy (tỷ lệ đến đủ hẹn, ít huỷ/bùng kèo).

- **Công thức Weighted Scoring**:

`Score = w1 * BloodMatch + w2 * DistanceScore + w3 * Eligibility + w4 * Reliability`
Trong đó \(w_1, w_2, w_3, w_4\) là trọng số (tổng có thể chuẩn hóa về 1), có thể cấu hình tùy ưu tiên (ưu tiên nhóm máu phù hợp, ưu tiên gần, ưu tiên người uy tín…).

- **Quy trình**:
  1. Admin chọn nhóm máu, khu vực, khoảng thời gian mong muốn.  
  2. Hệ thống lọc những Donor phù hợp điều kiện cơ bản (nhóm máu, đã đủ thời gian hiến lại).  
  3. Tính `Score` cho từng Donor.  
  4. Sắp xếp giảm dần theo `Score`, trả về Top N.  
  5. Lưu kết quả vào `Recommendation_Results` để tra cứu & thống kê.

- **Hiển thị cho Admin**:
  - Bảng danh sách Top N kèm chi tiết:  
    - Khoảng cách ước tính.  
    - Lịch sử hiến.  
    - Điểm nhân đạo, điểm tin cậy.  
  - Nút gửi thông báo mời hiến đến từng người hoặc gửi hàng loạt cho danh sách được chọn.

---

## KẾ HOẠCH TRIỂN KHAI

### 1. Phiên bản MVP (Dự kiến hoàn thành: 12.04.2026)

**Phạm vi chức năng:**

- **Module Quản lý người dùng & Đăng ký**  
  - Đăng ký/Đăng nhập Donor & Admin.  
  - Cập nhật thông tin cá nhân cơ bản, phân quyền.

- **Module Quản lý Ngân hàng máu cơ bản**  
  - CRUD `Blood_Bank`.  
  - Cảnh báo khi `current_quantity < safety_stock`.

- **Module Đặt lịch hiến máu & Tìm kiếm bản đồ**  
  - Tìm điểm hiến máu gần nhất bằng Google Maps API.  
  - Đặt lịch hẹn, xem lịch sử lịch hẹn.

- **Dashboard Admin cơ bản**  
  - Thống kê dự trữ máu theo nhóm.  
  - Danh sách lịch hẹn chờ duyệt.

**Kế hoạch kiểm thử:**

- **Unit Test**  
  - Kiểm thử các hàm tính toán ngưỡng, kiểm tra cảnh báo.

- **Manual Test (End-to-End)**  
  - Luồng Donor:
    - Đăng ký → Sàng lọc → Tìm điểm hiến → Đặt lịch → Nhận xác nhận.  
  - Luồng Admin:
    - Duyệt lịch → Cập nhật trạng thái → Ghi nhận hoàn thành.

**Chức năng dự kiến cho Phase tiếp theo:**

- Triển khai **thuật toán Dự báo nhu cầu**.  
- Triển khai **thuật toán Khuyến nghị người hiến**.  
- Bổ sung **Gamification** (huy hiệu, bảng xếp hạng, quà tặng).

---

### 2. Phiên bản Beta

- **Kiểm thử & Tối ưu**  
  - Tổng hợp kết quả Unit Test + Manual Test.  
  - Sửa lỗi, tối ưu hiệu năng khi nhiều người truy cập.  

- **Tài liệu & Báo cáo kỹ thuật**  
  - Tài liệu hướng dẫn sử dụng cho Donor & Admin.  
  - Báo cáo:
    - Kiến trúc hệ thống.  
    - Thiết kế CSDL.  
    - Mô tả thuật toán (Forecast + Recommendation).  
    - Quy trình kiểm thử, lỗi thường gặp & cách khắc phục.

- **Thời hạn hoàn thành dự kiến**: 10.05.2026.

---

## CÁC CÂU HỎI TRAO ĐỔI VỚI GIẢNG VIÊN

- **Câu hỏi **  
  *Việc sử dụng thuật toán dự báo đơn giản (Moving Average) cho nhu cầu máu có đủ độ tin cậy để được đánh giá tốt về mặt kỹ thuật trong phạm vi đồ án không, hay em nên cân nhắc bổ sung/so sánh với một mô hình phức tạp hơn như ARIMA (ở mức mô tả/ý tưởng)?*

---
