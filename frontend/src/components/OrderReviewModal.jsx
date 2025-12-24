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
        <div className="p-4 space-y-4 pb-32">
          {/* Order Items */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Sản phẩm đã chọn</h3>
            {cart.map((item, index) => {
              const itemTotal = item.price * item.quantity;
              const toppingTotal = item.toppings.reduce(
                (sum, topping) => sum + topping.price * item.quantity,
                0
              );
              const totalItemPrice = itemTotal + toppingTotal;

              return (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-base text-gray-900 mb-1">
                        {item.productName}
                      </p>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Size:</span>{' '}
                          {item.size === 'small' ? 'Nhỏ' : 'Lớn'} |{' '}
                          <span className="font-medium">Số lượng:</span> {item.quantity} |{' '}
                          <span className="font-medium">Giá:</span>{' '}
                          {formatCurrency(item.price)} đ
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Đá:</span>{' '}
                          {item.iceType === 'common'
                            ? 'Chung'
                            : item.iceType === 'separate'
                            ? 'Riêng'
                            : 'Không đá'}
                        </p>
                        {item.toppings.length > 0 && (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Topping:</span>{' '}
                            {item.toppings.map((t) => t.toppingName).join(', ')} (
                            {formatCurrency(
                              item.toppings.reduce(
                                (sum, t) => sum + t.price * item.quantity,
                                0
                              )
                            )}{' '}
                            đ)
                          </p>
                        )}
                        {item.note && (
                          <p className="text-sm text-gray-700 mt-2 p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                            <span className="font-medium">📝 Ghi chú:</span> {item.note}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <p className="font-bold text-base text-green-600">
                        {formatCurrency(totalItemPrice)} đ
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total Summary */}
          <div className="bg-primary rounded-lg p-4 border-2 border-accent">
            <div className="flex justify-between items-center">
              <span className="font-bold text-lg text-gray-900">Tổng cộng:</span>
              <span className="font-bold text-2xl text-green-600">
                {formatCurrency(totalAmount)} đ
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold text-base transition-colors"
            >
              Quay lại
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3 px-4 bg-accent text-white rounded-lg hover:bg-accent-dark font-semibold text-base transition-colors flex items-center justify-center gap-2"
            >
              <HiCheckCircle className="w-5 h-5" />
              Xác nhận thanh toán
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderReviewModal;

