// Cache formatter instance để tránh tạo mới mỗi lần gọi
const formatter = new Intl.NumberFormat('vi-VN');

/**
 * Format số tiền theo định dạng Việt Nam
 * @param {number} value - Giá trị cần format
 * @returns {string} - Chuỗi đã format (ví dụ: "1.234.567")
 */
export const formatCurrency = (value) => {
  if (value == null || isNaN(value)) return '0';
  return formatter.format(value);
};

/**
 * Format số tiền với đơn vị "đ"
 * @param {number} value - Giá trị cần format
 * @returns {string} - Chuỗi đã format với đơn vị (ví dụ: "1.234.567 đ")
 */
export const formatCurrencyWithUnit = (value) => {
  return `${formatCurrency(value)} đ`;
};

