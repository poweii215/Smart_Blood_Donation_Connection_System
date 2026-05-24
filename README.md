# SBDCs — Single Hospital Blood Donation System

Phiên bản hoàn chỉnh đã kiểm tra lại cấu trúc project, build frontend và compile backend.

## 1. Điểm đã hoàn thiện

### Donor
- Đăng nhập nhanh bằng số điện thoại.
- Dashboard người hiến máu.
- Đặt lịch hiến máu.
- Theo dõi trạng thái lịch hẹn.
- Donor Journey: Registered → Approved → Checked In → Donated → Recovery → Eligible Again.
- Smart Assistant trả lời FAQ và dữ liệu thật của hospital.
- Notification Center.
- Congratulations screen sau khi hiến xong.
- Settings riêng cho Donor: thông tin cá nhân, avatar, thông báo, tùy chọn hiến máu, giao diện sáng/tối, ngôn ngữ.

### Hospital
- Đăng nhập bằng email/số điện thoại + mật khẩu đã mã hóa.
- Dashboard quản trị.
- Quản lý kho máu.
- Emergency Mode.
- Recommendation Engine với adaptive weighting.
- Reports/Export Excel có lọc loại danh sách.
- Analytics: monthly donation, most needed blood types, donor retention, appointment completion rate.
- Notification Center.
- Settings riêng cho Hospital: thông tin tài khoản, ảnh trang chủ, cảnh báo kho máu, trọng số recommendation, export preferences, giao diện sáng/tối, ngôn ngữ.

## 2. Tài khoản demo

### Donor
```text
0900000002
```

### Hospital
```text
Email: hospital@sbdcs.com
Phone: 0900000001
Password: Admin@123
```

## 3. Yêu cầu môi trường

Khuyến nghị:
- Python 3.10+
- Node.js LTS 20 hoặc 22
- Không khuyến nghị Node 24 vì có thể gây lỗi npm `Exit handler never called`.

## 4. Chạy Backend

Mở terminal 1:

```bash
cd C:\Users\ADMIN\SBDCs
conda activate sbdc
python -m uvicorn backend.main:app --reload
```

Backend chạy tại:

```text
http://127.0.0.1:8000
```

Swagger API:

```text
http://127.0.0.1:8000/docs
```

## 5. Chạy Frontend

Mở terminal 2:

```bash
cd C:\Users\ADMIN\SBDCs\frontend
npm install
npm run dev
```

Frontend chạy tại:

```text
http://localhost:3000
```

## 6. Không nên chạy chung khi demo

File này đã chỉnh `npm run dev` chỉ chạy frontend để tránh lỗi `concurrently` trên Windows.

Nếu thật sự muốn chạy cả backend + frontend cùng lúc:

```bash
npm run dev:all
```

Nhưng khi demo nên chạy 2 terminal riêng cho ổn định.

## 7. Lưu ý database

Nếu đổi từ ZIP cũ sang ZIP mới và gặp lỗi schema, hãy tắt backend rồi xóa:

```text
C:\Users\ADMIN\SBDCs\database.sqlite
```

Sau đó chạy lại backend để hệ thống tự tạo database mới.

## 8. Cấu trúc frontend đã kiểm tra

```text
frontend/
├── package.json
├── package-lock.json
├── index.html
├── vite.config.js
├── public/images/
└── src/
```

## 9. Kiểm tra đã thực hiện

- `python -m compileall backend`: OK
- `npm install`: OK
- `npm run build`: OK
- ZIP có đủ file root frontend: OK
