import { useState, useEffect } from 'react';
import { recipeService } from '../services/recipeService';
import { HiChevronDown, HiChevronUp } from 'react-icons/hi2';

const RecipeViewer = ({ productIds, productMap = {} }) => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState(new Set());

  useEffect(() => {
    if (productIds && productIds.length > 0) {
      fetchRecipes();
    }
  }, [productIds]);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const ids = productIds.map(p => (typeof p === 'object' ? p._id : p)).filter(Boolean);
      if (ids.length === 0) {
        setRecipes([]);
        return;
      }
      const response = await recipeService.getByProductIds(ids);
      setRecipes(response.data || []);
    } catch (error) {
      console.error('Lỗi khi tải công thức:', error);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = (productId) => {
    setExpandedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
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
        const productId = recipe.productId?._id || recipe.productId;
        const productName = productMap[productId] || recipe.productId?.name || 'Sản phẩm';
        const isExpanded = expandedProducts.has(productId);

        return (
          <div key={productId} className="bg-white rounded border border-gray-200">
            <button
              onClick={() => toggleProduct(productId)}
              className="w-full flex justify-between items-center p-2 hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium text-gray-800">{productName}</span>
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

