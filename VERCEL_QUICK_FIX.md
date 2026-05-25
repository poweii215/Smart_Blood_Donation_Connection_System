# 🔧 FIX NHANH: Vercel Permission Denied Error

> Giải quyết lỗi `Permission denied` khi deploy trên Vercel

---

## ⚡ Fix Nhanh (5 phút)

### Bước 1: Xóa node_modules khỏi Git

```powershell
# Nếu node_modules đã commit vào Git
git rm -r --cached node_modules
git rm -r --cached frontend/node_modules
git commit -m "Remove node_modules"
git push
```

### Bước 2: Đảm bảo .gitignore đúng

Tệp `.gitignore` đã được cập nhật tự động với:

```
node_modules/
dist/
.env
```

### Bước 3: Vercel sẽ tự động redeploy

Trong vòng vài phút, Vercel sẽ detect thay đổi và build lại.

---

## ✅ Kiểm Tra

```
Vercel Dashboard → Deployments → Xem logs
Nếu thấy: ✅ Build successful → Fix xong!
```

---

## 🆘 Nếu vẫn lỗi

### Cách 1: Force redeploy

Vercel Dashboard:

1. Chọn project
2. Vào **Deployments**
3. Nhấn **...** trên deployment mới nhất
4. Chọn **Redeploy**

### Cách 2: Clear cache & redeploy

Vercel Dashboard → Settings → Git → Clear cache → Redeploy

### Cách 3: Test build local

```powershell
cd frontend
npm install --legacy-peer-deps
npm run build

# Nếu error → fix local trước
# Nếu OK → push lên, Vercel cũng OK
```

---

## 📝 Lệnh Quick Reference

```powershell
# Clean & push
git rm -r --cached node_modules frontend/node_modules
git add .gitignore
git commit -m "Fix Vercel build"
git push

# Check status
git status

# View recent commits
git log --oneline -5
```

---

**Xong! Vercel sẽ deploy thành công! 🎉**
