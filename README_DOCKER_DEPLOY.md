# SBDCs — Docker & Deploy Guide

## 1. Chạy bằng Docker Compose local

Mở terminal tại thư mục gốc project:

```bash
cd SBDCs_FINAL_COMPLETE
```

Build và chạy:

```bash
docker compose up --build
```

Mở web:

```text
http://localhost:3000
```

Backend API:

```text
http://localhost:8000/docs
```

## 2. Tài khoản demo

Donor:

```text
0900000002
```

Hospital:

```text
hospital@sbdcs.com
Admin@123
```

## 3. Chạy nền

```bash
docker compose up --build -d
```

Xem log:

```bash
docker compose logs -f
```

Dừng:

```bash
docker compose down
```

## 4. Dữ liệu có bị mất khi redeploy không?

Không, nếu giữ nguyên các volume/folder này:

```text
./data      -> lưu database.sqlite
./uploads   -> lưu avatar và ảnh trang chủ
```

Khi sửa code và deploy lại:

```bash
docker compose up --build -d
```

## 5. Development mode bằng Docker

Nếu muốn sửa code có reload:

```bash
docker compose -f docker-compose.dev.yml up --build
```

Frontend:

```text
http://localhost:3000
```

Backend:

```text
http://localhost:8000/docs
```

## 6. Deploy lên VPS Ubuntu

Cài Docker và Docker Compose plugin trên VPS, sau đó:

```bash
git clone <repo-cua-ban>
cd <repo-cua-ban>
docker compose up --build -d
```

Mở port:

```text
3000 cho frontend
8000 cho backend docs nếu cần
```

Khuyến nghị production thật: chỉ expose port 80/443 qua Nginx reverse proxy, không public port 8000.

## 7. Production nâng cao

Với sản phẩm thật nên đổi SQLite sang PostgreSQL. Bản Docker hiện tại dùng SQLite để phù hợp demo/đồ án và dễ chạy.
