import { useState, useEffect } from 'react';
import { orderService } from '../services/orderService';
import { productService } from '../services/productService';
import { toppingService } from '../services/toppingService';
import { HiXMark, HiTrash } from 'react-icons/hi2';
import showToast from '../utils/toast';

const OrderDetail = ({ order, onClose }) => {
  const [products, setProducts] = useState([]);
  const [toppings, setToppings] = useState([]);
  const [items, setItems] = useState(order.items || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, toppingsRes] = await Promise.all([
        productService.getAll(),
        toppingService.getAll(),
      ]);
      setProducts(productsRes.data);
      setToppings(toppingsRes.data);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
    }
  };

  const handleUpdateItem = (index, field, value) => {
    const newItems = [...items];
    if (field === 'quantity') {
      newItems[index].quantity = Math.max(1, parseInt(value) || 1);
    } else if (field === 'productId') {
      const product = products.find((p) => p._id === value);
      if (product) {
        const currentSize = newItems[index].size || 'small';
        newItems[index].productId = product._id;
        newItems[index].productName = product.name;
        newItems[index].size = currentSize;
        newItems[index].price = currentSize === 'small' ? product.priceSmall : product.priceLarge;
      }
    } else if (field === 'size') {
      const product = products.find((p) => p._id === newItems[index].productId);
      if (product) {
        newItems[index].size = value;
        newItems[index].price = value === 'small' ? product.priceSmall : product.priceLarge;
      }
    } else if (field === 'iceType') {
      newItems[index].iceType = value;
    } else if (field === 'note') {
      newItems[index].note = value;
    }
    setItems(newItems);
  };

  const handleToggleTopping = (itemIndex, topping) => {
    const newItems = [...items];
    const itemToppings = newItems[itemIndex].toppings || [];
    const exists = itemToppings.find((t) => t.toppingId === topping._id);

    if (exists) {
      newItems[itemIndex].toppings = itemToppings.filter(
        (t) => t.toppingId !== topping._id
      );
    } else {
      newItems[itemIndex].toppings = [
        ...itemToppings,
        {
          toppingId: topping._id,
          toppingName: topping.name,
          price: topping.price,
          quantity: 1,
        },
      ];
    }
    setItems(newItems);
  };

  const handleToppingQuantityChange = (itemIndex, toppingId, delta) => {
    const newItems = [...items];
    const itemToppings = newItems[itemIndex].toppings || [];
    newItems[itemIndex].toppings = itemToppings.map((t) => {
      if (t.toppingId === toppingId) {
        const newQuantity = Math.max(1, (t.quantity || 1) + delta);
        return { ...t, quantity: newQuantity };
      }
      return t;
    });
    setItems(newItems);
  };

  const handleToppingRemove = (itemIndex, toppingId) => {
    const newItems = [...items];
    newItems[itemIndex].toppings = (newItems[itemIndex].toppings || []).filter(
      (t) => t.toppingId !== toppingId
    );
    setItems(newItems);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleAddItem = () => {
    if (products.length > 0) {
      const product = products[0];
      setItems([
        ...items,
        {
          productId: product._id,
          productName: product.name,
          size: 'small',
          quantity: 1,
          price: product.priceSmall,
          iceType: 'common',
          toppings: [],
          note: '',
        },
      ]);
    }
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => {
      const itemTotal = item.price * item.quantity;
      const toppingTotal = (item.toppings || []).reduce(
        (sum, topping) => sum + topping.price * (topping.quantity || 1) * item.quantity,
        0
      );
      return total + itemTotal + toppingTotal;
    }, 0);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await orderService.update(order._id, { items });
      showToast.success('Đã cập nhật đơn hàng');
      onClose();
    } catch (error) {
      showToast.error('Lỗi khi cập nhật đơn hàng');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-end">
      <div className="bg-white rounded-t-2xl w-full max-h-[90vh] overflow-y-auto mb-20">
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between items-center">
          <h2 className="text-lg font-bold">Chi tiết đơn hàng</h2>
          <button onClick={onClose} className="text-gray-500">
            <HiXMark className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 space-y-4 pb-24">
          {items.map((item, itemIndex) => (
            <div key={itemIndex} className="border rounded-lg p-3 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <select
                    value={item.productId}
                    onChange={(e) => handleUpdateItem(itemIndex, 'productId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    {products.map((product) => (
                      <option key={product._id} value={product._id}>
                        {product.name} (Nhỏ: {new Intl.NumberFormat('vi-VN').format(product.priceSmall)} đ, Lớn: {new Intl.NumberFormat('vi-VN').format(product.priceLarge)} đ)
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => handleRemoveItem(itemIndex)}
                  className="ml-2 text-red-500 p-1"
                >
                  <HiTrash className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Size:</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateItem(itemIndex, 'size', 'small')}
                    className={`flex-1 py-2 px-3 rounded-lg border-2 font-medium ${
                      item.size === 'small'
                        ? 'border-accent bg-accent text-white'
                        : 'border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    Nhỏ
                  </button>
                  <button
                    onClick={() => handleUpdateItem(itemIndex, 'size', 'large')}
                    className={`flex-1 py-2 px-3 rounded-lg border-2 font-medium ${
                      item.size === 'large'
                        ? 'border-accent bg-accent text-white'
                        : 'border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    Lớn
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Đá:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleUpdateItem(itemIndex, 'iceType', 'common')}
                    className={`py-2 px-3 rounded-lg border-2 font-medium text-sm ${
                      item.iceType === 'common'
                        ? 'border-accent bg-accent text-white'
                        : 'border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    Đá chung
                  </button>
                  <button
                    onClick={() => handleUpdateItem(itemIndex, 'iceType', 'separate')}
                    className={`py-2 px-3 rounded-lg border-2 font-medium text-sm ${
                      item.iceType === 'separate'
                        ? 'border-accent bg-accent text-white'
                        : 'border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    Đá riêng
                  </button>
                  <button
                    onClick={() => handleUpdateItem(itemIndex, 'iceType', 'none')}
                    className={`py-2 px-3 rounded-lg border-2 font-medium text-sm ${
                      item.iceType === 'none'
                        ? 'border-accent bg-accent text-white'
                        : 'border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    Không đá
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm font-medium">Số lượng:</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      handleUpdateItem(itemIndex, 'quantity', item.quantity - 1)
                    }
                    className="w-8 h-8 rounded border border-gray-300"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      handleUpdateItem(itemIndex, 'quantity', e.target.value)
                    }
                    min="1"
                    className="w-16 text-center py-1 border border-gray-300 rounded"
                  />
                  <button
                    onClick={() =>
                      handleUpdateItem(itemIndex, 'quantity', item.quantity + 1)
                    }
                    className="w-8 h-8 rounded border border-gray-300"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Topping:</label>
                <div className="space-y-2">
                  {toppings.map((topping) => {
                    const selectedTopping = (item.toppings || []).find(
                      (t) => t.toppingId === topping._id
                    );
                    const isSelected = !!selectedTopping;
                    const toppingQuantity = selectedTopping?.quantity || 0;
                    return (
                      <div
                        key={topping._id}
                        className={`p-2 rounded-lg border-2 ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <button
                            onClick={() => handleToggleTopping(itemIndex, topping)}
                            className="flex-1 text-left"
                          >
                            <span className="text-sm font-medium">{topping.name}</span>
                            <span className="text-xs text-gray-600 ml-2">
                              (+{new Intl.NumberFormat('vi-VN').format(topping.price)} đ)
                            </span>
                          </button>
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => {
                                if (toppingQuantity > 1) {
                                  handleToppingQuantityChange(itemIndex, topping._id, -1);
                                } else {
                                  handleToppingRemove(itemIndex, topping._id);
                                }
                              }}
                              className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center bg-white hover:bg-gray-50"
                            >
                              -
                            </button>
                            <span className="flex-1 text-center font-semibold min-w-[40px] text-sm">
                              {toppingQuantity}
                            </span>
                            <button
                              onClick={() => handleToppingQuantityChange(itemIndex, topping._id, 1)}
                              className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center bg-white hover:bg-gray-50"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Ghi chú:</label>
                <textarea
                  value={item.note || ''}
                  onChange={(e) => handleUpdateItem(itemIndex, 'note', e.target.value)}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
          ))}

          <button
            onClick={handleAddItem}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500"
          >
            + Thêm món
          </button>

          <div className="pt-4 border-t space-y-4">
            {/* Payment Information */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-lg mb-3">Thông tin thanh toán</h3>
              
              {/* Payment Method */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Phương thức thanh toán:</span>
                <span className="font-semibold">
                  {order.paymentMethod === 'exact_amount' ? 'Đưa đủ tiền' :
                   order.paymentMethod === 'bank_transfer' ? 'Chuyển khoản' :
                   'Tiền mặt'}
                </span>
              </div>

              {/* Total Amount */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tổng tiền đơn hàng:</span>
                <span className="font-semibold text-lg">
                  {new Intl.NumberFormat('vi-VN').format(order.totalAmount || calculateTotal())} đ
                </span>
              </div>

              {/* Customer Paid - chỉ hiển thị khi tiền mặt */}
              {(order.paymentMethod === 'cash' || order.paymentMethod === 'exact_amount' || !order.paymentMethod) && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Khách đưa:</span>
                    <span className="font-semibold">
                      {new Intl.NumberFormat('vi-VN').format(order.customerPaid || 0)} đ
                    </span>
                  </div>
                  
                  {/* Change - chỉ hiển thị khi có thối */}
                  {order.change > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Tiền thối:</span>
                      <span className="font-semibold text-green-600">
                        {new Intl.NumberFormat('vi-VN').format(order.change)} đ
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* Bank Transfer Note */}
              {order.paymentMethod === 'bank_transfer' && (
                <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-2">
                  <p className="text-sm text-blue-700">
                    Đơn này thanh toán bằng chuyển khoản, không tính vào tiền mặt trong ca làm việc.
                  </p>
                </div>
              )}
            </div>

            {/* Order Items Summary */}
            <div className="bg-primary rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3">Sản phẩm đã mua</h3>
              <div className="space-y-2">
                {order.items && order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-sm">
                    <div className="flex-1">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-gray-600">
                        Size: {item.size === 'small' ? 'Nhỏ' : 'Lớn'} | 
                        SL: {item.quantity} | 
                        Đá: {item.iceType === 'common' ? 'Chung' : item.iceType === 'separate' ? 'Riêng' : 'Không đá'}
                      </p>
                      {item.toppings && item.toppings.length > 0 && (
                        <p className="text-gray-500 text-xs">
                          Topping: {item.toppings.map(t => {
                            const qty = t.quantity || 1;
                            return qty > 1 ? `${t.toppingName} x${qty}` : t.toppingName;
                          }).join(', ')}
                        </p>
                      )}
                      {item.note && (
                        <p className="text-gray-500 text-xs italic">Ghi chú: {item.note}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {new Intl.NumberFormat('vi-VN').format(
                          (item.price * item.quantity) + 
                          (item.toppings ? item.toppings.reduce((sum, t) => sum + (t.price * (t.quantity || 1) * item.quantity), 0) : 0)
                        )} đ
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg">Tổng cộng:</span>
              <span className="font-bold text-xl text-green-600">
                {new Intl.NumberFormat('vi-VN').format(order.totalAmount || calculateTotal())} đ
              </span>
            </div>
            
            <button
              onClick={handleSave}
              disabled={loading || items.length === 0}
              className="w-full py-3 bg-secondary text-white font-semibold rounded-lg hover:bg-secondary-dark disabled:opacity-50 transition-colors"
            >
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;

