# 🔧 Hướng dẫn Fix CORS Error - Bước từng bước

## ❌ Lỗi hiện tại
```
Access to XMLHttpRequest at 'https://lunamatcha.onrender.com/api/products' 
from origin 'https://luna-matcha.vercel.app' 
has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## ✅ Giải pháp - Làm theo từng bước

### Bước 1: Commit và Push code mới lên GitHub

Code đã được sửa để fix CORS. Bạn cần:

```bash
# Kiểm tra thay đổi
git status

# Add tất cả thay đổi
git add .

# Commit
git commit -m "Fix CORS - allow all origins for production"

# Push lên GitHub
git push origin main
```

### Bước 2: Kiểm tra Render đã pull code mới chưa

1. Vào **Render Dashboard** → Service `lunamatcha`
2. Vào tab **"Events"** hoặc **"Logs"**
3. Kiểm tra xem có **"New commit detected"** không
4. Nếu có, Render sẽ tự động redeploy
5. Nếu không, click **"Manual Deploy"** → **"Deploy latest commit"**

### Bước 3: Đợi Render redeploy xong

- Thời gian: 5-10 phút
- Kiểm tra status: Render Dashboard → Service → Status phải là **"Live"**
- Kiểm tra logs: Không có lỗi

### Bước 4: Test lại

1. **Test backend health check:**
   ```
   https://lunamatcha.onrender.com/api/health
   ```
   Phải trả về: `{"message":"Server is running"}`

2. **Test CORS headers:**
   Mở Browser Console (F12) → Network tab
   - Click vào request đến `/api/products`
   - Xem Response Headers
   - Phải có: `Access-Control-Allow-Origin: *` hoặc `Access-Control-Allow-Origin: https://luna-matcha.vercel.app`

3. **Test frontend:**
   - Refresh trang `https://luna-matcha.vercel.app`
   - Mở Console (F12)
   - Không còn lỗi CORS
   - Sản phẩm load được

## 🔍 Nếu vẫn lỗi - Debug Steps

### Kiểm tra 1: Render Environment Variables

1. Vào Render → Service → **"Environment"** tab
2. Kiểm tra có biến `FRONTEND_URL` không
3. Nếu có, có thể tạm thời **xóa** hoặc set = `*` để test
4. Save và đợi redeploy

### Kiểm tra 2: Render Logs

1. Vào Render → Service → **"Logs"** tab
2. Xem có lỗi gì không:
   - MongoDB connection error?
   - Cloudinary error?
   - CORS error trong logs?

### Kiểm tra 3: Code đã được deploy chưa

1. Vào Render → Service → **"Events"** tab
2. Xem commit hash mới nhất
3. So sánh với commit trên GitHub
4. Nếu khác → Click **"Manual Deploy"**

### Kiểm tra 4: Test trực tiếp với curl

Mở terminal và chạy:

```bash
# Test OPTIONS request (preflight)
curl -X OPTIONS \
  -H "Origin: https://luna-matcha.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  -v \
  https://lunamatcha.onrender.com/api/products

# Phải thấy trong response:
# < Access-Control-Allow-Origin: https://luna-matcha.vercel.app
# < Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

## 🚨 Nếu vẫn không được

### Option 1: Restart Service

1. Vào Render → Service
2. Click **"Manual Deploy"** → **"Clear build cache & deploy"**
3. Đợi redeploy xong

### Option 2: Kiểm tra code trong Render

1. Vào Render → Service → **"Settings"**
2. Xem **"Build Command"** và **"Start Command"**
3. Đảm bảo:
   - Build Command: `npm install`
   - Start Command: `npm start`

### Option 3: Kiểm tra file server.js

Đảm bảo file `backend/src/server.js` có code CORS mới nhất (đã được sửa ở trên).

## ✅ Checklist

- [ ] Code đã được commit và push lên GitHub
- [ ] Render đã detect commit mới
- [ ] Render đã redeploy xong (status = Live)
- [ ] Health check endpoint hoạt động
- [ ] CORS headers xuất hiện trong response
- [ ] Frontend không còn lỗi CORS
- [ ] Sản phẩm load được

## 💡 Tips

- Render free tier có thể chậm khi wake up
- Đợi ít nhất 5 phút sau khi redeploy
- Clear browser cache nếu cần
- Test trên incognito mode để tránh cache



