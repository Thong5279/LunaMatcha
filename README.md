# Luna Matcha - Hệ thống quản lý bán nước mang đi

## Cấu trúc Ports

- **Backend API**: Chạy trên port **5005**
  - File: `backend/.env`
  - Biến: `PORT=5005`

- **Frontend Dev Server**: Chạy trên port **5173** (Vite mặc định)
  - File: `frontend/.env`
  - Biến: `VITE_API_URL=http://localhost:5005` (URL của backend API)

**Lưu ý**: `VITE_API_URL` không phải là port của frontend, mà là URL của backend API mà frontend sẽ gọi đến.

## Cài đặt

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

## Chạy dự án

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```
Backend sẽ chạy tại: http://localhost:5005

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```
Frontend sẽ chạy tại: http://localhost:5173

## Environment Variables

### Backend (.env)
```
PORT=5005
MONGGODB_CONNECTIONSTRING=mongodb+srv://...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5005
```

## Tính năng

- ✅ CRUD sản phẩm với upload ảnh Cloudinary
- ✅ Quản lý topping
- ✅ Chế độ bán hàng (chọn sản phẩm, topping, số lượng, ghi chú)
- ✅ Quản lý đơn hàng (xem, sửa, xóa, làm lại)
- ✅ Thống kê (ngày/tuần/tháng/quý/năm, so sánh, top sản phẩm)
- ✅ Tối ưu cho iPhone 14 Pro Max

