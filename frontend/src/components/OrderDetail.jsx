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
        },
      ];
    }
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
        (sum, topping) => sum + topping.price * item.quantity,
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
                <div className="flex flex-wrap gap-2">
                  {toppings.map((topping) => {
                    const isSelected = (item.toppings || []).some(
                      (t) => t.toppingId === topping._id
                    );
                    return (
                      <button
                        key={topping._id}
                        onClick={() => handleToggleTopping(itemIndex, topping)}
                        className={`px-4 py-2 rounded-lg text-sm border-2 min-h-[44px] ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        {topping.name} (+{new Intl.NumberFormat('vi-VN').format(topping.price)} đ)
                      </button>
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

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold text-lg">Tổng cộng:</span>
              <span className="font-bold text-xl text-green-600">
                {new Intl.NumberFormat('vi-VN').format(calculateTotal())} đ
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

