# Hướng dẫn Setup Keep-Alive cho Render Server

## Vấn đề
Render free tier tự động sleep sau 15 phút không hoạt động, gây ra delay 2-5 phút khi wake up.

## Giải pháp
Setup keep-alive ping để gửi request đến server mỗi 10-14 phút, giữ server không sleep.

## Cách setup

### Option 1: UptimeRobot (Khuyến nghị - Miễn phí)

1. Truy cập https://uptimerobot.com và đăng ký tài khoản miễn phí
2. Click **"Add New Monitor"**
3. Cấu hình:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: Luna Matcha Backend Keep-Alive
   - **URL**: `https://your-backend-url.onrender.com/api/health`
   - **Monitoring Interval**: 5 minutes (free tier cho phép)
   - **Alert Contacts**: Có thể bỏ qua hoặc thêm email
4. Click **"Create Monitor"**
5. Monitor sẽ tự động ping server mỗi 5 phút, giữ server không sleep

**Lưu ý**: UptimeRobot free tier cho phép 50 monitors và check mỗi 5 phút (đủ để giữ server không sleep).

### Option 2: Cron-job.org (Miễn phí - Unlimited)

1. Truy cập https://cron-job.org và đăng ký tài khoản miễn phí
2. Click **"Create cronjob"**
3. Cấu hình:
   - **Title**: Luna Matcha Backend Keep-Alive
   - **Address**: `https://your-backend-url.onrender.com/api/health`
   - **Schedule**: Chọn "Every 10 minutes" hoặc custom cron: `*/10 * * * *`
   - **Request Method**: GET
4. Click **"Create"**
5. Cron job sẽ tự động chạy mỗi 10 phút

### Option 3: EasyCron (Miễn phí - 1 job)

1. Truy cập https://www.easycron.com và đăng ký tài khoản miễn phí
2. Click **"Add Cron Job"**
3. Cấu hình:
   - **Cron Job Name**: Luna Matcha Backend Keep-Alive
   - **URL**: `https://your-backend-url.onrender.com/api/health`
   - **Schedule**: `*/10 * * * *` (mỗi 10 phút)
4. Click **"Add"**

## Kiểm tra

Sau khi setup, kiểm tra:
1. Vào dashboard của service bạn chọn
2. Xem logs/history để đảm bảo requests đang được gửi
3. Test bằng cách đợi 20 phút rồi truy cập website - không còn delay nữa

## Lưu ý

- Thay `your-backend-url.onrender.com` bằng URL backend thực tế của bạn
- Nên setup ngay sau khi deploy để tránh server sleep
- Nếu vẫn còn vấn đề, có thể giảm interval xuống 5 phút (nếu service cho phép)

