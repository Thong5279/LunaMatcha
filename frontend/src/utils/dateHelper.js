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


