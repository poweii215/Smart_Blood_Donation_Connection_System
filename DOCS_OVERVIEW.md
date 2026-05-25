# 📚 Documentation Overview

> Hướng dẫn nhanh chọn tài liệu phù hợp cho nhu cầu của bạn

---

## 🎯 Chọn Tài Liệu Theo Nhu Cầu

### 👤 Bạn là người mới (Lần đầu setup)

**Đọc theo thứ tự này:**

1. **[QUICK_START.md](./QUICK_START.md)** (5 phút)
   - Cài đặt nhanh chóng
   - Bắt đầu chạy trong 5 phút
   - Ideal cho người không muốn đọc nhiều

2. **[README.md](./README.md)** (15-20 phút)
   - Hướng dẫn chi tiết từng bước
   - Giải thích tất cả yêu cầu
   - Cấu trúc dự án
   - Tài khoản demo

3. **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** (Khi gặp lỗi)
   - Xử lý sự cố phổ biến
   - Giải pháp chi tiết
   - Tips & tricks

---

### 👨‍💻 Bạn là developer (Muốn phát triển thêm)

**Đọc theo thứ tự này:**

1. **[README.md](./README.md)** - Setup ban đầu
2. **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Chi tiết phát triển
   - Cấu trúc project
   - Backend development
   - Frontend development
   - Database management
   - Best practices

3. **[README_DOCKER_DEPLOY.md](./README_DOCKER_DEPLOY.md)** - Production deployment
4. **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Debug issues

---

### 🐳 Bạn muốn chạy với Docker

**Đọc tài liệu này:**

1. **[README_DOCKER_DEPLOY.md](./README_DOCKER_DEPLOY.md)**
   - Setup Docker
   - Docker Compose
   - Triển khai

2. **[README_RUN_DOCKER.txt](./README_RUN_DOCKER.txt)**
   - Lệnh Docker
   - Container management

---

### 📊 Bạn cần dữ liệu demo

**Đọc tài liệu này:**

- **[README_DEMO_DATA.md](./README_DEMO_DATA.md)**
  - Dữ liệu người dùng demo
  - Tài khoản test
  - Seed data

---

## 📖 Danh Sách Tất Cả Tài Liệu

| Tệp                         | Mục đích          | Thời gian  | Độ khó          |
| --------------------------- | ----------------- | ---------- | --------------- |
| **QUICK_START.md**          | Setup nhanh       | 5 phút     | ⭐ Rất dễ       |
| **README.md**               | Hướng dẫn đầy đủ  | 15-20 phút | ⭐ Dễ           |
| **TROUBLESHOOTING.md**      | Xử lý lỗi         | Khi cần    | ⭐⭐ Trung bình |
| **DEVELOPMENT.md**          | Phát triển        | 30 phút    | ⭐⭐ Trung bình |
| **README_DOCKER_DEPLOY.md** | Docker/Production | 20 phút    | ⭐⭐⭐ Khó      |
| **README_RUN_DOCKER.txt**   | Lệnh Docker       | 5 phút     | ⭐⭐ Trung bình |
| **README_DEMO_DATA.md**     | Dữ liệu demo      | 5 phút     | ⭐ Rất dễ       |

---

## 🔑 Tài Khoản Demo Nhanh

### Người Hiến Máu (Donor)

```
Số điện thoại: 0900000002
```

### Bệnh Viện (Hospital)

```
Email: hospital@sbdcs.com
Mật khẩu: Admin@123
```

---

## 📋 Cheat Sheet - Lệnh Thường Dùng

### Backend

```powershell
# Kích hoạt virtual environment
venv\Scripts\activate

# Cài dependencies
pip install -r backend/requirements.txt

# Chạy backend
python -m uvicorn backend.main:app --reload

# Xem API docs
http://127.0.0.1:8000/docs
```

### Frontend

```powershell
# Cài dependencies
npm install

# Chạy dev server
npm run dev

# Build production
npm run build
```

### Docker

```powershell
# Build & start
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Clean (remove volumes)
docker-compose down -v
```

---

## 🆘 Nếu Bạn Gặp Lỗi

### Bước 1: Kiểm tra

- [ ] Bạn ở đúng thư mục?
- [ ] Backend đang chạy trên port 8000?
- [ ] Frontend đang chạy trên port 3000?
- [ ] Database tồn tại?

### Bước 2: Tìm giải pháp

- Tìm lỗi của bạn trong [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Nếu không tìm thấy, hãy check:
  - Backend logs (Terminal backend)
  - Browser console (F12)
  - Network tab (F12 → Network)

### Bước 3: Mô tả lỗi

Cung cấp:

- Lỗi đầy đủ
- Terminal output
- Phiên bản Python, Node.js
- Hệ điều hành

---

## 📚 Cấu Trúc Tài Liệu

```
Docs/
├── DOCS_OVERVIEW.md          # Bạn đang đọc
├── QUICK_START.md            # 5 min setup
├── README.md                 # Main guide
├── TROUBLESHOOTING.md        # Problem solving
├── DEVELOPMENT.md            # Dev guide
├── README_DOCKER_DEPLOY.md   # Docker
├── README_RUN_DOCKER.txt     # Docker commands
└── README_DEMO_DATA.md       # Demo accounts
```

---

## 💡 Mẹo

- 🔍 Sử dụng Ctrl+F để tìm trong docs
- 📱 README.md có table of contents ở đầu
- 🐛 Kiểm tra [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) trước khi bỏ cuộc
- 💬 Thêm comments vào code khi phát triển
- 🧪 Luôn test trước khi push

---

## 🚀 Các Bước Tiếp Theo

1. **Chọn tài liệu phù hợp từ danh sách trên**
2. **Làm theo hướng dẫn bước một**
3. **Nếu gặp lỗi, tìm trong TROUBLESHOOTING.md**
4. **Bắt đầu phát triển hoặc deploy**

---

**Chúc bạn thành công! 🎉**

_Cập nhật lần cuối: 2026-05-25_
