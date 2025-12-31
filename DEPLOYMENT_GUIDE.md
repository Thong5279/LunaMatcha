# Hướng dẫn Deploy Luna Matcha

## 📋 Tổng quan

- **Backend**: Deploy lên Render
- **Frontend**: Deploy lên Vercel
- **Database**: MongoDB Atlas (đã có)
- **Image Storage**: Cloudinary (đã có)

---

## 🔧 Bước 1: Chuẩn bị trước khi deploy

### 1.1. Kiểm tra code và test local

```bash
# Test backend
cd backend
npm install
npm start
# Kiểm tra http://localhost:5005/api/health

# Test frontend
cd frontend
npm install
npm run build
npm run preview
# Kiểm tra http://localhost:4173
```

### 1.2. Commit code cuối cùng

```bash
# Kiểm tra status
git status

# Add tất cả thay đổi
git add .

# Commit
git commit -m "Prepare for deployment - final version"

# Push lên GitHub
git push origin main
```

---

## 🚀 Bước 2: Deploy Backend lên Render

### 2.1. Tạo tài khoản và service trên Render

1. Truy cập https://render.com và đăng nhập
2. Click **"New +"** → **"Web Service"**
3. Kết nối repository GitHub của bạn
4. Chọn repository `LunaMatcha`

### 2.2. Cấu hình Backend Service

**Basic Settings:**
- **Name**: `luna-matcha-backend` (hoặc tên bạn muốn)
- **Region**: Singapore (gần Việt Nam nhất)
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Environment Variables:**
Thêm các biến môi trường sau:

```
NODE_ENV=production
PORT=5005
MONGGODB_CONNECTIONSTRING=mongodb+srv://numuanuocnoi_db_user:YAVYlADRyMcz1ZmU@cluster0.7mxnkxy.mongodb.net/?appName=Cluster0
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
FRONTEND_URL=https://your-frontend-name.vercel.app
```

**Lưu ý**: 
- Thay `FRONTEND_URL` bằng URL Vercel của bạn (sẽ có sau khi deploy frontend)
- Giữ nguyên `MONGGODB_CONNECTIONSTRING` nếu đã có
- Điền thông tin Cloudinary của bạn

### 2.3. Deploy và lấy URL

1. Click **"Create Web Service"**
2. Render sẽ tự động build và deploy
3. Đợi deploy xong (khoảng 5-10 phút)
4. Copy **URL** của service (ví dụ: `https://luna-matcha-backend.onrender.com`)
5. Test health check: `https://your-backend-url.onrender.com/api/health`

---

## 🌐 Bước 3: Deploy Frontend lên Vercel

### 3.1. Tạo tài khoản và project trên Vercel

1. Truy cập https://vercel.com và đăng nhập
2. Click **"Add New..."** → **"Project"**
3. Import repository GitHub `LunaMatcha`

### 3.2. Cấu hình Frontend Project

**Framework Preset:**
- **Framework Preset**: `Vite`

**Root Directory:**
- **Root Directory**: `frontend`

**Build Settings:**
- **Build Command**: `npm run build` (tự động detect)
- **Output Directory**: `dist` (tự động detect)
- **Install Command**: `npm install` (tự động detect)

**Environment Variables:**
Thêm biến môi trường:

```
VITE_API_URL=https://your-backend-name.onrender.com
```

**Lưu ý**: Thay `your-backend-name.onrender.com` bằng URL backend thực tế từ Render

### 3.3. Deploy

1. Click **"Deploy"**
2. Vercel sẽ tự động build và deploy
3. Đợi deploy xong (khoảng 2-5 phút)
4. Copy **URL** của project (ví dụ: `https://luna-matcha.vercel.app`)

### 3.4. Cập nhật CORS trên Backend

Sau khi có URL frontend từ Vercel:

1. Quay lại Render → Backend service
2. Vào **"Environment"** tab
3. Cập nhật `FRONTEND_URL` = URL Vercel của bạn
4. Click **"Save Changes"** → Render sẽ tự động redeploy

---

## ✅ Bước 4: Kiểm tra và Test

### 4.1. Test Backend

```bash
# Health check
curl https://your-backend-url.onrender.com/api/health

# Nên trả về: {"message":"Server is running"}
```

### 4.2. Test Frontend

1. Truy cập URL Vercel của bạn
2. Mở Developer Tools (F12) → Console
3. Kiểm tra:
   - Không có lỗi CORS
   - API calls thành công
   - Images load được
   - Tất cả chức năng hoạt động

### 4.3. Test các chức năng chính

- ✅ Thêm/sửa/xóa sản phẩm
- ✅ Upload ảnh lên Cloudinary
- ✅ Tạo đơn hàng
- ✅ Xem thống kê
- ✅ Ca làm việc
- ✅ Celebration modal

---

## 🔄 Bước 5: Cập nhật sau khi deploy

### 5.1. Cập nhật CORS (nếu cần)

Nếu có lỗi CORS, kiểm tra `backend/src/server.js`:

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
```

### 5.2. Kiểm tra Static Files

Đảm bảo logo được copy vào `frontend/public/img/` hoặc sử dụng đường dẫn đúng.

---

## 🐛 Troubleshooting

### Lỗi CORS
- Kiểm tra `FRONTEND_URL` trong Render đã đúng chưa
- Kiểm tra URL frontend trong Vercel environment variables

### Lỗi API không kết nối được
- Kiểm tra `VITE_API_URL` trong Vercel
- Kiểm tra backend đã deploy thành công chưa
- Kiểm tra health check endpoint

### Lỗi upload ảnh
- Kiểm tra Cloudinary credentials trong Render
- Kiểm tra CORS settings cho Cloudinary

### Lỗi database
- Kiểm tra MongoDB connection string
- Kiểm tra network access trong MongoDB Atlas

---

## 📝 Checklist trước khi deploy

- [ ] Code đã được test local
- [ ] Tất cả dependencies đã được cài đặt
- [ ] Environment variables đã được chuẩn bị
- [ ] Backend build thành công
- [ ] Frontend build thành công
- [ ] Đã commit và push code lên GitHub
- [ ] Đã có MongoDB Atlas connection string
- [ ] Đã có Cloudinary credentials
- [ ] Đã tạo tài khoản Render
- [ ] Đã tạo tài khoản Vercel

---

## 🎉 Hoàn thành!

Sau khi deploy xong, bạn sẽ có:
- Backend URL: `https://your-backend-name.onrender.com`
- Frontend URL: `https://your-frontend-name.vercel.app`

**Lưu ý**: 
- Render free tier có thể sleep sau 15 phút không hoạt động (lần đầu truy cập sẽ chậm)
- Vercel free tier rất nhanh và không có giới hạn sleep
- Nếu cần, có thể upgrade Render để tránh sleep

---

## 📞 Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
1. Logs trong Render dashboard
2. Logs trong Vercel dashboard
3. Browser console (F12)
4. Network tab trong Developer Tools




