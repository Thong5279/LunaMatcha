import { useState, useEffect } from 'react';
import { recipeService } from '../services/recipeService';
import { HiXMark, HiTrash, HiPlus } from 'react-icons/hi2';
import showToast from '../utils/toast';

const RecipeForm = ({ productId, productName, onClose, onSave }) => {
  const [ingredients, setIngredients] = useState([{ name: '', amountSmall: '', amountLarge: '', unit: 'ml' }]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchRecipes();
  }, [productId]);

  // Merge 2 recipes thành 1 form data
  const mergeIngredients = (smallIngredients, largeIngredients) => {
    // Tạo map để dễ tìm kiếm
    const smallMap = new Map();
    const largeMap = new Map();
    
    smallIngredients.forEach(ing => {
      const key = `${ing.name.toLowerCase()}_${ing.unit}`;
      smallMap.set(key, ing);
    });
    
    largeIngredients.forEach(ing => {
      const key = `${ing.name.toLowerCase()}_${ing.unit}`;
      largeMap.set(key, ing);
    });
    
    // Lấy tất cả keys từ cả 2 maps
    const allKeys = new Set([...smallMap.keys(), ...largeMap.keys()]);
    
    // Merge thành mảng ingredients
    const merged = Array.from(allKeys).map(key => {
      const smallIng = smallMap.get(key);
      const largeIng = largeMap.get(key);
      
      return {
        name: smallIng?.name || largeIng?.name || '',
        amountSmall: smallIng?.amount || '',
        amountLarge: largeIng?.amount || '',
        unit: smallIng?.unit || largeIng?.unit || 'ml',
      };
    });
    
    return merged.length > 0 ? merged : [{ name: '', amountSmall: '', amountLarge: '', unit: 'ml' }];
  };

  const fetchRecipes = async () => {
    try {
      setFetching(true);
      // Clear form data ngay khi bắt đầu fetch
      setIngredients([{ name: '', amountSmall: '', amountLarge: '', unit: 'ml' }]);
      
      // Load cả 2 recipes cùng lúc
      const [smallRes, largeRes] = await Promise.allSettled([
        recipeService.getByProductIdAndSize(productId, 'small'),
        recipeService.getByProductIdAndSize(productId, 'large'),
      ]);
      
      const smallIngredients = smallRes.status === 'fulfilled' && smallRes.value?.data?.ingredients 
        ? smallRes.value.data.ingredients 
        : [];
      
      const largeIngredients = largeRes.status === 'fulfilled' && largeRes.value?.data?.ingredients 
        ? largeRes.value.data.ingredients 
        : [];
      
      // Merge 2 recipes thành 1 form
      const merged = mergeIngredients(smallIngredients, largeIngredients);
      setIngredients(merged);
    } catch (error) {
      console.error('Lỗi khi tải công thức:', {
        productId,
        error: error.response?.data || error.message,
      });
      showToast.error('Không thể tải công thức. Vui lòng thử lại.');
      setIngredients([{ name: '', amountSmall: '', amountLarge: '', unit: 'ml' }]);
    } finally {
      setFetching(false);
    }
  };

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...ingredients];
    if (field === 'amountSmall' || field === 'amountLarge') {
      newIngredients[index][field] = value === '' ? '' : parseFloat(value) || '';
    } else {
      newIngredients[index][field] = value;
    }
    setIngredients(newIngredients);
  };

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: '', amountSmall: '', amountLarge: '', unit: 'ml' }]);
  };

  const handleRemoveIngredient = (index) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    if (ingredients.length === 0) {
      return 'Vui lòng thêm ít nhất một nguyên liệu';
    }
    
    for (let i = 0; i < ingredients.length; i++) {
      const ingredient = ingredients[i];
      
      // Validate name
      if (!ingredient.name || typeof ingredient.name !== 'string' || !ingredient.name.trim()) {
        return `Nguyên liệu thứ ${i + 1}: Vui lòng nhập tên nguyên liệu`;
      }
      
      // Validate amountSmall
      const amountSmall = typeof ingredient.amountSmall === 'number' 
        ? ingredient.amountSmall 
        : parseFloat(ingredient.amountSmall);
      
      if (isNaN(amountSmall) || !isFinite(amountSmall) || amountSmall === '' || amountSmall === null || amountSmall === undefined) {
        return `Nguyên liệu thứ ${i + 1}: Vui lòng nhập số lượng size nhỏ hợp lệ`;
      }
      
      if (amountSmall <= 0) {
        return `Nguyên liệu thứ ${i + 1}: Số lượng size nhỏ phải lớn hơn 0`;
      }
      
      // Validate amountLarge
      const amountLarge = typeof ingredient.amountLarge === 'number' 
        ? ingredient.amountLarge 
        : parseFloat(ingredient.amountLarge);
      
      if (isNaN(amountLarge) || !isFinite(amountLarge) || amountLarge === '' || amountLarge === null || amountLarge === undefined) {
        return `Nguyên liệu thứ ${i + 1}: Vui lòng nhập số lượng size lớn hợp lệ`;
      }
      
      if (amountLarge <= 0) {
        return `Nguyên liệu thứ ${i + 1}: Số lượng size lớn phải lớn hơn 0`;
      }
      
      // Validate unit
      if (!ingredient.unit || !['ml', 'g'].includes(ingredient.unit)) {
        return `Nguyên liệu thứ ${i + 1}: Đơn vị chỉ được phép là ml hoặc g`;
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent submit khi đang fetch
    if (fetching) {
      showToast.error('Vui lòng đợi công thức được tải xong');
      return;
    }
    
    const error = validateForm();
    if (error) {
      showToast.error(error);
      return;
    }

    setLoading(true);
    try {
      // Validate lại một lần nữa trước khi tạo recipe objects
      // Đảm bảo không có giá trị rỗng, null, undefined
      for (let i = 0; i < ingredients.length; i++) {
        const ing = ingredients[i];
        
        // Validate name
        if (!ing.name || typeof ing.name !== 'string' || !ing.name.trim()) {
          throw new Error(`Nguyên liệu thứ ${i + 1}: Tên không được để trống`);
        }
        
        // Validate amountSmall
        if (ing.amountSmall === '' || ing.amountSmall === null || ing.amountSmall === undefined) {
          throw new Error(`Nguyên liệu thứ ${i + 1}: Vui lòng nhập số lượng size nhỏ`);
        }
        
        const amountSmall = typeof ing.amountSmall === 'number' 
          ? ing.amountSmall 
          : parseFloat(ing.amountSmall);
        
        if (isNaN(amountSmall) || !isFinite(amountSmall) || amountSmall <= 0) {
          throw new Error(`Nguyên liệu thứ ${i + 1}: Số lượng size nhỏ không hợp lệ`);
        }
        
        // Validate amountLarge
        if (ing.amountLarge === '' || ing.amountLarge === null || ing.amountLarge === undefined) {
          throw new Error(`Nguyên liệu thứ ${i + 1}: Vui lòng nhập số lượng size lớn`);
        }
        
        const amountLarge = typeof ing.amountLarge === 'number' 
          ? ing.amountLarge 
          : parseFloat(ing.amountLarge);
        
        if (isNaN(amountLarge) || !isFinite(amountLarge) || amountLarge <= 0) {
          throw new Error(`Nguyên liệu thứ ${i + 1}: Số lượng size lớn không hợp lệ`);
        }
        
        // Validate unit
        if (!ing.unit || !['ml', 'g'].includes(ing.unit)) {
          throw new Error(`Nguyên liệu thứ ${i + 1}: Đơn vị không hợp lệ`);
        }
      }
      
      // Tách thành 2 recipes riêng biệt
      // Validation logic phải giống với validateForm()
      const smallRecipe = {
        size: 'small',
        ingredients: ingredients.map((ing, index) => {
          // Validate name trước
          const trimmedName = typeof ing.name === 'string' ? ing.name.trim() : '';
          if (!trimmedName) {
            throw new Error(`Nguyên liệu thứ ${index + 1}: Tên không được để trống`);
          }
          
          // Validate amountSmall - check empty, null, undefined trước khi parse
          if (ing.amountSmall === '' || ing.amountSmall === null || ing.amountSmall === undefined) {
            throw new Error(`Nguyên liệu thứ ${index + 1}: Vui lòng nhập số lượng size nhỏ hợp lệ`);
          }
          
          const amountSmall = typeof ing.amountSmall === 'number' 
            ? ing.amountSmall 
            : parseFloat(ing.amountSmall);
          
          if (isNaN(amountSmall) || !isFinite(amountSmall)) {
            throw new Error(`Nguyên liệu thứ ${index + 1}: Số lượng size nhỏ không hợp lệ`);
          }
          
          if (amountSmall <= 0) {
            throw new Error(`Nguyên liệu thứ ${index + 1}: Số lượng size nhỏ phải lớn hơn 0`);
          }
          
          return {
            name: trimmedName,
            amount: amountSmall,
            unit: ing.unit,
          };
        }),
      };

      const largeRecipe = {
        size: 'large',
        ingredients: ingredients.map((ing, index) => {
          // Validate name trước
          const trimmedName = typeof ing.name === 'string' ? ing.name.trim() : '';
          if (!trimmedName) {
            throw new Error(`Nguyên liệu thứ ${index + 1}: Tên không được để trống`);
          }
          
          // Validate amountLarge - check empty, null, undefined trước khi parse
          if (ing.amountLarge === '' || ing.amountLarge === null || ing.amountLarge === undefined) {
            throw new Error(`Nguyên liệu thứ ${index + 1}: Vui lòng nhập số lượng size lớn hợp lệ`);
          }
          
          const amountLarge = typeof ing.amountLarge === 'number' 
            ? ing.amountLarge 
            : parseFloat(ing.amountLarge);
          
          if (isNaN(amountLarge) || !isFinite(amountLarge)) {
            throw new Error(`Nguyên liệu thứ ${index + 1}: Số lượng size lớn không hợp lệ`);
          }
          
          if (amountLarge <= 0) {
            throw new Error(`Nguyên liệu thứ ${index + 1}: Số lượng size lớn phải lớn hơn 0`);
          }
          
          return {
            name: trimmedName,
            amount: amountLarge,
            unit: ing.unit,
          };
        }),
      };

      // Lưu cả 2 recipes cùng lúc - dùng allSettled để xử lý từng kết quả riêng biệt
      const [smallResult, largeResult] = await Promise.allSettled([
        recipeService.createOrUpdate(productId, smallRecipe),
        recipeService.createOrUpdate(productId, largeRecipe),
      ]);
      
      // Kiểm tra kết quả từng recipe
      const errors = [];
      
      // Helper function để extract error message chi tiết
      const extractErrorMessage = (error, defaultMsg) => {
        // Ưu tiên message từ backend response
        if (error?.response?.data?.message) {
          return error.response.data.message;
        }
        
        // Kiểm tra errors array từ backend (validation errors)
        if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
          return error.response.data.errors.join(', ');
        }
        
        // Kiểm tra error message trực tiếp
        if (error?.message) {
          return error.message;
        }
        
        // Kiểm tra status text
        if (error?.response?.statusText) {
          return `${error.response.status} ${error.response.statusText}`;
        }
        
        // Fallback
        return defaultMsg;
      };
      
      if (smallResult.status === 'rejected') {
        const errorMsg = extractErrorMessage(smallResult.reason, 'Lỗi khi lưu công thức size nhỏ');
        errors.push(`Size nhỏ: ${errorMsg}`);
        console.error('Error saving small recipe:', {
          error: smallResult.reason,
          response: smallResult.reason?.response?.data,
          message: errorMsg,
        });
      }
      
      if (largeResult.status === 'rejected') {
        const errorMsg = extractErrorMessage(largeResult.reason, 'Lỗi khi lưu công thức size lớn');
        errors.push(`Size lớn: ${errorMsg}`);
        console.error('Error saving large recipe:', {
          error: largeResult.reason,
          response: largeResult.reason?.response?.data,
          message: errorMsg,
        });
      }
      
      // Nếu có lỗi, hiển thị và không đóng form
      if (errors.length > 0) {
        const errorMessage = errors.length === 2 
          ? `Lỗi khi lưu cả 2 size:\n${errors.join('\n')}`
          : errors[0];
        showToast.error(errorMessage);
        return; // Không đóng form để user có thể sửa
      }
      
      // Nếu cả 2 đều thành công
      showToast.success('Đã lưu công thức cho cả 2 size thành công');
      if (onSave) {
        onSave();
      }
      onClose();
    } catch (error) {
      // Catch các lỗi khác (validation, network, etc.)
      const errorMessage = error.response?.data?.message 
        || error.message 
        || 'Có lỗi xảy ra khi lưu công thức';
      
      showToast.error(errorMessage);
      console.error('Error saving recipe:', {
        productId,
        error: error.response?.data || error.message,
        stack: error.stack,
      });
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
                    placeholder="Ví dụ: Cacao"
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

                <div>
                  <label className="block text-sm font-medium mb-2">Số lượng *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Nhỏ</label>
                      <input
                        type="number"
                        value={ingredient.amountSmall}
                        onChange={(e) => handleIngredientChange(index, 'amountSmall', e.target.value)}
                        required
                        min="0.01"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Lớn</label>
                      <input
                        type="number"
                        value={ingredient.amountLarge}
                        onChange={(e) => handleIngredientChange(index, 'amountLarge', e.target.value)}
                        required
                        min="0.01"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddIngredient}
            disabled={fetching || loading}
            className={`w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-accent hover:text-accent transition-colors flex items-center justify-center gap-2 ${
              fetching || loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
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
              disabled={loading || fetching}
              className="flex-1 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-dark disabled:opacity-50 transition-colors"
            >
              {loading ? 'Đang lưu...' : fetching ? 'Đang tải...' : 'Lưu công thức'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecipeForm;

