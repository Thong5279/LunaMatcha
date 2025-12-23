import { useState, useEffect } from 'react';
import ProductList from './ProductList';
import ToppingSelector from './ToppingSelector';
import ChangeCalculator from './ChangeCalculator';
import { HiTrash } from 'react-icons/hi2';
import { toppingService } from '../services/toppingService';
import { orderService } from '../services/orderService';
import showToast from '../utils/toast';

const SellMode = ({ onComplete }) => {
  const [cart, setCart] = useState([]);
  const [toppings, setToppings] = useState([]);
  const [showToppingSelector, setShowToppingSelector] = useState(false);
  const [showChangeCalculator, setShowChangeCalculator] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    fetchToppings();
  }, []);

  const fetchToppings = async () => {
    try {
      const response = await toppingService.getAll();
      setToppings(response.data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách topping:', error);
    }
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setShowToppingSelector(true);
  };

  const handleAddToCart = (product, size, quantity, iceType, selectedToppings, note) => {
    const price = size === 'small' ? product.priceSmall : product.priceLarge;
    const cartItem = {
      productId: product._id,
      productName: product.name,
      size: size,
      quantity: parseInt(quantity),
      price: price,
      iceType: iceType || 'common',
      toppings: selectedToppings.map((topping) => ({
        toppingId: topping._id,
        toppingName: topping.name,
        price: topping.price,
      })),
      note: note || '',
    };

    setCart([...cart, cartItem]);
    setShowToppingSelector(false);
    setSelectedProduct(null);
    showToast.success('Đã thêm vào giỏ hàng');
  };

  const handleRemoveFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const itemTotal = item.price * item.quantity;
      const toppingTotal = item.toppings.reduce(
        (sum, topping) => sum + topping.price * item.quantity,
        0
      );
      return total + itemTotal + toppingTotal;
    }, 0);
  };

  const handleComplete = () => {
    if (cart.length === 0) {
      showToast.error('Vui lòng thêm ít nhất một sản phẩm');
      return;
    }
    setShowChangeCalculator(true);
  };

  const handleConfirmOrder = async (customerPaid, change) => {
    try {
      const orderData = {
        items: cart,
        customerPaid,
        change,
      };

      await orderService.create(orderData);
      showToast.success('Đã tạo đơn hàng thành công');
      setCart([]);
      setShowChangeCalculator(false);
      onComplete();
    } catch (error) {
      showToast.error('Lỗi khi tạo đơn hàng');
      console.error(error);
    }
  };

  return (
    <div className={cart.length > 0 ? "pb-80" : "pb-24"}>
      <ProductList
        onProductSelect={handleProductSelect}
        isSelectMode={true}
        selectedProducts={cart.map((item) => ({ _id: item.productId }))}
      />

      {/* Cart Summary */}
      {cart.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 bg-white border-t shadow-lg z-[60]">
          <div className="max-w-[430px] mx-auto">
            <div className="px-4 py-3 max-h-48 overflow-y-auto">
              {cart.map((item, index) => (
                <div key={index} className="flex justify-between items-start mb-2 pb-2 border-b">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{item.productName}</p>
                    <p className="text-xs text-gray-500">
                      Size: {item.size === 'small' ? 'Nhỏ' : 'Lớn'} | Đá: {
                        item.iceType === 'common' ? 'Chung' : 
                        item.iceType === 'separate' ? 'Riêng' : 'Không đá'
                      } | SL: {item.quantity} x {new Intl.NumberFormat('vi-VN').format(item.price)} đ
                    </p>
                    {item.toppings.length > 0 && (
                      <p className="text-xs text-gray-500">
                        Topping: {item.toppings.map((t) => t.toppingName).join(', ')}
                      </p>
                    )}
                    {item.note && (
                      <p className="text-xs text-gray-500 italic">Ghi chú: {item.note}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">
                      {new Intl.NumberFormat('vi-VN').format(
                        item.price * item.quantity +
                          item.toppings.reduce((sum, t) => sum + t.price * item.quantity, 0)
                      )}{' '}
                      đ
                    </p>
                    <button
                      onClick={() => handleRemoveFromCart(index)}
                      className="text-red-500 p-1"
                    >
                      <HiTrash className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 bg-gray-50 border-t flex justify-between items-center">
              <span className="font-bold text-lg">Tổng cộng:</span>
              <span className="font-bold text-lg text-green-600">
                {new Intl.NumberFormat('vi-VN').format(calculateTotal())} đ
              </span>
            </div>
            <button
              onClick={handleComplete}
              className="w-full py-4 bg-accent text-white font-semibold text-base hover:bg-accent-dark transition-colors"
            >
              Hoàn tất đơn hàng
            </button>
          </div>
        </div>
      )}

      {/* Topping Selector Modal */}
      {showToppingSelector && selectedProduct && (
        <ToppingSelector
          product={selectedProduct}
          toppings={toppings}
          onAdd={handleAddToCart}
          onClose={() => {
            setShowToppingSelector(false);
            setSelectedProduct(null);
          }}
        />
      )}

      {/* Change Calculator Modal */}
      {showChangeCalculator && (
        <ChangeCalculator
          totalAmount={calculateTotal()}
          onConfirm={handleConfirmOrder}
          onCancel={() => setShowChangeCalculator(false)}
        />
      )}
    </div>
  );
};

export default SellMode;

