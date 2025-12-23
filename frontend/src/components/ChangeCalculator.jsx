import { useState, useEffect } from 'react';
import showToast from '../utils/toast';
import { HiXMark } from 'react-icons/hi2';

const ChangeCalculator = ({ totalAmount, onConfirm, onCancel }) => {
  const [customerPaid, setCustomerPaid] = useState('');
  const [change, setChange] = useState(0);

  useEffect(() => {
    calculateChange();
  }, [customerPaid, totalAmount]);

  const calculateChange = () => {
    const paid = parseFloat(customerPaid) || 0;
    const calculatedChange = paid - totalAmount;
    setChange(Math.max(0, calculatedChange));
  };

  const handleQuickAmount = (amount) => {
    const current = parseFloat(customerPaid) || 0;
    setCustomerPaid((current + amount).toString());
  };

  const handleReset = () => {
    setCustomerPaid('');
  };

  const handleConfirm = () => {
    const paid = parseFloat(customerPaid) || 0;
    if (paid < totalAmount) {
      showToast.error('Số tiền khách đưa phải lớn hơn hoặc bằng tổng tiền đơn hàng');
      return;
    }
    onConfirm(paid, change);
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
      <div className="bg-white rounded-t-2xl w-full max-h-[80vh] overflow-y-auto mb-20">
        <div className="sticky top-0 bg-white border-b border-primary-dark px-4 py-4">
          <h2 className="text-xl font-bold text-accent-dark">Tính tiền thối</h2>
        </div>

        <div className="p-4 space-y-4 pb-24">
          {/* Total Amount */}
          <div className="bg-primary rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Tổng tiền đơn hàng</p>
            <p className="text-2xl font-bold text-accent">{formatCurrency(totalAmount)} đ</p>
          </div>

          {/* Customer Paid Input */}
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

          {/* Quick Amount Buttons */}
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

          {/* Change Display */}
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

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirm}
              disabled={!customerPaid || parseFloat(customerPaid) < totalAmount}
              className="flex-1 py-3 px-4 bg-accent text-white rounded-lg hover:bg-accent-dark font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangeCalculator;

