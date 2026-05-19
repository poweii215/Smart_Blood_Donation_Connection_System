<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/aa781c78-41b2-4e1f-9853-593fc1f17ad8

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Update: Phone Login + Blood Donation Core Features

### Authentication
- Login now uses `phone only` instead of `email + password`.
- Registration requires `phone`, `full_name`, `password`, `role`, and optional `email`.
- Supported roles: `DONOR` and `HOSPITAL_ADMIN` only. The UI has two main modes: Donor and Hospital.
- Demo accounts after database initialization:
  - Hospital: `0900000001`
  - Donor: `0900000002`

### Added/Extended Backend Features
- Phone-based auth API: `/api/auth/register`, `/api/auth/login`.
- Profile update supports phone, blood type, and coordinates.
- Blood bank inventory still supports CRUD-style update with audit log.
- Added `recommendation_results` table.
- Added analytics endpoints:
  - `GET /api/analytics/summary`
  - `GET /api/analytics/forecast?months=3`
  - `POST /api/analytics/recommendations`

### Algorithms
- Demand forecasting uses configurable moving average over recent OUT transactions.
- Recommendation engine uses weighted scoring:
  - Blood match
  - Distance score using Haversine distance
  - Eligibility based on last donation date
  - Reliability score

### Frontend Changes
- Login screen now uses phone number only; Register still collects account details.
- Donor can select `Chưa xác định` for blood type.
- Profile shows and edits phone number.
- Only Donor and Hospital interfaces are shown in protected routes and navigation.

## Cập nhật đăng nhập OTP

Luồng đăng nhập hiện tại dùng 2 bước:

1. Nhập số điện thoại tại màn hình Login.
2. Hệ thống gọi `POST /api/auth/request-otp` để tạo OTP 6 số.
3. Người dùng nhập OTP, hệ thống gọi `POST /api/auth/verify-otp` để cấp token.

Trong môi trường demo/local, OTP được trả về trong response và in ra console backend để dễ kiểm thử. Khi triển khai thật, thay phần này bằng dịch vụ gửi SMS như Twilio, Firebase Authentication hoặc Zalo/SMS Gateway và không trả `otp_code` về frontend.
