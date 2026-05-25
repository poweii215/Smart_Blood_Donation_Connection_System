# 🚀 Hướng Dẫn Deploy SBDCS Lên Vercel

> Fix lỗi "Permission denied" và deploy thành công

---

## ❌ Lỗi Gặp Phải

```
sh: line 1: /vercel/path0/frontend/node_modules/.bin/vite: Permission denied
Error: Command "npm run build" exited with 126
```

**Nguyên nhân:** node_modules hoặc file được commit vào Git làm mất permission

---

## ✅ Giải Pháp

### Bước 1: Kiểm tra .gitignore

Đảm bảo `.gitignore` chứa:

```
node_modules/
dist/
.env
.env.local
```

**Tệp `.gitignore` đã được tạo/cập nhật tự động**

### Bước 2: Clean Git (Nếu node_modules đã commit)

Nếu bạn đã commit `node_modules`, cần xóa nó khỏi Git history:

```powershell
# Windows - Command Prompt
git rm -r --cached node_modules
git rm -r --cached frontend/node_modules
git commit -m "Remove node_modules from git"
git push
```

**Hoặc nếu chỉ frontend:**

```powershell
git rm -r --cached frontend/node_modules
git commit -m "Remove frontend node_modules"
git push
```

### Bước 3: Cấu hình Build trên Vercel

**Tùy chọn A: Sử dụng vercel.json (Khuyến nghị)**

Tệp `vercel.json` đã được tạo tự động ở thư mục gốc

**Tùy chọn B: Cấu hình qua Vercel Dashboard**

1. Truy cập [vercel.com](https://vercel.com)
2. Chọn project SBDCS
3. Vào **Settings**
4. Chọn **Build & Development Settings**
5. Thiết lập:
   - **Build Command:** `cd frontend && npm install && npm run build`
   - **Output Directory:** `frontend/dist`
   - **Install Command:** `npm install --legacy-peer-deps`

### Bước 4: Push Code

```powershell
git add .
git commit -m "Fix Vercel deployment - add .gitignore and vercel.json"
git push
```

Vercel sẽ tự động redeploy

---

## 🔧 Cấu Hình Chi Tiết

### vercel.json

```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "frontend/dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "frontend/dist/index.html"
    }
  ],
  "env": {
    "VITE_API_BASE_URL": "@vite_api_base_url"
  }
}
```

### package.json (Build script)

Thêm vào nếu chưa có:

```json
"scripts": {
  "build": "vite build"
}
```

---

## 🌐 Environment Variables

Nếu frontend cần gọi API từ backend khác:

1. **Tạo file `frontend/.env.production`:**

```
VITE_API_BASE_URL=https://your-backend-api.com
```

2. **Hoặc trên Vercel Dashboard:**
   - Settings → Environment Variables
   - Thêm: `VITE_API_BASE_URL=https://your-backend-api.com`

3. **Sử dụng trong frontend:**

```javascript
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
```

---

## ✅ Bước Kiểm Tra

- [ ] `.gitignore` chứa `node_modules/` và `dist/`
- [ ] `node_modules` không có trong Git
- [ ] `vercel.json` tồn tại ở thư mục gốc
- [ ] `frontend/package.json` có script `build`
- [ ] Environment variables (nếu cần) đã set
- [ ] Push code lên Git
- [ ] Vercel tự động deploy
- [ ] Build thành công ✅
- [ ] Frontend hoạt động tại https://your-project.vercel.app

---

## 🆘 Nếu Lỗi Vẫn Xảy Ra

### Lỗi: Permission denied

**Giải pháp:**

```powershell
# Xóa node_modules khỏi Git history
git filter-branch --tree-filter 'rm -rf node_modules frontend/node_modules' -f -- --all
git push origin master --force
```

⚠️ **Cảnh báo:** `--force` sẽ đánh đổi git history. Chỉ dùng nếu không ai khác đang làm việc.

### Lỗi: Cannot find module

**Giải pháp:**

- Đảm bảo `npm install` chạy trước `npm run build`
- Thêm `--legacy-peer-deps` nếu cần:

```json
"install": "npm install --legacy-peer-deps"
```

### Lỗi: Vite not found

**Giải pháp:**

- Kiểm tra `vite` trong `package.json` devDependencies
- Chạy `npm install` locally để test
- Xóa `package-lock.json` cũ nếu cần

### Build timeout

**Giải pháp:**

- Tăng memory: Vercel Pro plan
- Optimize build: `npm run build` nên nhanh < 1 min
- Xóa unused dependencies

---

## 📋 Deployment Checklist

```
Trước deploy:
- [ ] Kiểm tra code chạy local (npm run build)
- [ ] Xóa node_modules khỏi Git
- [ ] Tạo .gitignore
- [ ] Tạo vercel.json
- [ ] Add environment variables (nếu cần)
- [ ] Commit & push

Deploy:
- [ ] Vercel tự động detect
- [ ] Build chạy
- [ ] Build thành công
- [ ] Deploy thành công
- [ ] Test frontend tại URL

Sau deploy:
- [ ] Kiểm tra tất cả routes
- [ ] Kiểm tra API calls (network tab)
- [ ] Kiểm tra console (F12)
- [ ] Test trên mobile
```

---

## 🎯 Full Deployment Flow

```powershell
# 1. Local - Test build
cd frontend
npm install
npm run build

# 2. Check build
# Xem folder dist tạo thành công

# 3. Commit & Push
cd ..
git add .
git commit -m "Ready to deploy on Vercel"
git push

# 4. Vercel tự động deploy
# Xem build logs trên Vercel Dashboard

# 5. Test
# https://your-project.vercel.app
```

---

## 📊 So Sánh: Local vs Vercel

| Aspect       | Local        | Vercel        |
| ------------ | ------------ | ------------- |
| Node version | Your version | 20.x LTS      |
| npm version  | Your version | Latest        |
| Build time   | Depends      | < 1 min       |
| Cache        | Local        | Vercel cache  |
| Permissions  | Your OS      | Linux         |
| node_modules | Local        | Fresh install |

---

## 💡 Tips

- 🔍 Xem build logs trong Vercel Dashboard
- 📝 Tạo `build.log` file locally: `npm run build > build.log 2>&1`
- 🔄 Redeploy: Vercel Dashboard → Deployments → Redeploy
- 🌳 Branch preview: Push to non-main branch để test
- 📌 Production: Deploy từ main branch

---

## 🔗 Resources

- [Vercel Docs](https://vercel.com/docs)
- [Vite Docs](https://vitejs.dev/)
- [React on Vercel](https://vercel.com/docs/frameworks/react)

---

**✅ Deployment ready! 🚀**
