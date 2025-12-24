# 🔧 Sửa lỗi CORS và 502 Bad Gateway

## ❌ Vấn đề hiện tại

1. **CORS Error**: Frontend không thể kết nối với backend
2. **502 Bad Gateway**: Backend có thể đang sleep hoặc chưa sẵn sàng

## ✅ Giải pháp

### Bước 1: Cập nhật CORS trong Backend (Render)

1. Vào **Render Dashboard** → Chọn service `lunamatcha`
2. Vào tab **"Environment"**
3. Kiểm tra và cập nhật biến môi trường:

```
FRONTEND_URL=https://luna-matcha.vercel.app
```

**Lưu ý**: 
- Không có dấu `/` ở cuối URL
- URL phải chính xác 100%

4. Click **"Save Changes"**
5. Render sẽ tự động **redeploy** (đợi 5-10 phút)

### Bước 2: Kiểm tra Backend đã sẵn sàng chưa

**502 Bad Gateway** thường xảy ra khi:
- Backend đang sleep (Render free tier)
- Backend đang build/redeploy
- Backend có lỗi

**Cách kiểm tra:**

1. Truy cập: `https://lunamatcha.onrender.com/api/health`
2. Nếu thấy `{"message":"Server is running"}` → Backend OK
3. Nếu thấy 502 hoặc timeout → Đợi thêm vài phút (có thể đang wake up)

### Bước 3: Test lại sau khi redeploy

1. Đợi Render redeploy xong (check logs)
2. Test health check: `https://lunamatcha.onrender.com/api/health`
3. Refresh frontend và test lại

### Bước 4: Nếu vẫn lỗi CORS

Nếu sau khi redeploy vẫn còn lỗi CORS, thử:

1. **Option 1**: Thêm nhiều origins (nếu có nhiều domain)
   ```
   FRONTEND_URL=https://luna-matcha.vercel.app,https://luna-matcha-git-main.vercel.app
   ```

2. **Option 2**: Kiểm tra code đã được push lên GitHub chưa
   - Code mới nhất đã có CORS fix
   - Render sẽ pull code mới khi redeploy

3. **Option 3**: Manual redeploy
   - Vào Render → Click **"Manual Deploy"** → **"Deploy latest commit"**

## 🔍 Debug Steps

### Kiểm tra CORS headers

Mở Browser Console (F12) → Network tab:
- Xem request đến backend
- Kiểm tra Response Headers có `Access-Control-Allow-Origin` không

### Kiểm tra Backend Logs

1. Vào Render Dashboard
2. Tab **"Logs"**
3. Xem có lỗi gì không
4. Kiểm tra MongoDB connection
5. Kiểm tra Cloudinary connection

### Test API trực tiếp

```bash
# Test health check
curl https://lunamatcha.onrender.com/api/health

# Test với CORS header
curl -H "Origin: https://luna-matcha.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://lunamatcha.onrender.com/api/products
```

## 📝 Checklist

- [ ] FRONTEND_URL đã được set đúng trong Render
- [ ] Backend đã redeploy xong
- [ ] Health check endpoint hoạt động
- [ ] Code mới nhất đã được push lên GitHub
- [ ] Đã đợi đủ thời gian (5-10 phút sau khi redeploy)
- [ ] Đã clear browser cache và test lại

## 🚨 Nếu vẫn không được

1. **Kiểm tra Render Logs** xem có lỗi gì
2. **Kiểm tra MongoDB** connection string có đúng không
3. **Kiểm tra Cloudinary** credentials có đúng không
4. **Thử restart** service trong Render
5. **Kiểm tra** code đã được commit và push lên GitHub chưa

## 💡 Tips

- Render free tier có thể sleep sau 15 phút không hoạt động
- Lần đầu wake up có thể mất 30-60 giây
- Nên upgrade Render nếu cần production ổn định


