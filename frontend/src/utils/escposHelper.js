/**
 * Helper functions để generate ESC/POS commands và tích hợp với Android app
 */

/**
 * Convert string sang byte array
 */
export const stringToBytes = (str) => {
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i));
  }
  return bytes;
};

/**
 * Format currency theo định dạng Việt Nam
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' d';
};

/**
 * Format date theo định dạng Việt Nam
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

/**
 * Generate ESC/POS commands từ shift data
 * @param {Object} shift - Shift data object
 * @returns {Uint8Array} ESC/POS commands
 */
export const generateEscPosCommands = (shift) => {
  const commands = [];

  // Reset printer
  commands.push(0x1B, 0x40); // ESC @

  // Center align
  commands.push(0x1B, 0x61, 0x01); // ESC a 1

  // Double height and width
  commands.push(0x1D, 0x21, 0x11); // GS ! 11

  // Header: LUNA MATCHA
  commands.push(...stringToBytes('LUNA MATCHA\n'));

  // Normal size
  commands.push(0x1D, 0x21, 0x00); // GS ! 00

  // Title: Tong ket ca lam viec
  commands.push(...stringToBytes('Tong ket ca lam viec\n'));

  // Line feed
  commands.push(0x0A);

  // Left align
  commands.push(0x1B, 0x61, 0x00); // ESC a 0

  // Ngày
  commands.push(...stringToBytes(`Ngay: ${formatDate(shift.date)}\n`));

  // Số đơn hàng
  commands.push(...stringToBytes(`So don hang: ${shift.orders.length}\n`));

  // Line feed
  commands.push(0x0A);

  // Tiền đầu ca
  commands.push(...stringToBytes(`Tien dau ca: ${formatCurrency(shift.startAmount)}\n`));

  // Doanh thu tiền mặt
  commands.push(...stringToBytes(`Doanh thu tien mat: ${formatCurrency(shift.cashAmount)}\n`));

  // Doanh thu chuyển khoản
  commands.push(...stringToBytes(`Doanh thu chuyen khoan: ${formatCurrency(shift.bankTransferAmount)}\n`));

  // Tổng doanh thu
  commands.push(...stringToBytes(`Tong doanh thu: ${formatCurrency(shift.cashAmount + shift.bankTransferAmount)}\n`));

  // Line feed
  commands.push(0x0A);

  // Bold on
  commands.push(0x1B, 0x45, 0x01); // ESC E 1

  // Tổng tiền có
  commands.push(...stringToBytes(`Tong tien co: ${formatCurrency(shift.startAmount + shift.endAmount)}\n`));

  // Tiền lãi
  commands.push(...stringToBytes(`Tien lai: ${formatCurrency(shift.netAmount)}\n`));

  // Bold off
  commands.push(0x1B, 0x45, 0x00); // ESC E 0

  // Line feed
  commands.push(0x0A);

  // Footer: In lúc
  commands.push(...stringToBytes(`In luc: ${new Date().toLocaleString('vi-VN')}\n`));

  // Cut paper
  commands.push(0x1D, 0x56, 0x41, 0x00); // GS V A 0

  // Feed paper
  commands.push(0x0A, 0x0A, 0x0A); // 3 line feeds

  return new Uint8Array(commands);
};

/**
 * Convert Uint8Array sang Base64 string
 */
export const convertToBase64 = (uint8Array) => {
  // Convert Uint8Array sang binary string
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  // Convert binary string sang Base64
  return btoa(binary);
};

/**
 * Kiểm tra Android app có sẵn không
 */
export const checkAndroidApp = () => {
  return typeof window.AndroidPrinter !== 'undefined' && 
         window.AndroidPrinter.isAvailable && 
         window.AndroidPrinter.isAvailable();
};

