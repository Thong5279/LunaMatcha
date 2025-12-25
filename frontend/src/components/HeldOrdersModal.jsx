import { useState, useEffect } from 'react';
import { orderService } from '../services/orderService';
import { HiXMark, HiArrowPath } from 'react-icons/hi2';
import showToast from '../utils/toast';
import { formatCurrencyWithUnit } from '../utils/formatCurrency';

const HeldOrdersModal = ({ isOpen, onClose, onRestore }) => {
  const [heldOrders, setHeldOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchHeldOrders();
    }
  }, [isOpen]);

  const fetchHeldOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getHeld();
      console.log('Held orders response:', response);
      console.log('Held orders data:', response.data);
      setHeldOrders(response.data || []);
    } catch (error) {
      showToast.error('Không thể tải danh sách đơn hàng đã tạm giữ');
      console.error('Error fetching held orders:', error);
      console.error('Error response:', error.response);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (order) => {
    try {
      const response = await orderService.restore(order._id);
      if (onRestore) {
        onRestore(response.data);
      }
      showToast.success('Đã khôi phục đơn hàng');
      onClose();
    } catch (error) {
      showToast.error('Không thể khôi phục đơn hàng');
      console.error(error);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-end">
      <div className="bg-white rounded-t-2xl w-full max-h-[85vh] overflow-y-auto mb-20">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Đơn hàng đã tạm giữ</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchHeldOrders}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              aria-label="Làm mới"
            >
              <HiArrowPath className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              aria-label="Đóng"
            >
              <HiXMark className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 space-y-2 pb-24">
          {loading && heldOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Đang tải...</div>
          ) : heldOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Chưa có đơn hàng nào được tạm giữ</div>
          ) : (
            heldOrders.map((order) => (
              <div
                key={order._id}
                className="bg-gray-50 rounded-lg p-3 border border-gray-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-500">
                        {order.heldAt ? formatTime(order.heldAt) : 'N/A'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {order.items.map((item, index) => (
                        <p key={index} className="text-xs text-gray-700">
                          {item.productName} ({item.size === 'small' ? 'Nhỏ' : 'Lớn'}) x{item.quantity}
                          {item.toppings.length > 0 && (
                            <span className="text-gray-500">
                              {' '}+ {item.toppings.length} topping
                            </span>
                          )}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <p className="font-bold text-sm text-green-600">
                      {formatCurrencyWithUnit(order.totalAmount)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRestore(order)}
                  className="w-full py-2 px-3 bg-accent text-white rounded-lg hover:bg-accent-dark font-semibold text-sm transition-colors"
                >
                  Khôi phục đơn hàng
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default HeldOrdersModal;

