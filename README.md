# SBDCs - Single Hospital Blood Donation System

Phiên bản này đã được đơn giản hóa theo hướng **1 hospital duy nhất**.

## Thay đổi chính

- Bỏ giao diện nhiều trung tâm hiến máu / donation centers.
- Bỏ Google Maps, lat/lng, distance score và chọn điểm gần nhất.
- Đăng nhập nhanh chỉ bằng số điện thoại, không OTP, không password.
- Hệ thống chỉ còn 2 giao diện: Donor và Hospital.
- Thêm Emergency Mode khi nhóm máu xuống dưới mức nguy hiểm.
- Thêm Reliability Score cho người hiến.
- Thêm Eligibility Countdown theo chu kỳ 84 ngày sau lần hiến gần nhất.
- Thêm Achievement System: Bronze, Silver, Gold, Platinum.
- Thêm Donation Impact Message sau khi hiến máu.

## Tài khoản demo

Hospital:

```text
0900000001
```

Donor:

```text
0900000002
```

Số điện thoại mới sẽ được tự tạo thành tài khoản Donor.

## Chạy backend

Từ thư mục gốc project:

```bash
conda activate sbdc
python -m uvicorn backend.main:app --reload
```

Backend chạy tại:

```text
http://127.0.0.1:8000
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

## Chạy frontend

Từ thư mục chứa `package.json`:

```bash
npm install
npm start
```

Frontend chạy tại:

```text
http://localhost:5173
```

## Flow demo đề xuất

1. Đăng nhập Donor bằng `0900000002`.
2. Tạo lịch hiến máu.
3. Đăng xuất, đăng nhập Hospital bằng `0900000001`.
4. Duyệt lịch: PENDING → APPROVED → CHECKED_IN → IN_PROGRESS → COMPLETED.
5. Đăng nhập lại Donor.
6. Vào Appointments và mở màn hình Congratulations.
7. Kiểm tra Dashboard: điểm nhân đạo, achievement, countdown, impact message.
8. Vào Inventory bằng Hospital để xem Emergency Mode.

## Recommendation mới

Không còn DistanceScore.

```text
Score = w1 * BloodMatch + w2 * Eligibility + w3 * Reliability + w4 * HumanitarianPoints
```

Điều này phù hợp với tinh thần: giảm rào cản, khuyến khích hiến máu nhân đạo.

## Avatar upload

Trang Profile hỗ trợ đổi ảnh đại diện:

- Frontend: chọn ảnh trong Profile và bấm `Lưu ảnh đại diện`.
- Backend API: `POST /api/auth/profile/avatar` với `multipart/form-data`, field `file`.
- Ảnh được lưu tại `uploads/avatars/` và được truy cập qua `/uploads/avatars/<filename>`.
- Hỗ trợ JPG, PNG, WEBP, GIF; tối đa 3MB.


## Hospital: Export donor list to Excel

Hospital Admin can download an Excel file from the Dashboard using the **Export Donors Excel** button.

The exported file includes donor name, phone, blood type, reliability score, humanitarian points, total donations, appointment statistics, eligibility countdown, and achievement badge.

API endpoint:

```text
GET /api/analytics/donors/export
```

## Login update

- Donor login: phone number only, no OTP/password. Demo donor: `0900000002`.
- Hospital login: email or phone + encrypted password. Demo hospital:
  - Email: `hospital@sbdcs.com`
  - Phone: `0900000001`
  - Password: `Admin@123`

## Layout update

The left sidebar is fixed. Only the main content area scrolls.

## Smart Assistant for Donor

Bản này bổ sung tab **Smart Assistant** cho Donor. Chatbot trả lời tự động dựa trên dữ liệu nội bộ, không gọi AI bên ngoài.

Các câu hỏi hỗ trợ:
- Lịch hẹn của tôi khi nào?
- Tôi có đủ điều kiện hiến máu không?
- Khi nào tôi được hiến lại?
- Bệnh viện đang cần nhóm máu nào?
- Điểm nhân đạo và huy hiệu của tôi?

API mới:
- `POST /api/chatbot/ask`
- `GET /api/chatbot/history`
- `GET /api/chatbot/suggestions`

Database mới:
- `chat_messages` để lưu lịch sử chat giữa Donor và bot.

## Smart Assistant FAQ mở rộng

Smart Assistant hiện hỗ trợ thêm các câu hỏi Donor thường thắc mắc:

- Quy trình đăng ký hiến máu ra sao?
- Tôi cần chuẩn bị gì trước khi hiến máu?
- Khi đến hiến máu cần mang giấy tờ gì?
- Sau khi hiến máu cần lưu ý gì?
- Nếu chưa biết nhóm máu thì sao?
- Các trạng thái lịch hẹn có ý nghĩa gì?
- Thông tin bệnh viện ở đâu?

Bot hoạt động theo hướng **Data-driven Rule-based Assistant**: một số câu trả lời lấy từ dữ liệu thật như lịch hẹn, kho máu, nhóm máu, điểm nhân đạo; một số câu trả lời là FAQ nghiệp vụ cố định để hỗ trợ Donor nhanh hơn.
