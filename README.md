# Smart Blood Donation Connection System

# Link deploy trên vercel: https://smart-blood-donation-connection-sys-three.vercel.app/

## 1. Giới thiệu dự án

Smart Blood Donation Connection System là hệ thống web hỗ trợ kết nối người hiến máu với bệnh viện/ngân hàng máu.

Hệ thống hiện tại có các nhóm chức năng chính:

- Đăng ký và đăng nhập tài khoản
- Phân quyền Donor và Hospital Admin
- Quản lý hồ sơ người dùng
- Quản lý lịch hẹn hiến máu
- Quản lý kho máu
- Theo dõi lịch sử nhập/xuất kho máu
- Cảnh báo kho máu thấp và khẩn cấp
- Recommendation Engine đề xuất donor phù hợp
- Gửi email khuyến nghị hiến máu
- Dashboard thống kê
- Xuất báo cáo donor và lịch hẹn hôm nay dạng Excel
- Smart Assistant cho donor
- Quản lý ảnh trang đăng nhập/trang chủ qua upload

## Công nghệ sử dụng

### Backend

- Python 3.11
- FastAPI
- Uvicorn
- PostgreSQL
- psycopg2-binary
- python-jose
- bcrypt
- python-multipart
- Cloudinary SDK

### Frontend

- React 19
- Vite 6
- React Router DOM 7
- Axios
- TailwindCSS 4
- Lucide React
- html2canvas
- dom-to-image-more

### Database

- PostgreSQL 16 Alpine khi chạy Docker

### Chạy local và deploy

- Docker
- Docker Compose
- Nginx cho frontend production container
- Render cho backend
- Vercel cho frontend

## Kiến trúc tổng quát

```text
Browser
  |
  | http://localhost:3000
  v
Frontend React container hoặc Vite dev server
  |
  | /api, /uploads, /docs proxy sang backend
  v
Backend FastAPI
  |
  | DATABASE_URL
  v
PostgreSQL
```

Khi chạy Docker production local:

```text
frontend nginx: localhost:3000
backend FastAPI: localhost:8000
database PostgreSQL: localhost:5432
```

---

## 2. Yêu cầu hệ thống

Có hai cách chạy project.

| Cách | Mô tả | Khuyến nghị |
|---|---|---|
| Cách A: Docker | Docker tự chạy frontend, backend và PostgreSQL | Nên dùng cho người mới |
| Cách B: Thủ công | Tự chạy PostgreSQL, backend Python và frontend Node.js | Dành cho người muốn debug code |

## Cách A: Cài Docker Desktop

Tải Docker Desktop tại:

```text
https://www.docker.com/products/docker-desktop/
```

Sau khi cài xong, mở Docker Desktop rồi kiểm tra:

```bash
docker --version
```

Kiểm tra Docker Compose:

```bash
docker compose version
```

Nếu hai lệnh trên chạy được thì có thể chạy project bằng Docker.

## Cách B: Cài thủ công

### Cài Python 3.11

Tải Python tại:

```text
https://www.python.org/downloads/release/python-3110/
```

Khi cài trên Windows, chọn:

```text
Add Python to PATH
```

Kiểm tra:

```bash
python --version
```

Phiên bản phù hợp:

```text
Python 3.11.x
```

### Cài Node.js LTS

Tải Node.js tại:

```text
https://nodejs.org/
```

Khuyến nghị dùng:

```text
Node.js 20 LTS hoặc Node.js 22 LTS
```

Kiểm tra:

```bash
node -v
npm -v
```

### Cài PostgreSQL 16

Tải PostgreSQL tại:

```text
https://www.postgresql.org/download/
```

Khi cài cần ghi nhớ:

- User mặc định thường là postgres
- Password do bạn tự đặt
- Port mặc định là 5432

Kiểm tra:

```bash
psql --version
```

---

## 3. Clone repo và cấu trúc thư mục

Clone repository:

```bash
git clone <YOUR_REPOSITORY_URL>
cd Smart_Blood_Donation_Connection_System
```

Cấu trúc chính của project hiện tại:

```text
Smart_Blood_Donation_Connection_System/
|
|-- backend/
|   |-- core/
|   |   |-- cloudinary_config.py
|   |   |-- config.py
|   |   |-- security.py
|   |
|   |-- routers/
|   |   |-- analytics.py
|   |   |-- appointments.py
|   |   |-- auth.py
|   |   |-- bloodbank.py
|   |   |-- chatbot.py
|   |   |-- hospitals.py
|   |
|   |-- database.py
|   |-- db_helpers.py
|   |-- main.py
|   |-- requirements.txt
|   |-- schemas.py
|
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- pages/
|   |   |-- services/
|   |   |-- utils/
|   |   |-- App.jsx
|   |   |-- main.jsx
|   |
|   |-- Dockerfile
|   |-- index.html
|   |-- nginx.conf
|   |-- package.json
|   |-- vite.config.js
|   |-- vercel.json
|
|-- docker-compose.yml
|-- docker-compose.dev.yml
|-- Dockerfile.backend
|-- render.yaml
|-- seed_demo_50.py
|-- .env
|-- .env.example
```

Giải thích các file/folder quan trọng:

| File hoặc folder | Vai trò |
|---|---|
| backend/main.py | Tạo app FastAPI, gắn router, cấu hình CORS, mount uploads, health check |
| backend/database.py | Tạo bảng, migration cột, seed dữ liệu nền |
| backend/db_helpers.py | Helper xử lý cursor PostgreSQL |
| backend/core/security.py | JWT, password hash, xác thực user |
| backend/core/config.py | JWT_SECRET, thuật toán JWT, thời hạn token |
| backend/core/cloudinary_config.py | Cấu hình Cloudinary nếu có |
| backend/routers/auth.py | Đăng ký, đăng nhập, OTP demo, profile, avatar, homepage media |
| backend/routers/appointments.py | Lịch hẹn hiến máu |
| backend/routers/bloodbank.py | Kho máu và giao dịch nhập/xuất |
| backend/routers/analytics.py | Dashboard, forecast, recommendation, email, notification, export Excel |
| backend/routers/chatbot.py | Smart Assistant |
| frontend/src/pages | Các trang giao diện chính |
| frontend/src/services/api.js | Axios instance, tự gắn Bearer token |
| frontend/nginx.conf | Proxy /api, /uploads, /docs sang backend khi chạy Docker frontend |
| docker-compose.yml | Chạy db, backend, frontend production local |
| docker-compose.dev.yml | Chạy môi trường dev có hot reload |
| Dockerfile.backend | Build backend bằng Python 3.11 slim |
| frontend/Dockerfile | Build frontend bằng Node 22 Alpine và chạy bằng Nginx |
| seed_demo_50.py | Seed thêm 50 donor demo, lịch hẹn và lịch sử kho máu |

---

## 4. Chạy bằng Docker

Đây là cách khuyến nghị.

## Bước 1: Kiểm tra file .env

Ở thư mục gốc cần có file `.env`.

Cấu hình local mặc định phù hợp với Docker:

```env
POSTGRES_PASSWORD=sbdcs_local_pass
DATABASE_URL=postgresql://sbdcs_user:sbdcs_local_pass@db:5432/sbdcs
JWT_SECRET=sbdcs-2026-super-secret-key-xyz789
EMAIL_MODE=mock
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=your_email@gmail.com
SMTP_USE_TLS=true
```

Lưu ý: khi chạy Docker, backend lấy `DATABASE_URL` nội bộ theo service name `db`.

## Bước 2: Chạy toàn bộ hệ thống

Tại thư mục gốc project:

```bash
docker compose up -d --build
```

Docker sẽ chạy 3 container:

```text
sbdcs_db
sbdcs_backend
sbdcs_frontend
```

## Bước 3: Kiểm tra container

```bash
docker ps
```

## Bước 4: Truy cập web

| Thành phần | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend root | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| Health check | http://localhost:8000/api/health |

Health check đúng sẽ trả về:

```json
{"status":"ok"}
```

## Lệnh xem log

Backend:

```bash
docker logs -f sbdcs_backend
```

Frontend:

```bash
docker logs -f sbdcs_frontend
```

Database:

```bash
docker logs -f sbdcs_db
```

## Dừng hệ thống

```bash
docker compose down
```

## Reset database

Lệnh này xóa volume PostgreSQL, toàn bộ dữ liệu local sẽ mất:

```bash
docker compose down -v
```

Sau đó chạy lại:

```bash
docker compose up -d --build
```

## Seed thêm 50 donor demo

Docker backend image đã copy `seed_demo_50.py` vào `/app/seed_demo_50.py`.

Chạy seed trong container backend:

```bash
docker exec -it sbdcs_backend python seed_demo_50.py
```

Seed này tạo:

- 50 donor demo có số điện thoại từ 0920000001 đến 0920000050
- Lịch hẹn demo
- Tồn kho máu demo
- Giao dịch nhập/xuất kho cho biểu đồ forecast

---

## 5. Chạy thủ công

Cách này dùng khi muốn debug backend/frontend riêng.

## 5.1. Chuẩn bị PostgreSQL thủ công

Tạo database và user tương ứng.

Ví dụ dùng user postgres:

```bash
psql -U postgres
```

Tạo database:

```sql
CREATE DATABASE sbdcs;
```

Nếu muốn dùng đúng user theo Docker:

```sql
CREATE USER sbdcs_user WITH PASSWORD 'sbdcs_local_pass';
CREATE DATABASE sbdcs OWNER sbdcs_user;
GRANT ALL PRIVILEGES ON DATABASE sbdcs TO sbdcs_user;
```

## 5.2. Cấu hình .env khi chạy thủ công

Nếu backend chạy ngoài Docker và PostgreSQL chạy trên máy local, dùng host `localhost`:

```env
DATABASE_URL=postgresql://sbdcs_user:sbdcs_local_pass@localhost:5432/sbdcs
JWT_SECRET=sbdcs-2026-super-secret-key-xyz789
EMAIL_MODE=mock
```

Không dùng host `db` khi chạy backend ngoài Docker.

## 5.3. Chạy backend thủ công

Từ thư mục gốc project:

```bash
python -m venv venv
```

Windows:

```bash
venv\Scripts\activate
```

Linux/Mac:

```bash
source venv/bin/activate
```

Cài dependencies:

```bash
pip install -r backend/requirements.txt
```

Chạy backend:

```bash
python -m uvicorn backend.main:app --reload
```

Backend chạy tại:

```text
http://localhost:8000
```

## 5.4. Chạy frontend thủ công

Mở terminal khác:

```bash
cd frontend
npm install
npm run dev
```

Frontend dev server chạy ở port 3000 theo cấu hình hiện tại:

```text
http://localhost:3000
```

Trong `frontend/vite.config.js`, frontend proxy các đường dẫn sau về backend `http://localhost:8000`:

```text
/api
/docs
/uploads
/openapi.json
```

## 5.5. Seed demo khi chạy thủ công

Từ thư mục gốc project, sau khi backend/database đã cấu hình đúng:

```bash
python seed_demo_50.py
```

---

## 6. Tài khoản demo

Dữ liệu nền được tạo trong `backend/database.py` khi backend khởi động.

## Hospital Admin 1

```text
Phone: 0900000001
Email: hospital@sbdcs.com
Password: Admin@123
Role: HOSPITAL_ADMIN
```

## Hospital Admin 2

```text
Phone: 0900000099
Email: hospital2@sbdcs.com
Password: Admin@123
Role: HOSPITAL_ADMIN
```

## Donor demo mặc định

```text
Phone: 0900000002
Email: donor@sbdcs.com
Password: phone-login
Role: DONOR
```

Lưu ý: giao diện login của dự án hiện dùng phone/password theo backend. Có thể đăng nhập bằng số điện thoại và mật khẩu tương ứng.

## Donor sau khi chạy seed_demo_50.py

```text
Phone: 0920000001 đến 0920000050
Password: phone-login
```

---

## 7. Kiểm thử hệ thống

## 7.1. Health check

Mở:

```text
http://localhost:8000/api/health
```

Kết quả đúng:

```json
{"status":"ok"}
```

## 7.2. Swagger UI

Mở:

```text
http://localhost:8000/docs
```

Swagger cho phép test API trực tiếp.

## 7.3. Luồng test Hospital Admin

1. Truy cập `http://localhost:3000/login`
2. Đăng nhập bằng `0900000001 / Admin@123`
3. Vào Dashboard để xem thống kê
4. Vào Inventory để xem tồn kho máu
5. Thử nhập/xuất kho máu
6. Vào Recommendation
7. Chọn nhóm máu
8. Chạy recommendation
9. Chọn donor trong danh sách
10. Bấm gửi email
11. Kiểm tra trạng thái email: NOT_SENT, SENT, MOCK_SENT, SKIPPED hoặc FAILED
12. Vào Reports để xuất báo cáo nếu cần

## 7.4. Luồng test Donor

1. Truy cập `http://localhost:3000/login`
2. Đăng nhập bằng `0900000002 / phone-login`
3. Vào Dashboard
4. Vào Appointments để tạo lịch hiến máu
5. Xem lịch của mình
6. Vào Settings để cập nhật hồ sơ
7. Vào Smart Assistant nếu cần hỏi đáp
8. Vào Notifications để xem thông báo

## 7.5. Test Recommendation Engine

Recommendation API nằm tại:

```text
POST /api/analytics/recommendations
```

Giao diện tương ứng:

```text
/recommendation
```

Logic trọng số mặc định trong database:

```text
Blood Match: 0.45
Eligibility: 0.30
Reliability: 0.15
Humanitarian: 0.10
```

Logic emergency adaptive mặc định:

```text
Blood Match: 0.60
Eligibility: 0.25
Reliability: 0.10
Humanitarian: 0.05
```

Khi nhóm máu ở trạng thái emergency và bật tự điều chỉnh, backend trả về `emergency_mode=true` và `weights_used` là bộ trọng số khẩn cấp.

---

## 8. Cấu hình nâng cao

## 8.1. Email SMTP thật

Mặc định project chạy:

```env
EMAIL_MODE=mock
```

Ở chế độ mock, hệ thống chỉ ghi nhận trạng thái email, không gửi email thật ra ngoài.

Muốn gửi email thật bằng Gmail SMTP:

```env
EMAIL_MODE=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=your_email@gmail.com
SMTP_USE_TLS=true
```

Lưu ý:

- Gmail phải bật 2-Step Verification
- SMTP_PASSWORD phải là App Password
- Không dùng mật khẩu đăng nhập Gmail thường
- App Password phải được tạo từ đúng tài khoản trong SMTP_USERNAME

Sau khi sửa `.env` và đang chạy Docker, cần build lại:

```bash
docker compose down
docker compose up -d --build
```

Kiểm tra biến môi trường trong container:

```bash
docker exec -it sbdcs_backend printenv EMAIL_MODE
docker exec -it sbdcs_backend printenv SMTP_USERNAME
docker exec -it sbdcs_backend printenv SMTP_FROM
```

## 8.2. Cloudinary CDN

Project có file:

```text
backend/core/cloudinary_config.py
```

Có thể cấu hình Cloudinary bằng biến:

```env
CLOUDINARY_URL=cloudinary://your_api_key:your_api_secret@your_cloud_name
```

Nếu không cấu hình, backend vẫn chạy và in cảnh báo Cloudinary chưa được cấu hình.

## 8.3. JWT Secret

Biến đang dùng:

```env
JWT_SECRET=your-secret
```

Không nên dùng secret mặc định khi deploy thật.

---

## 9. Deploy lên internet

## 9.1. Deploy backend lên Render

Project có sẵn `render.yaml`.

Cấu hình trong file hiện tại:

```yaml
services:
  - type: web
    name: sbdcs-backend
    runtime: python
    buildCommand: pip install -r backend/requirements.txt
    startCommand: python -m uvicorn backend.main:app --host 0.0.0.0 --port $PORT
```

Render sẽ tạo database:

```yaml
databases:
  - name: sbdcs-db
    plan: free
    databaseName: sbdcs
    user: sbdcs_user
```

Các biến môi trường cần kiểm tra trên Render:

```text
DATABASE_URL
JWT_SECRET
EMAIL_MODE
SMTP_HOST
SMTP_PORT
SMTP_USERNAME
SMTP_PASSWORD
SMTP_FROM
SMTP_USE_TLS
CLOUDINARY_URL
```

## 9.2. Deploy frontend lên Vercel

Frontend nằm trong thư mục:

```text
frontend
```

Khi deploy Vercel, cấu hình:

```text
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
```

Biến môi trường frontend cần có nếu backend deploy riêng:

```env
VITE_API_URL=https://your-backend.onrender.com
```

Lưu ý quan trọng: trong `frontend/src/services/api.js`, frontend đọc biến `VITE_API_URL`, không phải `VITE_API_BASE_URL`.

---

## 10. Bảng xử lý lỗi thường gặp

| Lỗi | Nguyên nhân | Cách xử lý |
|---|---|---|
| `docker` is not recognized | Chưa cài Docker hoặc chưa mở Docker Desktop | Cài và mở Docker Desktop |
| `Error loading ASGI app. Could not import module main` | Chạy sai module backend | Chạy `python -m uvicorn backend.main:app --reload` từ thư mục gốc |
| `ModuleNotFoundError: psycopg2` | Thiếu dependency backend | Chạy `pip install -r backend/requirements.txt` |
| `connection to server at localhost port 5432 failed` | PostgreSQL chưa chạy hoặc sai host | Nếu chạy Docker dùng service db; nếu chạy thủ công dùng localhost |
| `password authentication failed for user sbdcs_user` | Sai password database | Kiểm tra POSTGRES_PASSWORD và DATABASE_URL |
| Frontend gọi API bị 404 | Sai proxy hoặc sai VITE_API_URL | Kiểm tra `frontend/vite.config.js` hoặc env Vercel |
| Bị logout 401 | Token hết hạn hoặc JWT_SECRET đổi | Đăng nhập lại, giữ JWT_SECRET ổn định |
| Email status `MOCK_SENT` | Đang ở EMAIL_MODE=mock | Đổi `EMAIL_MODE=smtp` nếu muốn gửi thật |
| Email status `SKIPPED` | Donor không có email | Cập nhật email donor trong profile/database |
| `SMTPAuthenticationError 535` | Sai Gmail App Password hoặc mismatch account | Tạo App Password mới đúng tài khoản SMTP_USERNAME |
| Port 3000 hoặc 8000 bị chiếm | App khác đang dùng port | Tắt app đang chiếm port hoặc đổi port |
| `npm install` lỗi | Node version không phù hợp hoặc dependency conflict | Dùng Node 20/22 LTS, thử `npm install --legacy-peer-deps` |

---

## 11. API reference chính

Tất cả API chính được prefix bằng `/api`.

## Auth

| Method | Endpoint | Chức năng |
|---|---|---|
| POST | `/api/auth/register` | Đăng ký tài khoản |
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/request-otp` | OTP demo |
| POST | `/api/auth/verify-otp` | Xác minh OTP demo |
| POST | `/api/auth/profile/avatar` | Upload avatar |
| GET | `/api/auth/profile` | Lấy hồ sơ người dùng |
| PATCH | `/api/auth/profile` | Cập nhật hồ sơ |
| GET | `/api/auth/homepage-media` | Lấy media trang login/homepage |
| POST | `/api/auth/homepage-media/{media_type}` | Upload media trang login/homepage |

## Blood Bank

| Method | Endpoint | Chức năng |
|---|---|---|
| GET | `/api/blood-bank/inventory` | Lấy tồn kho máu |
| GET | `/api/blood-bank/alerts` | Lấy cảnh báo kho máu |
| PUT | `/api/blood-bank/inventory` | Cập nhật tồn kho/ngưỡng |
| GET | `/api/blood-bank/transactions` | Lấy lịch sử nhập/xuất kho |
| POST | `/api/blood-bank/transactions` | Tạo giao dịch nhập/xuất kho |

## Appointments

| Method | Endpoint | Chức năng |
|---|---|---|
| GET | `/api/appointments/eligibility` | Kiểm tra điều kiện hiến máu |
| POST | `/api/appointments` | Tạo lịch hẹn |
| GET | `/api/appointments/my` | Lịch hẹn của donor hiện tại |
| GET | `/api/appointments/all` | Tất cả lịch hẹn cho hospital admin |
| PATCH | `/api/appointments/{id}/cancel` | Hủy lịch hẹn |
| PATCH | `/api/appointments/{id}/status` | Cập nhật trạng thái lịch hẹn |

## Hospitals

| Method | Endpoint | Chức năng |
|---|---|---|
| GET | `/api/hospitals` | Danh sách bệnh viện |

## Analytics

| Method | Endpoint | Chức năng |
|---|---|---|
| GET | `/api/analytics/forecast` | Dữ liệu dự báo kho máu |
| GET | `/api/analytics/summary` | Summary dashboard |
| GET | `/api/analytics/donors/export` | Xuất danh sách donor Excel |
| GET | `/api/analytics/appointments/today/export` | Xuất lịch hẹn hôm nay Excel |
| GET | `/api/analytics/recommendation-settings` | Lấy cấu hình trọng số recommendation |
| PUT | `/api/analytics/recommendation-settings` | Cập nhật trọng số recommendation |
| POST | `/api/analytics/recommendations` | Chạy recommendation |
| POST | `/api/analytics/recommendations/send-emails` | Gửi email cho donor được chọn |
| GET | `/api/analytics/notifications` | Lấy thông báo |
| GET | `/api/analytics/hospital-analytics` | Thống kê cho hospital |

## Chatbot

| Method | Endpoint | Chức năng |
|---|---|---|
| POST | `/api/chatbot/ask` | Hỏi Smart Assistant |
| GET | `/api/chatbot/history` | Lịch sử chat |
| GET | `/api/chatbot/suggestions` | Gợi ý câu hỏi |

---

## Ghi chú quan trọng

- Health check hiện tại là `/api/health`, không phải `/health`.
- Frontend Docker chạy qua Nginx ở port 3000.
- Frontend dev cũng dùng port 3000 theo `vite.config.js`.
- Backend module đúng là `backend.main:app`.
- Backend Docker command đúng là `python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000`.
- Database Docker service tên là `db`, database là `sbdcs`, user là `sbdcs_user`.
- File seed đúng là `seed_demo_50.py`.
- Vercel frontend cần `VITE_API_URL`, vì code không đọc `VITE_API_BASE_URL`.
