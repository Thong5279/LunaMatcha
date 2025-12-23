import { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import showToast from '../utils/toast';

const ProductForm = ({ product, onClose, onProductCreated, onProductUpdated }) => {
  const [formData, setFormData] = useState({
    name: '',
    priceSmall: '',
    priceLarge: '',
    description: '',
    image: null,
  });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        priceSmall: product.priceSmall || '',
        priceLarge: product.priceLarge || '',
        description: product.description || '',
        image: null,
      });
      setPreview(product.image);
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image' && files && files[0]) {
      const file = files[0];
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('priceSmall', formData.priceSmall);
      data.append('priceLarge', formData.priceLarge);
      data.append('description', formData.description);
      if (formData.image) {
        data.append('image', formData.image);
      }

      let result;
      if (product) {
        result = await productService.update(product._id, data);
        showToast.success('Đã cập nhật sản phẩm');
        if (onProductUpdated) {
          onProductUpdated(result.data);
        }
      } else {
        result = await productService.create(data);
        showToast.success('Đã thêm sản phẩm');
        if (onProductCreated) {
          onProductCreated(result.data);
        }
      }

      onClose(result.data);
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Có lỗi xảy ra');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {product ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4 pb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tên sản phẩm *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Giá size nhỏ (đ) *</label>
              <input
                type="number"
                name="priceSmall"
                value={formData.priceSmall}
                onChange={handleChange}
                required
                min="0"
                step="1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Giá size lớn (đ) *</label>
              <input
                type="number"
                name="priceLarge"
                value={formData.priceLarge}
                onChange={handleChange}
                required
                min="0"
                step="1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mô tả</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Hình ảnh {product ? '(để trống nếu không đổi)' : '*'}
            </label>
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleChange}
              required={!product}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
            {preview && (
              <img
                src={preview}
                alt="Preview"
                className="mt-2 w-full h-48 object-cover rounded-lg"
              />
            )}
          </div>

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
              {loading ? 'Đang xử lý...' : product ? 'Cập nhật' : 'Thêm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;

