# Demo data 50 người hiến máu

File `seed_demo_50.py` dùng để sinh dữ liệu demo giống thật hơn cho buổi trình bày.

## Chạy khi dùng Python local

```bash
cd SBDCs
python seed_demo_50.py
```

## Chạy khi dùng Docker

Sau khi `docker compose up --build`, mở terminal khác:

```bash
docker compose exec backend python seed_demo_50.py
```

Nếu tên service trong `docker-compose.yml` là `sbdcs_backend` thay vì `backend`, dùng:

```bash
docker exec -it sbdcs_backend python seed_demo_50.py
```

## Dữ liệu được tạo

- 50 donor demo: `0920000001` đến `0920000050`
- Lịch hẹn quá khứ và sắp tới
- Lịch sử nhập/xuất kho máu 9 tháng
- Dữ liệu đủ để xem biểu đồ dự báo kho máu tháng tới

## Tài khoản demo

Donor:

```text
0920000001
```

Hospital:

```text
hospital@sbdcs.com
Admin@123
```
