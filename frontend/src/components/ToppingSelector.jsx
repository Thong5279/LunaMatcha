import { useState } from 'react';
import { HiXMark, HiChevronDown } from 'react-icons/hi2';

const ToppingSelector = ({ product, toppings, onAdd, onClose }) => {
  const [size, setSize] = useState('small');
  const [quantity, setQuantity] = useState(1);
  const [iceType, setIceType] = useState('common');
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [note, setNote] = useState('');
  const [showToppings, setShowToppings] = useState(false);

  const handleToppingToggle = (topping) => {
    setSelectedToppings((prev) => {
      const exists = prev.find((t) => t._id === topping._id);
      if (exists) {
        return prev.filter((t) => t._id !== topping._id);
      } else {
        return [...prev, { ...topping, quantity: 1 }];
      }
    });
  };

  const handleToppingQuantityChange = (toppingId, delta) => {
    setSelectedToppings((prev) => {
      return prev.map((t) => {
        if (t._id === toppingId) {
          const newQuantity = Math.max(1, (t.quantity || 1) + delta);
          return { ...t, quantity: newQuantity };
        }
        return t;
      });
    });
  };

  const handleToppingRemove = (toppingId) => {
    setSelectedToppings((prev) => prev.filter((t) => t._id !== toppingId));
  };

  const handleSubmit = () => {
    onAdd(product, size, quantity, iceType, selectedToppings, note);
  };

  const getPrice = () => {
    return size === 'small' ? product.priceSmall : product.priceLarge;
  };

  const calculateItemTotal = () => {
    const productTotal = getPrice() * quantity;
    const toppingTotal = selectedToppings.reduce(
      (sum, topping) => sum + topping.price * (topping.quantity || 1) * quantity,
      0
    );
    return productTotal + toppingTotal;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-end">
      <div className="bg-white rounded-t-2xl w-full max-h-[80vh] overflow-y-auto mb-20">
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between items-center">
          <h2 className="text-lg font-bold">{product.name}</h2>
          <button onClick={onClose} className="text-gray-500">
            <HiXMark className="w-6 h-6" />
          </button>
        </div>

        <div className="p-3 space-y-3 pb-20">
          {/* Size */}
          <div>
            <label className="block text-sm font-medium mb-2">Size</label>
            <div className="flex gap-3">
              <button
                onClick={() => setSize('small')}
                className={`flex-1 py-2.5 px-3 rounded-lg border-2 font-semibold text-sm transition-all ${
                  size === 'small'
                    ? 'border-accent bg-accent text-white'
                    : 'border-gray-300 bg-white text-gray-700'
                }`}
              >
                Nhỏ - {new Intl.NumberFormat('vi-VN').format(product.priceSmall)} đ
              </button>
              <button
                onClick={() => setSize('large')}
                className={`flex-1 py-2.5 px-3 rounded-lg border-2 font-semibold text-sm transition-all ${
                  size === 'large'
                    ? 'border-accent bg-accent text-white'
                    : 'border-gray-300 bg-white text-gray-700'
                }`}
              >
                Lớn - {new Intl.NumberFormat('vi-VN').format(product.priceLarge)} đ
              </button>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium mb-2">Số lượng</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center"
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                className="flex-1 text-center py-2 border border-gray-300 rounded-lg"
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>

          {/* Ice Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Đá</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setIceType('common')}
                className={`py-2.5 px-2.5 rounded-lg border-2 font-semibold transition-all text-xs ${
                  iceType === 'common'
                    ? 'border-accent bg-accent text-white'
                    : 'border-gray-300 bg-white text-gray-700'
                }`}
              >
                Đá chung
              </button>
              <button
                onClick={() => setIceType('separate')}
                className={`py-2.5 px-2.5 rounded-lg border-2 font-semibold transition-all text-xs ${
                  iceType === 'separate'
                    ? 'border-accent bg-accent text-white'
                    : 'border-gray-300 bg-white text-gray-700'
                }`}
              >
                Đá riêng
              </button>
              <button
                onClick={() => setIceType('none')}
                className={`py-2.5 px-2.5 rounded-lg border-2 font-semibold transition-all text-xs ${
                  iceType === 'none'
                    ? 'border-accent bg-accent text-white'
                    : 'border-gray-300 bg-white text-gray-700'
                }`}
              >
                Không đá
              </button>
            </div>
          </div>

          {/* Toppings */}
          {toppings.length > 0 && (
            <div>
              <button
                onClick={() => setShowToppings(!showToppings)}
                className="w-full flex justify-between items-center p-3 rounded-lg border-2 border-gray-300 bg-white hover:bg-gray-50 transition-all"
              >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Topping</span>
                    {selectedToppings.length > 0 && (
                      <span className="bg-accent text-white text-xs px-2 py-1 rounded-full">
                        {selectedToppings.reduce((sum, t) => sum + (t.quantity || 1), 0)}
                      </span>
                    )}
                  </div>
                <HiChevronDown
                  className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                    showToppings ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {showToppings && (
                <div className="mt-2 space-y-2 animate-fadeIn">
                  {toppings.map((topping) => {
                    const selectedTopping = selectedToppings.find((t) => t._id === topping._id);
                    const isSelected = !!selectedTopping;
                    const toppingQuantity = selectedTopping?.quantity || 0;
                    return (
                      <div
                        key={topping._id}
                        className={`w-full p-3 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-accent bg-primary'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <button
                            onClick={() => handleToppingToggle(topping)}
                            className="flex-1 text-left"
                          >
                            <span className="font-medium">{topping.name}</span>
                            <span className="text-sm text-gray-600 ml-2">
                              +{new Intl.NumberFormat('vi-VN').format(topping.price)} đ
                            </span>
                          </button>
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (toppingQuantity > 1) {
                                  handleToppingQuantityChange(topping._id, -1);
                                } else {
                                  handleToppingRemove(topping._id);
                                }
                              }}
                              className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center bg-white hover:bg-gray-50"
                            >
                              -
                            </button>
                            <span className="flex-1 text-center font-semibold min-w-[40px]">
                              {toppingQuantity}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToppingQuantityChange(topping._id, 1);
                              }}
                              className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center bg-white hover:bg-gray-50"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-sm font-medium mb-2">Ghi chú</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú cho món này..."
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* Total */}
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold">Tổng cộng:</span>
              <span className="font-bold text-lg text-green-600">
                {new Intl.NumberFormat('vi-VN').format(calculateItemTotal())} đ
              </span>
            </div>
            <button
              onClick={handleSubmit}
              className="w-full py-3 bg-secondary text-white font-semibold rounded-lg hover:bg-secondary-dark transition-colors"
            >
              Thêm vào giỏ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToppingSelector;


