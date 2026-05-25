# Cloudinary Setup Guide

## Bước 1: Tạo tài khoản Cloudinary (Miễn phí)

1. Vào https://cloudinary.com/users/register/free
2. Đăng ký tài khoản (hoặc đăng nhập nếu đã có)
3. Sau khi xác nhận email, bạn sẽ vào dashboard

## Bước 2: Lấy CLOUDINARY_URL

1. Vào https://cloudinary.com/console/settings/api
2. Copy **API Environment variable** (dòng bắt đầu bằng `cloudinary://`)
3. Ví dụ: `cloudinary://123456789:abc-def-ghi@cloud-name`

## Bước 3: Cấu hình Vercel

1. Vào Vercel dashboard → Project → Settings → Environment Variables
2. Thêm biến mới:
   - **Name:** `CLOUDINARY_URL`
   - **Value:** Paste giá trị từ Bước 2
   - **Environments:** Production, Preview, Development (chọn tất cả)
3. Click "Save"

## Bước 4: Deploy

1. Trigger redeploy trên Vercel (hoặc push code mới)
2. Xong! Ảnh sẽ được upload lên Cloudinary thay vì local folder

## Hỗ trợ trong quá trình phát triển

Nếu muốn test local:

```bash
# 1. Copy .env.example thành .env
cp .env.example .env

# 2. Sửa CLOUDINARY_URL trong .env với giá trị của bạn

# 3. Run backend
cd backend
python -m uvicorn main:app --reload
```

## Lợi ích của Cloudinary

✅ **Miễn phí:** Không có phí upload, chỉ tính phí nếu vượt quota  
✅ **Tự động optimize:** Ảnh tự động nén và tối ưu  
✅ **CDN toàn cầu:** Ảnh tải nhanh ở mọi nơi  
✅ **Responsive images:** Tự động tạo nhiều size ảnh  
✅ **Bảo mật:** Đường link trực tiếp từ Cloudinary server
