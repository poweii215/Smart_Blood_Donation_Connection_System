# 🚀 START HERE - SBDCS Setup Guide

> Welcome! 👋 Hướng dẫn này sẽ giúp bạn setup SBDCS một cách nhanh chóng và dễ dàng.

---

## ⚡ Nếu bạn chỉ có 5 phút

**👉 Đọc: [QUICK_START.md](./QUICK_START.md)**

Nó chứa:

- Clone repo
- Cài đặt dependencies
- Chạy backend + frontend
- Xong! 🎉

---

## 📖 Nếu bạn muốn hiểu rõ hơn (15 phút)

**👉 Đọc: [README.md](./README.md)**

Nó chứa:

- ✅ Tính năng chi tiết
- ✅ Yêu cầu hệ thống
- ✅ Hướng dẫn setup từng bước
- ✅ Tài khoản demo
- ✅ Cách chạy ứng dụng
- ✅ Xử lý sự cố phổ biến

---

## 🔧 Nếu bạn gặp lỗi

**👉 Đọc: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)**

Nó chứa giải pháp cho:

- ❌ Python errors
- ❌ npm errors
- ❌ Port already in use
- ❌ Database issues
- ❌ Docker issues
- ❌ CORS errors
- ... và nhiều lỗi khác

---

## 👨‍💻 Nếu bạn muốn phát triển (Dev)

**👉 Đọc: [DEVELOPMENT.md](./DEVELOPMENT.md)**

Nó chứa:

- 📁 Cấu trúc project chi tiết
- 🖥️ Cách phát triển backend
- ⚛️ Cách phát triển frontend
- 💾 Database management
- 🔌 API development
- ✅ Best practices

---

## 🐳 Nếu bạn muốn dùng Docker

**👉 Đọc: [README_DOCKER_DEPLOY.md](./README_DOCKER_DEPLOY.md)**

Nó chứa:

- 🐳 Setup Docker
- 🐳 Docker Compose
- 🐳 Triển khai Production

---

## 📊 Nếu bạn cần dữ liệu demo

**👉 Đọc: [README_DEMO_DATA.md](./README_DEMO_DATA.md)**

Nó chứa:

- 👤 Tài khoản người hiến máu
- 🏥 Tài khoản bệnh viện
- 📝 Dữ liệu mẫu

---

## 🗺️ Bản Đồ Tài Liệu

```
SBDCS Documentation Map
│
├─ START_HERE.md (Bạn đang đọc)
│  │
│  ├─→ QUICK_START.md (⏱️ 5 phút)
│  │    └─→ Cài đặt nhanh chóng
│  │
│  ├─→ README.md (📖 15 phút)
│  │    └─→ Hướng dẫn đầy đủ
│  │
│  ├─→ TROUBLESHOOTING.md (🔧 Khi cần)
│  │    └─→ Xử lý sự cố
│  │
│  ├─→ DEVELOPMENT.md (👨‍💻 Dev)
│  │    └─→ Phát triển ứng dụng
│  │
│  ├─→ README_DOCKER_DEPLOY.md (🐳 Docker)
│  │    └─→ Triển khai container
│  │
│  ├─→ README_DEMO_DATA.md (📊 Demo)
│  │    └─→ Tài khoản test
│  │
│  └─→ DOCS_OVERVIEW.md (📚 Overview)
│       └─→ Tổng quan tất cả docs
```

---

## 🎯 Lựa Chọn Nhanh

### Bạn là:

| Loại             | Đọc                  | Thời gian | Level  |
| ---------------- | -------------------- | --------- | ------ |
| 🆕 **Người mới** | QUICK_START → README | 20 phút   | ⭐     |
| 👨‍💻 **Developer** | README → DEVELOPMENT | 45 phút   | ⭐⭐   |
| 🏗️ **DevOps**    | README_DOCKER_DEPLOY | 20 phút   | ⭐⭐⭐ |
| 🐛 **Debug**     | TROUBLESHOOTING      | 10 phút   | ⭐⭐   |

---

## 📱 Tài Khoản Test Nhanh

### Login Người Hiến Máu

```
Phone: 0900000002
```

### Login Bệnh Viện

```
Email: hospital@sbdcs.com
Password: Admin@123
```

---

## ⚙️ Yêu Cầu Tối Thiểu

```powershell
# Kiểm tra bạn đã cài chưa:
python --version      # Python 3.10+
node --version        # Node.js 20 or 22 LTS
npm --version         # npm 10+
git --version         # Git (bất kỳ version)
```

Nếu không cài, tham khảo **[README.md](./README.md)** phần "Yêu cầu hệ thống"

---

## 🚀 Lệnh Nhanh (Copy-Paste)

### Setup + Run (Windows)

```powershell
# Clone
git clone <URL>
cd SBDCS_2

# Backend (Terminal 1)
python -m venv venv
venv\Scripts\activate
pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --reload

# Frontend (Terminal 2)
cd frontend
npm install
npm run dev

# Truy cập:
# Frontend: http://localhost:3000
# API Docs: http://127.0.0.1:8000/docs
```

---

## ❓ Câu Hỏi Thường Gặp

**Q: Tôi bắt đầu từ đâu?**

- A: Nếu 5 phút → QUICK_START.md | Nếu 15 phút → README.md

**Q: Tôi gặp lỗi?**

- A: Tìm trong TROUBLESHOOTING.md, nếu không có thì check terminal logs

**Q: Tôi muốn phát triển thêm?**

- A: Đọc DEVELOPMENT.md

**Q: Tôi muốn dùng Docker?**

- A: Đọc README_DOCKER_DEPLOY.md

**Q: Tôi cần dữ liệu demo?**

- A: Tài khoản demo ở trên + README_DEMO_DATA.md

---

## 🆘 Bạn Vẫn Cần Giúp?

### Bước 1: Kiểm tra logs

```powershell
# Backend logs: Xem terminal chạy uvicorn
# Frontend logs: F12 → Console
```

### Bước 2: Tìm trong docs

- Xem [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Sử dụng Ctrl+F để tìm lỗi của bạn

### Bước 3: Check cấu trúc

```powershell
# Bạn ở đúng thư mục?
dir backend    # Should show files
dir frontend   # Should show files

# Backend chạy?
curl http://127.0.0.1:8000/docs

# Frontend chạy?
# http://localhost:3000
```

---

## 💡 Tips

- 📖 Mỗi file tài liệu có table of contents ở đầu
- 🔍 Sử dụng Ctrl+F để tìm từ khóa
- 📋 Kiểm tra [DOCS_OVERVIEW.md](./DOCS_OVERVIEW.md) để xem tất cả docs
- 💬 Nếu phát triển, thêm comments trong code
- 🧪 Test trước khi push

---

## 🎉 Bạn Đã Sẵn Sàng!

**Bước tiếp theo:**

1. Chọn một tài liệu từ danh sách trên
2. Làm theo hướng dẫn
3. Bắt đầu phát triển hoặc sử dụng ứng dụng
4. Nếu gặp lỗi → TROUBLESHOOTING.md

---

**Chúc bạn thành công! 🚀**

_Tài liệu này cập nhật lần cuối: 2026-05-25_
