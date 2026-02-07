/**
 * Lấy ngày hôm nay theo định dạng YYYY-MM-DD (local time)
 * Sử dụng local time thay vì UTC để tránh vấn đề timezone
 */
export const getTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Lấy tháng hiện tại theo định dạng YYYY-MM (local time)
 */
export const getCurrentMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Lấy năm hiện tại
 */
export const getCurrentYear = () => {
  return new Date().getFullYear().toString();
};

/**
 * Lấy tuần ISO hiện tại theo định dạng YYYY-Www (chuẩn ISO 8601, Thứ 2 → Chủ nhật)
 */
export const getCurrentWeek = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  const day = date.getDay() || 7; // 1 = Mon, 7 = Sun
  date.setDate(date.getDate() + 4 - day); // Thursday of the week
  const yearStart = new Date(date.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return date.getFullYear() + '-W' + String(weekNo).padStart(2, '0');
};

/**
 * Trả về { start, end } (Date) cho tuần ISO (YYYY-Www). start = Thứ 2 00:00:00, end = Chủ nhật 23:59:59.
 * Logic giống backend (tuần 1 chứa ngày 4/1).
 */
export const getWeekStartEnd = (week) => {
  if (!week || typeof week !== 'string') return { start: new Date(0), end: new Date(0) };
  const parts = week.split('-W');
  const year = parseInt(parts[0], 10);
  const weekNum = parseInt(parts[1], 10) || 1;
  const jan4 = new Date(year, 0, 4);
  const dayOfJan4 = jan4.getDay();
  const mondayOffset = dayOfJan4 === 0 ? -6 : 1 - dayOfJan4;
  const start = new Date(year, 0, 4);
  start.setDate(start.getDate() + mondayOffset + (weekNum - 1) * 7);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

/**
 * So sánh xem một ngày có phải là hôm nay không (local time)
 */
export const isToday = (dateString) => {
  if (!dateString) return false;
  return dateString === getTodayDate();
};

/**
 * Format date string để hiển thị
 */
export const formatDateDisplay = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Format Date object thành YYYY-MM-DD string (local timezone)
 * Sử dụng để gửi date range queries đến API, tránh timezone issues
 */
export const formatDateForAPI = (date) => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};






