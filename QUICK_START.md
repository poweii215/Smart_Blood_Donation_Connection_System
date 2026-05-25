# 🚀 Quick Start Guide - SBDCS

> Hướng dẫn nhanh cho người mới lần đầu chạy ứng dụng

---

## ⚡ 5 Phút Để Chạy Ứng Dụng

### Bước 1: Cài đặt (1 phút)

```powershell
# Mở Command Prompt (Windows)
git clone <URL_REPOSITORY>
cd SBDCS_2
```

### Bước 2: Backend (2 phút)

```powershell
# Terminal 1
python -m venv venv
venv\Scripts\activate
pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --reload
```

✅ Backend chạy tại: `http://127.0.0.1:8000/docs`

### Bước 3: Frontend (2 phút)

```powershell
# Terminal 2 (mở terminal khác)
cd frontend
npm install
npm run dev
```

✅ Frontend chạy tại: `http://localhost:3000`

---

## 🔐 Đăng Nhập Ngay

**Người Hiến Máu:**

- Số điện thoại: `0900000002`

**Bệnh Viện:**

- Email: `hospital@sbdcs.com`
- Password: `Admin@123`

---

## ❌ Gặp Lỗi?

| Lỗi                                  | Giải pháp                                                         |
| ------------------------------------ | ----------------------------------------------------------------- |
| `python not found`                   | Cài Python từ [python.org](https://www.python.org)                |
| `npm ERR! code ERESOLVE`             | Chạy `npm install --legacy-peer-deps` trong folder `frontend`     |
| `Port 3000/8000 đã dùng`             | Chạy `netstat -ano \| findstr :3000` rồi `taskkill /PID <PID> /F` |
| `npm ERR! Exit handler never called` | Dùng Node.js 20 LTS hoặc 22 LTS (tránh Node 24)                   |

---

## 📚 Tài liệu Chi Tiết

- **Setup đầy đủ**: Xem [README.md](./README.md)
- **Triển khai Docker**: Xem [README_DOCKER_DEPLOY.md](./README_DOCKER_DEPLOY.md)
- **Dữ liệu demo**: Xem [README_DEMO_DATA.md](./README_DEMO_DATA.md)

---

**✅ Xong! Bạn đã sẵn sàng phát triển.**
