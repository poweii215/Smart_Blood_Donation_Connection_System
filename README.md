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
