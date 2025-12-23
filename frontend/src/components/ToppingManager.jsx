import { useState, useEffect } from 'react';
import { toppingService } from '../services/toppingService';
import { HiXMark } from 'react-icons/hi2';
import showToast from '../utils/toast';

const ToppingManager = ({ onClose }) => {
  const [toppings, setToppings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTopping, setEditingTopping] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '' });

  useEffect(() => {
    fetchToppings();
  }, []);

  const fetchToppings = async () => {
    try {
      setLoading(true);
      const response = await toppingService.getAll();
      setToppings(response.data);
    } catch (error) {
      showToast.error('Lỗi khi tải danh sách topping');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let result;
      if (editingTopping) {
        // Optimistic update
        const originalToppings = [...toppings];
        setToppings(toppings.map((t) => 
          t._id === editingTopping._id 
            ? { ...t, name: formData.name, price: parseFloat(formData.price) }
            : t
        ));
        
        result = await toppingService.update(editingTopping._id, formData);
        showToast.success('Đã cập nhật topping');
        setToppings(toppings.map((t) => 
          t._id === editingTopping._id ? result.data : t
        ));
      } else {
        // Optimistic update - add temporary topping
        const tempTopping = {
          _id: `temp-${Date.now()}`,
          name: formData.name,
          price: parseFloat(formData.price),
        };
        setToppings([tempTopping, ...toppings]);
        
        result = await toppingService.create(formData);
        showToast.success('Đã thêm topping');
        // Replace temp with real
        setToppings([result.data, ...toppings.filter((t) => t._id !== tempTopping._id)]);
      }
      setShowForm(false);
      setEditingTopping(null);
      setFormData({ name: '', price: '' });
    } catch (error) {
      // Rollback on error
      fetchToppings();
      showToast.error(error.response?.data?.message || 'Có lỗi xảy ra');
      console.error(error);
    }
  };

  const handleEdit = (topping) => {
    setEditingTopping(topping);
    setFormData({ name: topping.name, price: topping.price });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa topping này?')) {
      return;
    }

    // Optimistic update
    const originalToppings = [...toppings];
    setToppings(toppings.filter((t) => t._id !== id));

    try {
      await toppingService.delete(id);
      showToast.success('Đã xóa topping');
    } catch (error) {
      // Rollback on error
      setToppings(originalToppings);
      showToast.error('Lỗi khi xóa topping');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6">
          <div className="text-gray-500">Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-end">
      <div className="bg-white rounded-t-2xl w-full max-h-[90vh] overflow-y-auto mb-20">
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between items-center">
          <h2 className="text-lg font-bold">Quản lý Topping</h2>
          <button onClick={onClose} className="text-gray-500">
            <HiXMark className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 pb-24">
          <button
            onClick={() => {
              setShowForm(true);
              setEditingTopping(null);
              setFormData({ name: '', price: '' });
            }}
            className="w-full py-3 bg-secondary text-white font-semibold rounded-lg hover:bg-secondary-dark mb-4 transition-colors"
          >
            + Thêm Topping
          </button>

          {showForm && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Tên topping *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Giá (đ) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    required
                    min="0"
                    step="1000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingTopping(null);
                      setFormData({ name: '', price: '' });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-dark transition-colors"
                  >
                    {editingTopping ? 'Cập nhật' : 'Thêm'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-2">
            {toppings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Chưa có topping nào
              </div>
            ) : (
              toppings.map((topping) => (
                <div
                  key={topping._id}
                  className="bg-white border rounded-lg p-3 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{topping.name}</p>
                    <p className="text-sm text-gray-600">
                      {new Intl.NumberFormat('vi-VN').format(topping.price)} đ
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(topping)}
                      className="px-4 py-2 bg-secondary text-white text-sm rounded-lg hover:bg-secondary-dark min-h-[44px] transition-colors"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(topping._id)}
                      className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 min-h-[44px]"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToppingManager;

