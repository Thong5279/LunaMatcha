import { HiXMark, HiCheckCircle } from 'react-icons/hi2';

const OrderReviewModal = ({ isOpen, onClose, onConfirm, cart, totalAmount }) => {
  if (!isOpen) return null;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-end">
      <div className="bg-white rounded-t-2xl w-full max-h-[85vh] overflow-y-auto mb-20 animate-slideUp">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Xem lại đơn hàng</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            aria-label="Đóng"
          >
            <HiXMark className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 space-y-3 pb-24">
          {/* Order Items */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-800 mb-2">Sản phẩm đã chọn</h3>
            {cart.map((item, index) => {
              const itemTotal = item.price * item.quantity;
              const toppingTotal = (item.toppings || []).reduce(
                (sum, topping) => sum + topping.price * (topping.quantity || 1) * item.quantity,
                0
              );
              const totalItemPrice = itemTotal + toppingTotal;

              return (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900 mb-0.5">
                        {item.productName}
                      </p>
                      <div className="space-y-0.5">
                        <p className="text-xs text-gray-700">
                          <span className="font-medium">Size:</span>{' '}
                          {item.size === 'small' ? 'Nhỏ' : 'Lớn'} |{' '}
                          <span className="font-medium">Số lượng:</span> {item.quantity} |{' '}
                          <span className="font-medium">Giá:</span>{' '}
                          {formatCurrency(item.price)} đ
                        </p>
                        <p className="text-xs text-gray-700">
                          <span className="font-medium">Đá:</span>{' '}
                          {item.iceType === 'common'
                            ? 'Chung'
                            : item.iceType === 'separate'
                            ? 'Riêng'
                            : 'Không đá'}
                        </p>
                        {(item.toppings && item.toppings.length > 0) && (
                          <p className="text-xs text-gray-700">
                            <span className="font-medium">Topping:</span>{' '}
                            {item.toppings.map((t) => {
                              const qty = t.quantity || 1;
                              return qty > 1 ? `${t.toppingName} x${qty}` : t.toppingName;
                            }).join(', ')} (
                            {formatCurrency(
                              (item.toppings || []).reduce(
                                (sum, t) => sum + t.price * (t.quantity || 1) * item.quantity,
                                0
                              )
                            )}{' '}
                            đ)
                          </p>
                        )}
                        {item.note && (
                          <p className="text-xs text-gray-700 mt-1 p-1.5 bg-yellow-50 rounded border-l-4 border-yellow-400">
                            <span className="font-medium">📝 Ghi chú:</span> {item.note}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <p className="font-bold text-sm text-green-600">
                        {formatCurrency(totalItemPrice)} đ
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total Summary */}
          <div className="bg-primary rounded-lg p-3 border-2 border-accent">
            <div className="flex justify-between items-center">
              <span className="font-bold text-base text-gray-900">Tổng cộng:</span>
              <span className="font-bold text-xl text-green-600">
                {formatCurrency(totalAmount)} đ
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold text-sm transition-colors"
            >
              Quay lại
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 px-3 bg-accent text-white rounded-lg hover:bg-accent-dark font-semibold text-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <HiCheckCircle className="w-4 h-4" />
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderReviewModal;


