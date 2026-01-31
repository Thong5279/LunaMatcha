import { HiXMark, HiCreditCard, HiBanknotes } from 'react-icons/hi2';

const OrderViewModal = ({ order, onClose }) => {
  if (!order) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'bank_transfer':
        return { label: 'Chuyển khoản', icon: HiCreditCard, color: 'blue' };
      case 'exact_amount':
        return { label: 'Đưa đủ tiền', icon: HiBanknotes, color: 'green' };
      default:
        return { label: 'Tiền mặt', icon: HiBanknotes, color: 'gray' };
    }
  };

  const paymentInfo = getPaymentMethodLabel(order.paymentMethod);
  const PaymentIcon = paymentInfo.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-end">
      <div className="bg-white rounded-t-2xl w-full max-h-[90vh] overflow-y-auto mb-20 animate-slideUp">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Chi tiết đơn hàng</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            aria-label="Đóng"
          >
            <HiXMark className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 pb-24">
          {/* Order Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Thời gian đặt:</span>
              <span className="text-sm font-medium">{formatDate(order.createdAt)}</span>
            </div>
            
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Phương thức thanh toán:</span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                paymentInfo.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                paymentInfo.color === 'green' ? 'bg-green-100 text-green-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                <PaymentIcon className="w-3 h-3" />
                {paymentInfo.label}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tổng số món:</span>
              <span className="text-sm font-medium">{order.items.length} món</span>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Sản phẩm đã mua</h3>
            <div className="space-y-3">
              {order.items.map((item, index) => {
                const itemTotal = item.price * item.quantity;
                const toppingTotal = (item.toppings || []).reduce(
                  (sum, topping) => sum + topping.price * (topping.quantity || 1) * item.quantity,
                  0
                );
                const totalItemPrice = itemTotal + toppingTotal;

                return (
                  <div key={index} className="bg-white border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-base text-gray-900">
                          {item.productName}
                        </h4>
                        <div className="mt-1 space-y-1">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Size:</span> {item.size === 'small' ? 'Nhỏ' : 'Lớn'} • 
                            <span className="font-medium"> Số lượng:</span> {item.quantity} • 
                            <span className="font-medium"> Giá:</span> {formatCurrency(item.price)} đ
                          </p>
                          
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Đá:</span>{' '}
                            {item.iceType === 'common' ? 'Chung' :
                             item.iceType === 'separate' ? 'Riêng' : 'Không đá'}
                          </p>

                          {item.toppings && item.toppings.length > 0 && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Topping:</span>{' '}
                              {item.toppings.map((t) => {
                                const qty = t.quantity || 1;
                                return qty > 1 ? `${t.toppingName} x${qty}` : t.toppingName;
                              }).join(', ')}
                              <span className="text-gray-500">
                                {' '}({formatCurrency(toppingTotal)} đ)
                              </span>
                            </p>
                          )}

                          {item.note && (
                            <div className="mt-2 p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">📝 Ghi chú:</span> {item.note}
                              </p>
                            </div>
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
          </div>

          {/* Payment Summary */}
          <div className="bg-primary rounded-lg p-4 border-2 border-accent">
            <h3 className="font-semibold text-lg mb-3 text-accent-dark">Thông tin thanh toán</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tổng tiền đơn hàng:</span>
                <span className="font-semibold text-lg text-green-600">
                  {formatCurrency(order.totalAmount)} đ
                </span>
              </div>

              {/* Chỉ hiển thị thông tin tiền mặt khi không phải chuyển khoản */}
              {order.paymentMethod !== 'bank_transfer' && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Khách đưa:</span>
                    <span className="font-semibold">
                      {formatCurrency(order.customerPaid || 0)} đ
                    </span>
                  </div>
                  
                  {order.change > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Tiền thối:</span>
                      <span className="font-semibold text-blue-600">
                        {formatCurrency(order.change)} đ
                      </span>
                    </div>
                  )}
                </>
              )}

              {order.paymentMethod === 'bank_transfer' && (
                <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-2">
                  <p className="text-sm text-blue-700">
                    💳 Đơn hàng này thanh toán bằng chuyển khoản
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-accent text-white font-semibold rounded-lg hover:bg-accent-dark transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderViewModal;