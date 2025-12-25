import { useState, useEffect } from 'react';
import { orderService } from '../services/orderService';
import showToast from '../utils/toast';
import OrderDetail from './OrderDetail';
import LoadingSkeleton from './LoadingSkeleton';
import EmptyState from './EmptyState';
import ConfirmModal from './ConfirmModal';
import ChangeCalculator from './ChangeCalculator';
import { HiClipboardDocumentList } from 'react-icons/hi2';
import { HiBanknotes, HiCreditCard } from 'react-icons/hi2';

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showRefundCalculator, setShowRefundCalculator] = useState(false);
  const [refundOrder, setRefundOrder] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, orderId: null, isLoading: false });

  useEffect(() => {
    fetchOrders();
  }, [filterDate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = filterDate ? { date: filterDate } : {};
      const response = await orderService.getAll(params);
      setOrders(response.data);
    } catch (error) {
      showToast.error('Lỗi khi tải danh sách đơn hàng');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteConfirm({ isOpen: true, orderId: id, isLoading: false });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.orderId) return;

    setDeleteConfirm(prev => ({ ...prev, isLoading: true }));

    try {
      await orderService.delete(deleteConfirm.orderId);
      showToast.success('Đã xóa đơn hàng thành công');
      setDeleteConfirm({ isOpen: false, orderId: null, isLoading: false });
      fetchOrders();
    } catch (error) {
      showToast.error('Lỗi khi xóa đơn hàng');
      console.error(error);
      setDeleteConfirm(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteCancel = () => {
    if (!deleteConfirm.isLoading) {
      setDeleteConfirm({ isOpen: false, orderId: null, isLoading: false });
    }
  };

  const handleEdit = (order) => {
    setSelectedOrder(order);
    setShowDetail(true);
  };

  const handleRefund = (order) => {
    setRefundOrder(order);
    setShowRefundCalculator(true);
  };

  const handleRefundConfirm = async (customerPaid, change, paymentMethod) => {
    if (!refundOrder) return;

    // Chỉ mở ChangeCalculator để tính tiền thối
    // Không tạo order mới, chỉ hiển thị số tiền cần thối
    showToast.success(`Cần thối lại: ${new Intl.NumberFormat('vi-VN').format(refundOrder.totalAmount)} đ`);
    setShowRefundCalculator(false);
    setRefundOrder(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return <LoadingSkeleton type="list" />;
  }

  return (
    <>
      <div className="p-4 space-y-3">
        {/* Filter */}
        <div>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
          />
          {filterDate && (
            <button
              onClick={() => setFilterDate('')}
              className="mt-2 text-sm text-blue-500"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Orders */}
        {orders.length === 0 ? (
          <EmptyState
            icon={HiClipboardDocumentList}
            title="Chưa có đơn hàng nào"
            message="Các đơn hàng của bạn sẽ hiển thị ở đây"
          />
        ) : (
          orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-lg shadow-md p-4 space-y-3"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs text-gray-500">
                      {formatDate(order.createdAt)}
                    </p>
                    {/* Payment Method Badge */}
                    {order.paymentMethod && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        order.paymentMethod === 'bank_transfer'
                          ? 'bg-blue-100 text-blue-700'
                          : order.paymentMethod === 'exact_amount'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {order.paymentMethod === 'bank_transfer' ? (
                          <>
                            <HiCreditCard className="w-3 h-3" />
                            Chuyển khoản
                          </>
                        ) : order.paymentMethod === 'exact_amount' ? (
                          <>
                            <HiBanknotes className="w-3 h-3" />
                            Đủ tiền
                          </>
                        ) : (
                          <>
                            <HiBanknotes className="w-3 h-3" />
                            Tiền mặt
                          </>
                        )}
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-lg mt-1">
                    {new Intl.NumberFormat('vi-VN').format(order.totalAmount)} đ
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {order.items.length} món
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(order)}
                    className="px-4 py-2 bg-secondary text-white text-sm rounded-lg hover:bg-secondary-dark min-h-[44px] transition-colors"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleRefund(order)}
                    className="px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 min-h-[44px] transition-colors"
                  >
                    Thối tiền
                  </button>
                  <button
                    onClick={() => handleDeleteClick(order._id)}
                    className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 min-h-[44px] transition-colors"
                  >
                    Xóa
                  </button>
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="border-t pt-3 space-y-1">
                {order.items.slice(0, 3).map((item, index) => (
                  <div key={index} className="text-sm text-gray-600">
                    {item.quantity}x {item.productName} {item.size && `(${item.size === 'small' ? 'Nhỏ' : 'Lớn'})`}
                    {item.iceType && (
                      <span className="text-xs text-gray-500">
                        {' '}• Đá: {item.iceType === 'common' ? 'Chung' : item.iceType === 'separate' ? 'Riêng' : 'Không đá'}
                      </span>
                    )}
                    {item.toppings.length > 0 && (
                      <span className="text-xs text-gray-400">
                        {' '}
                        ({item.toppings.map((t) => t.toppingName).join(', ')})
                      </span>
                    )}
                  </div>
                ))}
                {order.items.length > 3 && (
                  <p className="text-xs text-gray-400">
                    +{order.items.length - 3} món khác
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showDetail && selectedOrder && (
        <OrderDetail
          order={selectedOrder}
          onClose={() => {
            setShowDetail(false);
            setSelectedOrder(null);
            fetchOrders();
          }}
        />
      )}

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Xóa đơn hàng"
        message="Bạn có chắc chắn muốn xóa đơn hàng này? Hành động này không thể hoàn tác."
        confirmText="Xóa đơn hàng"
        cancelText="Hủy"
        type="danger"
        isLoading={deleteConfirm.isLoading}
      />

      {/* Refund Calculator Modal */}
      {showRefundCalculator && refundOrder && (
        <ChangeCalculator
          totalAmount={refundOrder.totalAmount}
          onConfirm={handleRefundConfirm}
          onCancel={() => {
            setShowRefundCalculator(false);
            setRefundOrder(null);
          }}
        />
      )}
    </>
  );
};

export default OrderList;

