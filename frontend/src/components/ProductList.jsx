import { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import ProductCard from './ProductCard';
import ProductForm from './ProductForm';
import LoadingSkeleton from './LoadingSkeleton';
import EmptyState from './EmptyState';
import { HiBeaker, HiPencil, HiTrash } from 'react-icons/hi2';
import showToast from '../utils/toast';

const ProductList = ({ onProductSelect, isSelectMode = false, selectedProducts = [] }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getAll();
      setProducts(response.data);
    } catch (error) {
      showToast.error('Lỗi khi tải danh sách sản phẩm');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      return;
    }

    // Optimistic update
    const originalProducts = [...products];
    setProducts(products.filter((p) => p._id !== id));

    try {
      await productService.delete(id);
      showToast.success('Đã xóa sản phẩm');
    } catch (error) {
      // Rollback on error
      setProducts(originalProducts);
      showToast.error('Lỗi khi xóa sản phẩm');
      console.error(error);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleFormClose = (updatedProduct = null) => {
    setShowForm(false);
    setEditingProduct(null);
    
    // Optimistic update
    if (updatedProduct) {
      if (editingProduct) {
        // Update existing product
        setProducts(products.map((p) => 
          p._id === updatedProduct._id ? updatedProduct : p
        ));
      } else {
        // Add new product
        setProducts([updatedProduct, ...products]);
      }
    }
  };

  const handleProductCreated = (newProduct) => {
    setProducts([newProduct, ...products]);
  };

  const handleProductUpdated = (updatedProduct) => {
    setProducts(products.map((p) => 
      p._id === updatedProduct._id ? updatedProduct : p
    ));
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 p-4">
        {[1, 2, 3, 4].map((i) => (
          <LoadingSkeleton key={i} type="card" />
        ))}
      </div>
    );
  }

  return (
    <>
      {products.length === 0 ? (
        <EmptyState
          icon={HiBeaker}
          title="Chưa có sản phẩm nào"
          message="Hãy thêm sản phẩm đầu tiên của bạn"
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 p-4">
          {products.map((product) => (
          <div key={product._id} className="relative group">
            <ProductCard
              product={product}
              onSelect={onProductSelect}
              isSelectMode={isSelectMode}
              isSelected={selectedProducts.some((p) => p._id === product._id)}
            />
            {!isSelectMode && (
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(product);
                  }}
                  className="bg-secondary text-white p-2 rounded-full shadow-lg hover:bg-secondary-dark"
                  aria-label="Sửa"
                >
                  <HiPencil className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(product._id);
                  }}
                  className="bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600"
                  aria-label="Xóa"
                >
                  <HiTrash className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
        </div>
      )}

      {showForm && (
        <ProductForm
          product={editingProduct}
          onClose={handleFormClose}
          onProductCreated={handleProductCreated}
          onProductUpdated={handleProductUpdated}
        />
      )}
    </>
  );
};

export default ProductList;

