import { useState, useEffect } from 'react';
import showToast from '../utils/toast';
import { HiXMark } from 'react-icons/hi2';

const ChangeCalculator = ({ totalAmount, onConfirm, onCancel, isSubmitting = false }) => {
  const [customerPaid, setCustomerPaid] = useState('');
  const [change, setChange] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash', 'exact_amount', 'bank_transfer'

  useEffect(() => {
    calculateChange();
  }, [customerPaid, totalAmount, paymentMethod]);

  const calculateChange = () => {
    if (paymentMethod === 'exact_amount') {
      setCustomerPaid(totalAmount.toString());
      setChange(0);
    } else if (paymentMethod === 'bank_transfer') {
      setCustomerPaid('0');
      setChange(0);
    } else {
      const paid = parseFloat(customerPaid) || 0;
      const calculatedChange = paid - totalAmount;
      setChange(Math.max(0, calculatedChange));
    }
  };

  const handleQuickAmount = (amount) => {
    if (paymentMethod === 'cash') {
      const current = parseFloat(customerPaid) || 0;
      setCustomerPaid((current + amount).toString());
    }
  };

  const handleReset = () => {
    if (paymentMethod === 'cash') {
      setCustomerPaid('');
    }
  };

  const handleExactAmount = () => {
    setPaymentMethod('exact_amount');
    setCustomerPaid(totalAmount.toString());
    setChange(0);
  };

  const handleBankTransfer = () => {
    setPaymentMethod('bank_transfer');
    setCustomerPaid('0');
    setChange(0);
  };

  const handleBackToCash = () => {
    setPaymentMethod('cash');
    setCustomerPaid('');
    setChange(0);
  };

  const handleConfirm = () => {
    // Tránh double-click
    if (isSubmitting) {
      return;
    }

    if (paymentMethod === 'cash') {
      const paid = parseFloat(customerPaid) || 0;
      if (paid < totalAmount) {
        showToast.error('Số tiền khách đưa phải lớn hơn hoặc bằng tổng tiền đơn hàng');
        return;
      }
    }
    const paid = paymentMethod === 'exact_amount' ? totalAmount : (paymentMethod === 'bank_transfer' ? 0 : parseFloat(customerPaid) || 0);
    const finalChange = paymentMethod === 'exact_amount' || paymentMethod === 'bank_transfer' ? 0 : change;
    onConfirm(paid, finalChange, paymentMethod);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const formatQuickAmount = (amount) => {
    if (amount >= 1000) {
      return `${amount / 1000}k`;
    }
    return amount.toString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-end">
      <div className="bg-white rounded-t-2xl w-full max-h-[85vh] overflow-y-auto mb-20">
        <div className="sticky top-0 bg-white border-b border-primary-dark px-4 py-4 z-10">
          <h2 className="text-xl font-bold text-accent-dark">
            {totalAmount < 0 ? 'Thối tiền' : 'Thanh toán'}
          </h2>
        </div>

        <div className="p-4 space-y-4 pb-32">
          {/* Total Amount */}
          <div className="bg-primary rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Tổng tiền đơn hàng</p>
            <p className="text-2xl font-bold text-accent">{formatCurrency(totalAmount)} đ</p>
          </div>

          {/* Payment Method Quick Buttons */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Phương thức thanh toán</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExactAmount}
                className={`py-3 px-4 rounded-lg font-semibold transition-colors ${
                  paymentMethod === 'exact_amount'
                    ? 'bg-accent text-white'
                    : 'bg-primary border-2 border-accent text-accent-dark hover:bg-primary-dark'
                }`}
              >
                Đưa đủ tiền
              </button>
              <button
                onClick={handleBankTransfer}
                className={`py-3 px-4 rounded-lg font-semibold transition-colors ${
                  paymentMethod === 'bank_transfer'
                    ? 'bg-accent text-white'
                    : 'bg-primary border-2 border-accent text-accent-dark hover:bg-primary-dark'
                }`}
              >
                Chuyển khoản
              </button>
            </div>
            {paymentMethod !== 'cash' && (
              <button
                onClick={handleBackToCash}
                className="w-full py-2 px-4 text-sm text-gray-600 hover:text-gray-800"
              >
                ← Quay lại tính tiền thối
              </button>
            )}
          </div>

          {/* Customer Paid Input - chỉ hiển thị khi paymentMethod === 'cash' */}
          {paymentMethod === 'cash' && (
            <div>
              <label className="block text-sm font-medium mb-2">Số tiền khách đưa (đ)</label>
              <input
                type="number"
                value={customerPaid}
                onChange={(e) => setCustomerPaid(e.target.value)}
                placeholder="Nhập số tiền..."
                min={totalAmount}
                step="1000"
                className="w-full px-4 py-3 text-lg border-2 border-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                autoFocus
              />
            </div>
          )}

          {/* Quick Amount Buttons - chỉ hiển thị khi paymentMethod === 'cash' */}
          {paymentMethod === 'cash' && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">Chọn nhanh</label>
                {customerPaid && parseFloat(customerPaid) > 0 && (
                  <button
                    onClick={handleReset}
                    className="text-sm text-red-500 hover:text-red-700 font-medium"
                  >
                    Xóa
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleQuickAmount(amount)}
                    className="py-3 px-2 bg-primary border-2 border-accent rounded-lg hover:bg-primary-dark font-semibold text-sm transition-colors"
                  >
                    {formatQuickAmount(amount)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Change Display - chỉ hiển thị khi paymentMethod === 'cash' */}
          {paymentMethod === 'cash' && (
            <div className={`rounded-lg p-4 border-2 ${
              change >= 0 
                ? 'bg-green-50 border-green-300' 
                : 'bg-red-50 border-red-300'
            }`}>
              <p className="text-sm text-gray-600 mb-1">Tiền thối lại</p>
              <p className={`text-3xl font-bold ${
                change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(change)} đ
              </p>
              {change < 0 && (
                <p className="text-sm text-red-600 mt-1">
                  Khách còn thiếu {formatCurrency(Math.abs(change))} đ
                </p>
              )}
            </div>
          )}

          {/* Payment Method Summary */}
          {paymentMethod === 'exact_amount' && (
            <div className="rounded-lg p-4 border-2 bg-green-50 border-green-300">
              <p className="text-sm text-gray-600 mb-1">Khách đưa đủ tiền</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totalAmount)} đ
              </p>
              <p className="text-sm text-gray-600 mt-1">Không cần thối tiền</p>
            </div>
          )}

          {paymentMethod === 'bank_transfer' && (
            <div className="rounded-lg p-4 border-2 bg-blue-50 border-blue-300">
              <p className="text-sm text-gray-600 mb-1">Thanh toán chuyển khoản</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalAmount)} đ
              </p>
              <p className="text-sm text-gray-600 mt-1">Không tính vào tiền mặt</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirm}
              disabled={
                isSubmitting || 
                (paymentMethod === 'cash' && (!customerPaid || parseFloat(customerPaid) < totalAmount))
              }
              className="flex-1 py-3 px-4 bg-accent text-white rounded-lg hover:bg-accent-dark font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Đang xử lý...</span>
                </>
              ) : (
                'Xác nhận'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangeCalculator;

