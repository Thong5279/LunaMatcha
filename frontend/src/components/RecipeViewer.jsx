import { useState, useEffect } from 'react';
import { recipeService } from '../services/recipeService';
import { HiChevronDown, HiChevronUp } from 'react-icons/hi2';

const RecipeViewer = ({ cartItems = [], productMap = {} }) => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedItems, setExpandedItems] = useState(new Set());

  useEffect(() => {
    if (cartItems && cartItems.length > 0) {
      fetchRecipes();
    } else {
      setRecipes([]);
    }
  }, [cartItems]);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      // Lấy unique productIds để tránh gọi API trùng lặp
      const uniqueProductIds = [...new Set(cartItems.map(item => item.productId))];
      
      // Fetch recipes cho tất cả products
      const recipeMap = new Map();
      await Promise.all(
        uniqueProductIds.map(async (productId) => {
          try {
            const response = await recipeService.getByProductId(productId);
            if (response?.data) {
              recipeMap.set(productId, response.data);
            }
          } catch (error) {
            // Không có công thức cho product này
            console.warn(`Không tìm thấy công thức cho productId: ${productId}`);
          }
        })
      );
      
      // Map recipes cho từng cart item
      const results = cartItems.map((item) => {
        const recipe = recipeMap.get(item.productId);
        if (!recipe) {
          return null;
        }
        
        // Lấy ingredients theo size
        const ingredients = item.size === 'small' 
          ? recipe.ingredientsSmall || []
          : recipe.ingredientsLarge || [];
        
        return {
          ingredients,
          cartItemId: `${item.productId}-${item.size}`, // Unique ID cho mỗi item trong cart
          productName: item.productName,
          size: item.size,
        };
      });
      
      setRecipes(results.filter(r => r !== null && r.ingredients.length > 0));
    } catch (error) {
      console.error('Lỗi khi tải công thức:', error);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (itemId) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <p className="text-sm text-gray-600 text-center">Đang tải công thức...</p>
      </div>
    );
  }

  if (recipes.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-2">
      <h3 className="text-sm font-semibold text-gray-800 mb-2">📋 Công thức</h3>
      {recipes.map((recipe) => {
        const itemId = recipe.cartItemId;
        const productName = recipe.productName || 'Sản phẩm';
        const sizeLabel = recipe.size === 'small' ? 'Nhỏ' : 'Lớn';
        const isExpanded = expandedItems.has(itemId);

        return (
          <div key={itemId} className="bg-white rounded border border-gray-200">
            <button
              onClick={() => toggleItem(itemId)}
              className="w-full flex justify-between items-center p-2 hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium text-gray-800">
                {productName} ({sizeLabel})
              </span>
              {isExpanded ? (
                <HiChevronUp className="w-4 h-4 text-gray-600" />
              ) : (
                <HiChevronDown className="w-4 h-4 text-gray-600" />
              )}
            </button>
            {isExpanded && (
              <div className="px-2 pb-2 space-y-1">
                {recipe.ingredients && recipe.ingredients.length > 0 ? (
                  recipe.ingredients.map((ingredient, idx) => (
                    <div key={idx} className="text-xs text-gray-600 py-1 border-b border-gray-100 last:border-0">
                      <span className="font-medium">{ingredient.name}:</span>{' '}
                      {ingredient.amount} {ingredient.unit}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 italic">Chưa có công thức</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default RecipeViewer;

