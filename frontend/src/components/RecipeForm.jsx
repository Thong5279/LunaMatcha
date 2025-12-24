import { useState, useEffect } from 'react';
import { recipeService } from '../services/recipeService';
import { HiXMark, HiTrash, HiPlus } from 'react-icons/hi2';
import showToast from '../utils/toast';

const RecipeForm = ({ productId, productName, onClose, onSave }) => {
  const [selectedSize, setSelectedSize] = useState('small');
  const [ingredients, setIngredients] = useState([{ name: '', amount: '', unit: 'ml' }]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchRecipe();
  }, [productId, selectedSize]);

  const fetchRecipe = async () => {
    try {
      setFetching(true);
      const response = await recipeService.getByProductIdAndSize(productId, selectedSize);
      if (response.data && response.data.ingredients) {
        setIngredients(response.data.ingredients);
      } else {
        setIngredients([{ name: '', amount: '', unit: 'ml' }]);
      }
    } catch (error) {
      // Không có công thức, giữ nguyên form trống
      if (error.response?.status !== 404) {
        console.error('Lỗi khi tải công thức:', error);
      }
      setIngredients([{ name: '', amount: '', unit: 'ml' }]);
    } finally {
      setFetching(false);
    }
  };

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...ingredients];
    if (field === 'amount') {
      newIngredients[index][field] = value === '' ? '' : parseFloat(value) || '';
    } else {
      newIngredients[index][field] = value;
    }
    setIngredients(newIngredients);
  };

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: '', unit: 'ml' }]);
  };

  const handleRemoveIngredient = (index) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    for (const ingredient of ingredients) {
      if (!ingredient.name || !ingredient.name.trim()) {
        return 'Vui lòng nhập tên nguyên liệu';
      }
      if (!ingredient.amount || ingredient.amount <= 0) {
        return 'Số lượng nguyên liệu phải lớn hơn 0';
      }
      if (!['ml', 'g'].includes(ingredient.unit)) {
        return 'Đơn vị chỉ được phép là ml hoặc g';
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const error = validateForm();
    if (error) {
      showToast.error(error);
      return;
    }

    setLoading(true);
    try {
      const recipeData = {
        size: selectedSize,
        ingredients: ingredients.map(ing => ({
          name: ing.name.trim(),
          amount: parseFloat(ing.amount),
          unit: ing.unit,
        })),
      };

      await recipeService.createOrUpdate(productId, recipeData);
      showToast.success('Đã lưu công thức thành công');
      if (onSave) {
        onSave();
      }
      onClose();
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu công thức');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6">
          <p className="text-center">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between items-center">
          <h2 className="text-lg font-bold">Công thức: {productName}</h2>
          <button onClick={onClose} className="text-gray-500">
            <HiXMark className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Size Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">Size</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedSize('small')}
                className={`flex-1 py-2.5 px-3 rounded-lg border-2 font-semibold text-sm transition-all ${
                  selectedSize === 'small'
                    ? 'border-accent bg-accent text-white'
                    : 'border-gray-300 bg-white text-gray-700'
                }`}
              >
                Nhỏ
              </button>
              <button
                type="button"
                onClick={() => setSelectedSize('large')}
                className={`flex-1 py-2.5 px-3 rounded-lg border-2 font-semibold text-sm transition-all ${
                  selectedSize === 'large'
                    ? 'border-accent bg-accent text-white'
                    : 'border-gray-300 bg-white text-gray-700'
                }`}
              >
                Lớn
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {ingredients.map((ingredient, index) => (
              <div key={index} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Nguyên liệu {index + 1}</span>
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <HiTrash className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Tên nguyên liệu *</label>
                  <input
                    type="text"
                    value={ingredient.name}
                    onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Ví dụ: Sữa tươi"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Số lượng *</label>
                    <input
                      type="number"
                      value={ingredient.amount}
                      onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
                      required
                      min="0.01"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Đơn vị *</label>
                    <select
                      value={ingredient.unit}
                      onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="ml">ml</option>
                      <option value="g">g</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddIngredient}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-accent hover:text-accent transition-colors flex items-center justify-center gap-2"
          >
            <HiPlus className="w-5 h-5" />
            Thêm nguyên liệu
          </button>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-dark disabled:opacity-50 transition-colors"
            >
              {loading ? 'Đang lưu...' : 'Lưu công thức'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecipeForm;

