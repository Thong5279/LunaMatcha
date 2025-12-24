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
      const recipePromises = cartItems.map(async (item) => {
        try {
          const response = await recipeService.getByProductIdAndSize(item.productId, item.size);
          return {
            ...response.data,
            cartItemId: `${item.productId}-${item.size}`, // Unique ID cho mỗi item trong cart
            productName: item.productName,
            size: item.size,
          };
        } catch (error) {
          // Không có công thức cho size này
          return null;
        }
      });
      
      const results = await Promise.all(recipePromises);
      setRecipes(results.filter(r => r !== null));
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

