import { useState, useEffect, useMemo, useCallback } from 'react';
import ProductList from './ProductList';
import ToppingSelector from './ToppingSelector';
import ChangeCalculator from './ChangeCalculator';
import OrderReviewModal from './OrderReviewModal';
import RecipeViewer from './RecipeViewer';
import { HiTrash } from 'react-icons/hi2';
import { toppingService } from '../services/toppingService';
import { orderService } from '../services/orderService';
import showToast from '../utils/toast';
import { formatCurrencyWithUnit } from '../utils/formatCurrency';

const SellMode = ({ onComplete }) => {
  const [cart, setCart] = useState([]);
  const [toppings, setToppings] = useState([]);
  const [showToppingSelector, setShowToppingSelector] = useState(false);
  const [showOrderReview, setShowOrderReview] = useState(false);
  const [showChangeCalculator, setShowChangeCalculator] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showRecipe, setShowRecipe] = useState(false);

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

  const handleProductSelect = useCallback((product) => {
    setSelectedProduct(product);
    setShowToppingSelector(true);
  }, []);

  const handleAddToCart = useCallback((product, size, quantity, iceType, selectedToppings, note) => {
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
        quantity: topping.quantity || 1,
      })),
      note: note || '',
    };

    setCart((prevCart) => [...prevCart, cartItem]);
    setShowToppingSelector(false);
    setSelectedProduct(null);
    showToast.success('Đã thêm vào giỏ hàng');
  }, []);

  const handleRemoveFromCart = useCallback((index) => {
    setCart((prevCart) => prevCart.filter((_, i) => i !== index));
  }, []);

  // Memoize total calculation
  const totalAmount = useMemo(() => {
    return cart.reduce((total, item) => {
      const itemTotal = item.price * item.quantity;
      const toppingTotal = item.toppings.reduce(
        (sum, topping) => sum + topping.price * (topping.quantity || 1) * item.quantity,
        0
      );
      return total + itemTotal + toppingTotal;
    }, 0);
  }, [cart]);

  // Memoize selectedProducts mapping
  const selectedProducts = useMemo(() => {
    return cart.map((item) => ({ _id: item.productId }));
  }, [cart]);

  // Memoize productIds for RecipeViewer
  const productIds = useMemo(() => {
    return cart.map((item) => item.productId);
  }, [cart]);

  // Memoize productMap for RecipeViewer
  const productMap = useMemo(() => {
    const map = {};
    cart.forEach((item) => {
      map[item.productId] = item.productName;
    });
    return map;
  }, [cart]);

  // Memoize cart items with pre-calculated totals
  const cartItems = useMemo(() => {
    return cart.map((item, index) => {
      const itemTotal = item.price * item.quantity;
      const toppingTotal = item.toppings.reduce(
        (sum, t) => sum + t.price * (t.quantity || 1) * item.quantity,
        0
      );
      return {
        ...item,
        totalPrice: itemTotal + toppingTotal,
        index,
      };
    });
  }, [cart]);

  const handleComplete = useCallback(() => {
    if (cart.length === 0) {
      showToast.error('Vui lòng thêm ít nhất một sản phẩm');
      return;
    }
    setShowOrderReview(true);
  }, [cart.length]);

  const handleConfirmReview = useCallback(() => {
    setShowOrderReview(false);
    setShowChangeCalculator(true);
  }, []);

  const handleConfirmOrder = async (customerPaid, change, paymentMethod) => {
    try {
      // Lấy ngày hôm nay theo local time (YYYY-MM-DD)
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const orderDate = `${year}-${month}-${day}`;

      const orderData = {
        items: cart,
        customerPaid,
        change,
        paymentMethod: paymentMethod || 'cash',
        orderDate, // Gửi orderDate từ frontend để đảm bảo đúng timezone
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
        selectedProducts={selectedProducts}
      />

      {/* Cart Summary */}
      {cart.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 bg-white border-t shadow-lg z-[60]">
          <div className="max-w-[430px] mx-auto">
            <div className="px-3 py-2 max-h-48 overflow-y-auto">
              {cartItems.map((item) => (
                <div key={item.index} className="flex justify-between items-start mb-2 pb-2 border-b border-gray-200">
                  <div className="flex-1 pr-2">
                    <p className="font-semibold text-sm mb-0.5">{item.productName}</p>
                    <p className="text-xs text-gray-600 mb-0.5">
                      <span className="font-medium">Size:</span> {item.size === 'small' ? 'Nhỏ' : 'Lớn'} |{' '}
                      <span className="font-medium">Đá:</span>{' '}
                      {item.iceType === 'common' ? 'Chung' : 
                       item.iceType === 'separate' ? 'Riêng' : 'Không đá'} |{' '}
                      <span className="font-medium">SL:</span> {item.quantity} x {formatCurrencyWithUnit(item.price)}
                    </p>
                    {item.toppings.length > 0 && (
                      <p className="text-xs text-gray-600 mb-0.5">
                        <span className="font-medium">Topping:</span> {item.toppings.map((t) => {
                          const qty = t.quantity || 1;
                          return qty > 1 ? `${t.toppingName} x${qty}` : t.toppingName;
                        }).join(', ')}
                      </p>
                    )}
                    {item.note && (
                      <p className="text-xs text-gray-600 italic bg-yellow-50 p-1 rounded mt-0.5 border-l-2 border-yellow-400">
                        <span className="font-medium">📝 Ghi chú:</span> {item.note}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <p className="font-semibold text-sm text-green-600">
                      {formatCurrencyWithUnit(item.totalPrice)}
                    </p>
                    <button
                      onClick={() => handleRemoveFromCart(item.index)}
                      className="text-red-500 p-1 hover:bg-red-50 rounded transition-colors"
                      aria-label="Xóa"
                    >
                      <HiTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-3 py-2 bg-gray-50 border-t">
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-bold text-base">Tổng cộng:</span>
                <span className="font-bold text-lg text-green-600">
                  {formatCurrencyWithUnit(totalAmount)}
                </span>
              </div>
              <button
                onClick={() => setShowRecipe(!showRecipe)}
                className="w-full py-1.5 text-xs text-gray-600 hover:text-accent transition-colors border border-gray-300 rounded-lg hover:border-accent"
              >
                {showRecipe ? 'Ẩn công thức' : '📋 Xem công thức'}
              </button>
              {showRecipe && (
                <div className="mt-1.5">
                  <RecipeViewer cartItems={cart} productMap={productMap} />
                </div>
              )}
            </div>
            <button
              onClick={handleComplete}
              className="w-full py-3 bg-accent text-white font-semibold text-sm hover:bg-accent-dark transition-colors"
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

      {/* Order Review Modal */}
      {showOrderReview && (
        <OrderReviewModal
          isOpen={showOrderReview}
          onClose={() => setShowOrderReview(false)}
          onConfirm={handleConfirmReview}
          cart={cart}
          totalAmount={totalAmount}
        />
      )}

      {/* Change Calculator Modal */}
      {showChangeCalculator && (
        <ChangeCalculator
          totalAmount={totalAmount}
          onConfirm={handleConfirmOrder}
          onCancel={() => setShowChangeCalculator(false)}
        />
      )}
    </div>
  );
};

export default SellMode;

