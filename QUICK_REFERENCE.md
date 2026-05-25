# 📇 Documentation Quick Reference Card

> In hôm này để có sẵn khi setup SBDCS

---

## 🎯 Chọn Tài Liệu (1 phút)

```
Bạn là:                     Đọc:
═════════════════════════════════════════════════════════════
🆕 Người mới (5 min)    →   START_HERE.md → QUICK_START.md
📖 Người mới (15 min)   →   START_HERE.md → README.md
👨‍💻 Developer           →   README.md → DEVELOPMENT.md
🐳 Docker/DevOps        →   README_DOCKER_DEPLOY.md
🐛 Gặp lỗi             →   TROUBLESHOOTING.md
📊 Dữ liệu demo         →   README_DEMO_DATA.md
📚 Xem tất cả docs      →   DOCS_OVERVIEW.md
```

---

## ⚡ Setup Nhanh (Copy-Paste)

### Windows Command Prompt

```batch
REM Clone & enter
git clone <URL>
cd SBDCS_2

REM Terminal 1 - Backend
python -m venv venv
venv\Scripts\activate
pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --reload

REM Terminal 2 - Frontend (mở terminal khác)
cd frontend
npm install
npm run dev
```

### Access

```
Frontend:     http://localhost:3000
Backend API:  http://127.0.0.1:8000
API Docs:     http://127.0.0.1:8000/docs
```

---

## 🔐 Tài Khoản Demo

### Người Hiến Máu

```
Phone: 0900000002
```

### Bệnh Viện

```
Email: hospital@sbdcs.com
Password: Admin@123
```

---

## ⚙️ Yêu Cầu

| Phần mềm | Phiên bản | Check              |
| -------- | --------- | ------------------ |
| Python   | 3.10+     | `python --version` |
| Node.js  | 20/22 LTS | `node --version`   |
| npm      | 10+       | `npm --version`    |
| Git      | Mới nhất  | `git --version`    |

---

## 🔧 Lỗi Phổ Biến & Giải Pháp

| Lỗi                         | Giải pháp                                          |
| --------------------------- | -------------------------------------------------- |
| `python not found`          | Cài Python từ python.org, thêm PATH                |
| `npm ERR! code ERESOLVE`    | `npm install --legacy-peer-deps`                   |
| `Exit handler never called` | Dùng Node 20/22 (tránh 24)                         |
| `Port 3000 already in use`  | `netstat -ano \| findstr :3000` rồi kill           |
| `CORS error`                | Kiểm tra backend chạy `http://127.0.0.1:8000/docs` |
| `Database locked`           | Xóa `database.sqlite`, restart backend             |
| `Cannot find module`        | `npm install --legacy-peer-deps`                   |

**👉 Lỗi khác? Xem [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)**

---

## 📋 Danh Sách Tài Liệu

```
Documentation Files:

📌 START_HERE.md           ← ĐỌC ĐÂY TRƯỚC
   └─ Navigation + Quick ref

🚀 QUICK_START.md          (5 min)
   └─ Setup nhanh

📖 README.md               (15 min)
   └─ Hướng dẫn đầy đủ

🔧 TROUBLESHOOTING.md      (Khi cần)
   └─ Giải lỗi

👨‍💻 DEVELOPMENT.md          (Dev)
   └─ Phát triển ứng dụng

🐳 README_DOCKER_DEPLOY.md (Docker)
   └─ Docker & Production

📊 README_DEMO_DATA.md     (Demo)
   └─ Tài khoản test

📚 DOCS_OVERVIEW.md        (Overview)
   └─ Tổng quan tất cả

📇 SUMMARY.md              (This)
   └─ Quick reference
```

---

## 🆘 Nếu Gặp Lỗi

### Bước 1: Kiểm tra logs

```
Backend logs  → Terminal chạy uvicorn
Frontend logs → F12 → Console
```

### Bước 2: Tìm giải pháp

```
→ Xem bảng "Lỗi Phổ Biến" ở trên
→ Ctrl+F trong TROUBLESHOOTING.md
```

### Bước 3: Reset (Last resort)

```powershell
# Xóa tất cả & start lại
rm -r venv node_modules database.sqlite
python -m venv venv
venv\Scripts\activate
pip install -r backend/requirements.txt
cd frontend && npm install
```

---

## 📝 Lệnh Hữu Ích

### Backend

```powershell
# Kích hoạt env
venv\Scripts\activate

# Cài dependencies
pip install -r backend/requirements.txt

# Chạy server
python -m uvicorn backend.main:app --reload

# Port khác
python -m uvicorn backend.main:app --port 8001 --reload

# Xem API docs
http://127.0.0.1:8000/docs
```

### Frontend

```powershell
# Cài dependencies
npm install

# Chạy dev server
npm run dev

# Build
npm run build

# Preview build
npm run preview

# Clean build
npm run clean
```

### Database

```powershell
# Reset database
rm database.sqlite

# Backend tự tạo mới khi restart
```

### Docker (Optional)

```powershell
# Start
docker-compose up -d

# Stop
docker-compose down

# Logs
docker-compose logs -f

# Clean
docker-compose down -v
```

---

## 📊 Cấu Trúc Dự Án

```
SBDCS_2/
├── backend/              # FastAPI
│   ├── main.py
│   ├── requirements.txt
│   ├── database.py
│   ├── schemas.py
│   ├── routers/
│   └── core/
│
├── frontend/             # React + Vite
│   ├── package.json
│   ├── src/
│   ├── public/
│   └── vite.config.js
│
├── 📄 START_HERE.md      (Read first!)
├── 📄 README.md
├── 📄 QUICK_START.md
├── 📄 TROUBLESHOOTING.md
├── 📄 DEVELOPMENT.md
└── ...
```

---

## 💡 Tips

- 📖 Mỗi file có table of contents ở đầu
- 🔍 Sử dụng Ctrl+F để tìm
- 📱 Copy-paste lệnh từ tài liệu
- 💬 Add comments khi code
- 🧪 Test trước khi push
- ⭐ Star repo nếu hữu ích!

---

## 🎯 Roadmap

### Ngày 1

- [ ] Clone repo
- [ ] Cài Python + Node.js
- [ ] Setup backend + frontend
- [ ] Đăng nhập demo account
- [ ] Explore giao diện

### Ngày 2-3

- [ ] Hiểu cấu trúc code
- [ ] Đọc DEVELOPMENT.md
- [ ] Thêm feature nhỏ

### Sau đó

- [ ] Deploy (DOCKER_DEPLOY.md)
- [ ] Phát triển features
- [ ] Contribute!

---

## 📞 Cần Giúp?

1. **Xem START_HERE.md** → Chọn tài liệu phù hợp
2. **Xem TROUBLESHOOTING.md** → Tìm lỗi của bạn
3. **Xem terminal logs** → Hiểu lỗi chi tiết
4. **Xem browser console** (F12) → Frontend errors

---

## ✅ Checklist Trước Khi Báo Lỗi

- [ ] Kiểm tra version Python, Node.js
- [ ] Backend chạy trên port 8000?
- [ ] Frontend chạy trên port 3000?
- [ ] Xem logs chi tiết?
- [ ] Thử reset database & node_modules?
- [ ] Tìm trong TROUBLESHOOTING.md?

---

**In tài liệu này để có sẵn! 📌**

_Last update: 2026-05-25_
