# Hướng dẫn Verify và Test Performance Optimization

## Các tối ưu đã thực hiện

1. ✅ **Database Indexes** - Thêm indexes cho `createdAt` trong Product và Topping models
2. ✅ **Response Compression** - Thêm compression middleware (gzip) cho tất cả responses
3. ✅ **Field Projection** - Chỉ select fields cần thiết trong queries, sử dụng `.lean()`
4. ✅ **Parallel API Calls** - Prefetch products và toppings song song với Promise.all()
5. ✅ **Topping Context Cache** - Cache toppings trong context để SellMode không cần fetch lại
6. ⚠️ **Keep-Alive Service** - Cần setup thủ công (xem KEEP_ALIVE_SETUP.md)

## Cách Verify

### 1. Verify Keep-Alive Service (CRITICAL)

**Kiểm tra**:
- Vào dashboard của UptimeRobot/Cron-job.org
- Xem logs/history để đảm bảo requests đang được gửi mỗi 10 phút
- Test: Đợi 20 phút rồi truy cập website - không còn delay nữa

**Nếu chưa setup**:
- Xem hướng dẫn trong `KEEP_ALIVE_SETUP.md`
- Setup ngay để tránh server sleep

### 2. Verify Response Compression

**Kiểm tra trong Browser DevTools**:
1. Mở DevTools (F12)
2. Vào tab **Network**
3. Reload trang
4. Click vào một API request (ví dụ: `/api/products`)
5. Vào tab **Headers**
6. Tìm **Response Headers**
7. Kiểm tra có header `Content-Encoding: gzip` không

**Kết quả mong đợi**:
- ✅ Có `Content-Encoding: gzip`
- Response size giảm 60-80% so với không compress

### 3. Verify Database Indexes

**Kiểm tra trong MongoDB**:
```javascript
// Kết nối MongoDB và chạy:
db.products.getIndexes()
db.toppings.getIndexes()
```

**Kết quả mong đợi**:
- ✅ Có index cho `createdAt: -1` trong cả Product và Topping collections

**Hoặc test query performance**:
- Query time giảm từ 50-100ms xuống 5-10ms

### 4. Verify Field Projection

**Kiểm tra trong Browser DevTools**:
1. Mở DevTools (F12)
2. Vào tab **Network**
3. Reload trang
4. Click vào `/api/products` hoặc `/api/toppings`
5. Vào tab **Response**
6. Kiểm tra response data

**Kết quả mong đợi**:
- ✅ Không có field `__v` trong response
- ✅ Chỉ có các fields cần thiết (name, priceSmall, priceLarge, image, description, createdAt, updatedAt)

### 5. Verify Parallel API Calls

**Kiểm tra trong Browser DevTools**:
1. Mở DevTools (F12)
2. Vào tab **Network**
3. Reload trang
4. Xem timeline của các requests

**Kết quả mong đợi**:
- ✅ `/api/products` và `/api/toppings` được gọi song song (cùng lúc)
- ✅ Tổng thời gian = max(products, toppings) thay vì sum

### 6. Verify Topping Context Cache

**Kiểm tra**:
1. Mở DevTools (F12)
2. Vào tab **Network**
3. Reload trang Home
4. Xem có request `/api/toppings` không
5. Click vào "Bán" (SellMode)
6. Xem có request `/api/toppings` lần 2 không

**Kết quả mong đợi**:
- ✅ Chỉ có 1 request `/api/toppings` khi load Home page
- ✅ Không có request `/api/toppings` lần 2 khi vào SellMode (sử dụng cached data)

### 7. Test Load Time

**Test với cache (subsequent loads)**:
1. Mở website lần đầu
2. Đợi load xong
3. Reload trang (F5)
4. Đo thời gian từ khi reload đến khi hiển thị products

**Kết quả mong đợi**:
- ✅ Load time < 500ms (từ cache)

**Test không có cache (initial load, server không sleep)**:
1. Clear browser cache
2. Đảm bảo keep-alive đang hoạt động (server không sleep)
3. Reload trang
4. Đo thời gian từ khi reload đến khi hiển thị products

**Kết quả mong đợi**:
- ✅ Load time < 5 giây (không cache, server không sleep)

**Test với server sleep (worst case)**:
1. Tắt keep-alive service
2. Đợi 20 phút (để server sleep)
3. Clear browser cache
4. Reload trang
5. Đo thời gian

**Kết quả mong đợi**:
- ⚠️ Load time 30-60 giây (server wake-up time)
- ✅ Sau khi wake-up, các lần load tiếp theo < 5 giây

## Monitoring MongoDB Performance

**Sử dụng MongoDB Atlas Dashboard**:
1. Vào MongoDB Atlas
2. Vào tab **Performance Advisor**
3. Xem query performance metrics
4. Kiểm tra query time có giảm không

**Hoặc sử dụng MongoDB Compass**:
1. Mở MongoDB Compass
2. Vào tab **Performance**
3. Xem query execution time

## Kết quả tổng hợp

### Trước khi tối ưu:
- Initial load: 2-5 phút (nếu server sleep)
- Subsequent loads: 5-10 giây (nếu server không sleep)
- API calls: Sequential, mỗi call 200-600ms
- Response size: Lớn, không compressed
- Database queries: 50-100ms mỗi query

### Sau khi tối ưu:
- Initial load: < 2 giây (với cache) hoặc < 5 giây (không cache, server không sleep)
- Subsequent loads: < 500ms (từ cache)
- API calls: Parallel, tổng thời gian = max thay vì sum
- Response size: Giảm 60-80% nhờ compression
- Database queries: 5-10ms mỗi query (nhờ indexes)

## Lưu ý

- **Keep-alive service là quan trọng nhất** - nó sẽ loại bỏ 30-60 giây wake-up time
- Nếu vẫn còn vấn đề về performance, kiểm tra:
  - Keep-alive service có đang hoạt động không
  - MongoDB connection có ổn định không
  - Network latency từ Việt Nam đến Hong Kong
  - Browser cache có được enable không

