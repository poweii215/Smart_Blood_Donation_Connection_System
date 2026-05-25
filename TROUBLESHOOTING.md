# 🔧 Hướng Dẫn Xử Lý Sự Cố Chi Tiết

> Giải quyết các vấn đề phổ biến khi setup và chạy SBDCS

---

## 📋 Mục lục

- [Vấn đề cài đặt Python](#vấn-đề-cài-đặt-python)
- [Vấn đề Node.js/npm](#vấn-đề-nodejsnpm)
- [Vấn đề Backend](#vấn-đề-backend)
- [Vấn đề Frontend](#vấn-đề-frontend)
- [Vấn đề Database](#vấn-đề-database)
- [Vấn đề Docker](#vấn-đề-docker)
- [Vấn đề Port](#vấn-đề-port)

---

## 🐍 Vấn đề Cài Đặt Python

### ❌ Lỗi: "python command not found" hoặc "'python' is not recognized"

**Nguyên nhân:** Python không được thêm vào PATH hoặc chưa cài đặt

**Giải pháp:**

1. **Kiểm tra Python đã cài chưa:**

   ```powershell
   python --version
   # Hoặc thử
   python3 --version
   ```

2. **Cài đặt Python:**
   - Tải từ [python.org](https://www.python.org/downloads/)
   - **Quan trọng:** Chọn "Add Python to PATH" khi cài đặt
   - Sau khi cài, **khởi động lại Command Prompt**

3. **Thêm Python vào PATH thủ công (Windows):**
   - Nhấn `Win + X`, chọn "System"
   - Nhấn "Advanced system settings"
   - Nhấn "Environment Variables"
   - Tìm biến `PATH`, nhấn "Edit"
   - Thêm đường dẫn: `C:\Users\<YourUsername>\AppData\Local\Programs\Python\Python310\`
   - Nhấn OK, khởi động lại Command Prompt

### ❌ Lỗi: "No module named 'fastapi'" hoặc "ModuleNotFoundError"

**Nguyên nhân:** Chưa cài đặt dependencies

**Giải pháp:**

```powershell
# Kiểm tra virtual environment đã kích hoạt chưa
# (Nên thấy (venv) ở đầu dòng trong terminal)

# Nếu chưa kích hoạt:
venv\Scripts\activate

# Cài lại dependencies
pip install -r backend/requirements.txt

# Kiểm tra cài đặt
pip list
```

### ❌ Lỗi: "Permission denied" khi cài đặt

**Giải pháp:**

```powershell
# Sử dụng virtual environment (khuyến nghị nhất)
python -m venv venv
venv\Scripts\activate
pip install -r backend/requirements.txt

# Hoặc cài cho user (không cần admin)
pip install --user -r backend/requirements.txt
```

---

## 📦 Vấn đề Node.js/npm

### ❌ Lỗi: "node command not found" hoặc "'node' is not recognized"

**Nguyên nhân:** Node.js chưa cài đặt hoặc chưa thêm vào PATH

**Giải pháp:**

1. **Tải Node.js LTS:**
   - Truy cập [nodejs.org](https://nodejs.org/)
   - Chọn **LTS version** (20 hoặc 22, **tránh 24**)
   - Chạy installer, chọn "Add to PATH"
   - Khởi động lại Command Prompt

2. **Kiểm tra sau khi cài:**
   ```powershell
   node --version
   npm --version
   ```

### ❌ Lỗi: "npm ERR! code ERESOLVE"

**Nguyên nhân:** Xung đột dependencies

**Giải pháp:**

```powershell
cd frontend

# Xóa node_modules và package-lock.json
rm -r node_modules
rm package-lock.json

# Cài lại với legacy flag
npm install --legacy-peer-deps

# Hoặc nếu lệnh trên không hoạt động trên Windows
npm cache clean --force
npm install --legacy-peer-deps
```

### ❌ Lỗi: "npm ERR! Exit handler never called"

**Nguyên nhân:** Thường do Node 24 hoặc npm version cũ trên Windows

**Giải pháp:**

```powershell
# Kiểm tra Node version
node --version

# Nếu là v24.x.x, tải Node 20 hoặc 22 từ nodejs.org

# Cập nhật npm
npm install -g npm@latest

# Xóa cache
npm cache clean --force

# Thử cài lại
cd frontend
npm install --legacy-peer-deps
```

### ❌ Lỗi: "EACCES permission denied" hoặc "gyp ERR!"

**Nguyên nhân:** Vấn đề permission hoặc native modules

**Giải pháp:**

```powershell
# Trên Windows, thử chạy Command Prompt as Administrator
# Sau đó:
npm cache clean --force
npm install --legacy-peer-deps

# Hoặc xóa hoàn toàn node_modules:
cd frontend
rm -r node_modules
rm package-lock.json
npm install --legacy-peer-deps
```

---

## 🖥️ Vấn đề Backend

### ❌ Lỗi: "ModuleNotFoundError: No module named 'backend'"

**Nguyên nhân:** Chạy lệnh từ thư mục sai

**Giải pháp:**

```powershell
# Chạy từ thư mục gốc (chứa folder backend)
cd c:\Users\ADMIN\SBDCS_2

# Kiểm tra cấu trúc
dir backend

# Rồi chạy
python -m uvicorn backend.main:app --reload
```

### ❌ Lỗi: "Uvicorn fails to start" hoặc "[ERROR] connection refused"

**Nguyên nhân:** Port 8000 đã được sử dụng

**Giải pháp:**

```powershell
# Chạy trên port khác
python -m uvicorn backend.main:app --port 8001 --reload

# Hoặc tìm và dừng process sử dụng port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### ❌ Lỗi: "CORS policy error" khi frontend gọi API

**Nguyên nhân:** Backend không cho phép request từ frontend

**Giải pháp:**

1. **Kiểm tra URL backend trong frontend:**
   - Mở file `frontend/src/services/api.js` hoặc tương tự
   - Đảm bảo `baseURL` = `http://127.0.0.1:8000`

2. **Kiểm tra CORS cấu hình trong backend:**
   - Backend phải có CORSMiddleware
   - Xem file `backend/main.py`
   - Đảm bảo `http://localhost:3000` được allow

3. **Test API trực tiếp:**
   ```powershell
   curl http://127.0.0.1:8000/docs
   ```
   Nếu hoạt động, vấn đề là frontend config

### ❌ Lỗi: "Starlette/FastAPI" import error

**Giải pháp:**

```powershell
# Cài lại FastAPI
pip uninstall fastapi uvicorn -y
pip install fastapi uvicorn
```

---

## ⚛️ Vấn đề Frontend

### ❌ Lỗi: "Cannot find module 'react'" hoặc "Module not found"

**Nguyên nhân:** node_modules chưa được tạo

**Giải pháp:**

```powershell
cd frontend
npm install --legacy-peer-deps
```

### ❌ Lỗi: "Vite failed to start" hoặc "Port 3000 already in use"

**Giải pháp:**

```powershell
# Chạy frontend trên port khác
cd frontend

# Chỉnh sửa vite.config.js:
# server: {
#   port: 3001
# }

# Hoặc chạy qua environment variable
set VITE_PORT=3001 && npm run dev
```

### ❌ Lỗi: "Blank page" hoặc "React not rendering"

**Giải pháp:**

1. **Kiểm tra browser console (F12)** để xem error
2. **Kiểm tra backend đang chạy:**
   ```powershell
   curl http://127.0.0.1:8000/docs
   ```
3. **Xóa cache browser:** `Ctrl + Shift + Delete`
4. **Rebuild frontend:**
   ```powershell
   cd frontend
   rm -r node_modules dist
   npm install --legacy-peer-deps
   npm run dev
   ```

### ❌ Lỗi: "ReferenceError: document is not defined"

**Nguyên nhân:** Component chạy trên server instead of client

**Giải pháp:**

Thêm `'use client'` ở đầu file component (nếu dùng Next.js):

```javascript
"use client";

import React from "react";
// ... rest of code
```

---

## 💾 Vấn đề Database

### ❌ Lỗi: "Database locked" hoặc "SQLite error"

**Nguyên nhân:** Backend đang chạy hoặc database đã corrupt

**Giải pháp:**

```powershell
# Tắt backend trước

# Xóa database cũ
Remove-Item database.sqlite -ErrorAction SilentlyContinue

# Hoặc trên PowerShell
rm database.sqlite

# Chạy lại backend - nó sẽ tự tạo database mới
python -m uvicorn backend.main:app --reload
```

### ❌ Lỗi: "Table already exists" hoặc "Schema mismatch"

**Giải pháp:**

```powershell
# Tắt backend

# Xóa file database
rm database.sqlite

# Chạy lại backend
python -m uvicorn backend.main:app --reload
```

### ❌ Lỗi: "ConnectionError: could not connect to database"

**Nguyên nhân:** Chưa cấu hình DATABASE_URL hoặc PostgreSQL không chạy

**Giải pháp:**

1. **Nếu dùng SQLite (local development):**
   - Không cần làm gì, backend sẽ tự tạo

2. **Nếu dùng PostgreSQL:**

   ```powershell
   # Chắc chắn PostgreSQL đang chạy
   # Hoặc start Docker
   docker-compose up db -d

   # Kiểm tra connection
   psql -U sbdcs_user -d sbdcs -h localhost
   ```

---

## 🐳 Vấn đề Docker

### ❌ Lỗi: "Docker daemon not running" hoặc "Cannot connect to Docker"

**Giải pháp:**

```powershell
# Chắc chắn Docker Desktop đang chạy
# Hoặc khởi động Docker
# Kiểm tra status
docker ps
```

### ❌ Lỗi: "Port 5432 already in use" (PostgreSQL)

**Giải pháp:**

```powershell
# Tìm process sử dụng port
netstat -ano | findstr :5432

# Kill process
taskkill /PID <PID> /F

# Hoặc dừng container Docker
docker-compose down

# Hoặc chạy PostgreSQL trên port khác
# Chỉnh sửa docker-compose.yml:
# ports:
#   - "5433:5432"
```

### ❌ Lỗi: "build context cannot be empty"

**Giải pháp:**

```powershell
# Chắc chắn bạn ở thư mục gốc
cd c:\Users\ADMIN\SBDCS_2

# Kiểm tra Dockerfile.backend tồn tại
dir Dockerfile.backend

# Rồi build
docker-compose build
docker-compose up -d
```

---

## 🔌 Vấn đề Port

### ❌ Lỗi: "Bind: Address already in use"

**Nguyên nhân:** Port đã được sử dụng bởi process khác

**Giải pháp - Windows:**

```powershell
# Kiểm tra process sử dụng port
netstat -ano | findstr :<PORT>

# Ví dụ port 3000:
netstat -ano | findstr :3000

# Output: TCP  127.0.0.1:3000  0.0.0.0:0  LISTENING  12345

# Kill process theo PID
taskkill /PID 12345 /F
```

**Giải pháp - Chạy trên port khác:**

```powershell
# Backend
python -m uvicorn backend.main:app --port 8001 --reload

# Frontend - chỉnh vite.config.js:
# export default {
#   server: {
#     port: 3001
#   }
# }
```

### ❌ Lỗi: "EADDRINUSE" khi chạy npm

**Giải pháp:**

```powershell
# Giống như trên, tìm process sử dụng port 3000
netstat -ano | findstr :3000

# Kill nó
taskkill /PID <PID> /F

# Hoặc chạy npm trên port khác
set VITE_PORT=3001
npm run dev
```

---

## 🎯 Các Bước Debug Chung

1. **Kiểm tra terminal logs:**
   - Backend: Xem output của `uvicorn`
   - Frontend: Xem output của `npm run dev`

2. **Kiểm tra browser console:**
   - Nhấn `F12` trong browser
   - Xem "Console" tab cho JavaScript errors

3. **Kiểm tra API:**
   - Truy cập `http://127.0.0.1:8000/docs`
   - Thử một endpoint

4. **Kiểm tra network:**
   - Mở DevTools (F12)
   - Mở "Network" tab
   - Thực hiện action
   - Xem request/response

5. **Kiểm tra cấu trúc file:**

   ```powershell
   # Kiểm tra backend
   dir backend

   # Kiểm tra frontend
   dir frontend
   ```

---

## 📞 Cần Giúp?

- Kiểm tra [README.md](./README.md) cho hướng dẫn tổng quát
- Kiểm tra [QUICK_START.md](./QUICK_START.md) cho cài đặt nhanh
- Xem logs chi tiết từ terminal hoặc browser console
- Thử lại từ đầu nếu vẫn lỗi

---

**💡 Mẹo:** Khi báo cáo lỗi, hãy cung cấp:

1. Error message đầy đủ
2. Terminal output
3. Kết quả của `python --version`, `node --version`, `npm --version`
4. Hệ điều hành (Windows 10/11, etc.)
