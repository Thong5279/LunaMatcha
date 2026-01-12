import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiChevronLeft, HiArrowPath, HiPlus, HiPencil, HiTrash } from 'react-icons/hi2';
import { costService } from '../services/costService';
import showToast from '../utils/toast';
import { getTodayDate, formatDateDisplay } from '../utils/dateHelper';
import { formatCurrencyWithUnit } from '../utils/formatCurrency';
import ConfirmModal from '../components/ConfirmModal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import { HiCube } from 'react-icons/hi2';

const Costs = () => {
  const navigate = useNavigate();
  const [costs, setCosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => getTodayDate());
  const [showForm, setShowForm] = useState(false);
  const [editingCost, setEditingCost] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, costId: null, isLoading: false });

  // Form state
  const [formData, setFormData] = useState({
    date: getTodayDate(),
    category: 'material',
    customCategoryName: '',
    amount: '',
    note: '',
  });

  // Category labels
  const categoryLabels = {
    material: 'Nguyên liệu',
    ice: 'Nước đá',
    other: 'Khác',
  };

  useEffect(() => {
    fetchCosts();
  }, [selectedDate]);

  const fetchCosts = async () => {
    try {
      setLoading(true);
      const startDate = selectedDate;
      const endDate = selectedDate;
      const response = await costService.getAll({ startDate, endDate });
      setCosts(response.data || []);
    } catch (error) {
      showToast.error('Lỗi khi tải danh sách chi phí');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCosts();
    setRefreshing(false);
  };

  const handleCategoryChange = (category) => {
    setFormData({
      ...formData,
      category,
      customCategoryName: category === 'other' ? formData.customCategoryName : '',
      note: category === 'other' ? formData.note : '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showToast.error('Số tiền phải lớn hơn 0');
      return;
    }
    if (formData.category === 'other') {
      if (!formData.note || formData.note.trim() === '') {
        showToast.error('Ghi chú là bắt buộc khi chọn loại "Khác"');
        return;
      }
      if (!formData.customCategoryName || formData.customCategoryName.trim() === '') {
        showToast.error('Tên loại chi phí là bắt buộc khi chọn loại "Khác"');
        return;
      }
    }

    try {
      const costData = {
        date: formData.date,
        category: formData.category,
        amount: parseFloat(formData.amount),
        note: formData.note.trim(),
        customCategoryName: formData.category === 'other' ? formData.customCategoryName.trim() : '',
      };

      if (editingCost) {
        await costService.update(editingCost._id, costData);
        showToast.success('Đã cập nhật chi phí');
      } else {
        await costService.create(costData);
        showToast.success('Đã thêm chi phí');
      }

      setShowForm(false);
      setEditingCost(null);
      resetForm();
      fetchCosts();
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Lỗi khi lưu chi phí');
      console.error(error);
    }
  };

  const handleEdit = (cost) => {
    setEditingCost(cost);
    setFormData({
      date: cost.date ? new Date(cost.date).toISOString().split('T')[0] : getTodayDate(),
      category: cost.category,
      customCategoryName: cost.customCategoryName || '',
      amount: cost.amount.toString(),
      note: cost.note || '',
    });
    setShowForm(true);
  };

  const handleDeleteClick = (id) => {
    setDeleteConfirm({ isOpen: true, costId: id, isLoading: false });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.costId) return;

    setDeleteConfirm(prev => ({ ...prev, isLoading: true }));

    try {
      await costService.delete(deleteConfirm.costId);
      showToast.success('Đã xóa chi phí');
      setDeleteConfirm({ isOpen: false, costId: null, isLoading: false });
      fetchCosts();
    } catch (error) {
      showToast.error('Lỗi khi xóa chi phí');
      console.error(error);
      setDeleteConfirm(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteCancel = () => {
    if (!deleteConfirm.isLoading) {
      setDeleteConfirm({ isOpen: false, costId: null, isLoading: false });
    }
  };

  const resetForm = () => {
    setFormData({
      date: getTodayDate(),
      category: 'material',
      customCategoryName: '',
      amount: '',
      note: '',
    });
  };

  const handleAddNew = () => {
    setEditingCost(null);
    resetForm();
    setFormData(prev => ({ ...prev, date: selectedDate }));
    setShowForm(true);
  };

  // Group costs by category
  const groupedCosts = costs.reduce((acc, cost) => {
    const category = cost.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(cost);
    return acc;
  }, {});

  // Sort costs within each group by date (newest first)
  Object.keys(groupedCosts).forEach(category => {
    groupedCosts[category].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });
  });

  // Calculate totals by category
  const totalsByCategory = costs.reduce((acc, cost) => {
    acc[cost.category] = (acc[cost.category] || 0) + cost.amount;
    return acc;
  }, {});

  const totalAmount = costs.reduce((sum, cost) => sum + cost.amount, 0);

  if (loading) {
    return <LoadingSkeleton type="page" />;
  }

  return (
    <div className="min-h-screen bg-primary-light pb-24">
      {/* Header */}
      <header className="bg-primary shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-gray-600">
            <HiChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold flex-1 text-accent-dark">Chi phí</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-accent hover:text-accent-dark disabled:opacity-50"
              aria-label="Làm mới"
            >
              <HiArrowPath className={`w-6 h-6 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Date Selector */}
        <div className="bg-white rounded-lg p-4 shadow">
          <label className="block text-sm font-medium mb-2 text-gray-700">Chọn ngày</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border-2 border-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* Add Button */}
        <button
          onClick={handleAddNew}
          className="w-full py-3 bg-accent text-white rounded-lg hover:bg-accent-dark font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <HiPlus className="w-5 h-5" />
          Thêm chi phí
        </button>

        {/* Summary */}
        {costs.length > 0 && (
          <div className="bg-white rounded-lg p-4 shadow">
            <h2 className="text-lg font-bold mb-3 text-gray-800">Tổng hợp</h2>
            <div className="space-y-2">
              {Object.keys(groupedCosts).map(category => (
                <div key={category} className="flex justify-between items-center">
                  <span className="text-gray-600">{categoryLabels[category]}:</span>
                  <span className="font-semibold text-gray-800">
                    {formatCurrencyWithUnit(totalsByCategory[category] || 0)}
                  </span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2 flex justify-between items-center">
                <span className="font-bold text-gray-800">Tổng cộng:</span>
                <span className="font-bold text-lg text-green-600">
                  {formatCurrencyWithUnit(totalAmount)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Costs List - Grouped by Category */}
        {costs.length === 0 ? (
          <EmptyState
            icon={HiCube}
            title="Chưa có chi phí nào"
            message={`Chưa có chi phí nào cho ngày ${formatDateDisplay(selectedDate)}`}
          />
        ) : (
          <div className="space-y-4">
            {Object.keys(groupedCosts).map(category => (
              <div key={category} className="bg-white rounded-lg p-4 shadow">
                <h3 className="text-lg font-bold mb-3 text-gray-800">
                  {categoryLabels[category]}
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({formatCurrencyWithUnit(totalsByCategory[category] || 0)})
                  </span>
                </h3>
                <div className="space-y-2">
                  {groupedCosts[category].map((cost) => (
                    <div
                      key={cost._id}
                      className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-gray-500">
                              {formatDateDisplay(cost.date)}
                            </span>
                            {cost.category === 'other' && cost.customCategoryName && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                {cost.customCategoryName}
                              </span>
                            )}
                          </div>
                          <p className="font-semibold text-gray-800">
                            {formatCurrencyWithUnit(cost.amount)}
                          </p>
                          {cost.note && (
                            <p className="text-sm text-gray-600 mt-1">{cost.note}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(cost)}
                            className="text-accent hover:text-accent-dark p-1 rounded transition-colors"
                            aria-label="Sửa"
                          >
                            <HiPencil className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(cost._id)}
                            className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                            aria-label="Xóa"
                          >
                            <HiTrash className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white rounded-t-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCost ? 'Chỉnh sửa chi phí' : 'Thêm chi phí'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingCost(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <HiChevronLeft className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Ngày</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Loại chi phí</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                >
                  <option value="material">Nguyên liệu</option>
                  <option value="ice">Nước đá</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              {/* Custom Category Name (only for "other") */}
              {formData.category === 'other' && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Tên loại chi phí <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.customCategoryName}
                    onChange={(e) => setFormData({ ...formData, customCategoryName: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Ví dụ: Điện, Nước, Thuê mặt bằng..."
                    required={formData.category === 'other'}
                  />
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Số tiền <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="0"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Ghi chú {formData.category === 'other' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  rows="3"
                  placeholder={formData.category === 'other' ? 'Nhập ghi chú...' : 'Ghi chú (tùy chọn)'}
                  required={formData.category === 'other'}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 bg-accent text-white rounded-lg hover:bg-accent-dark font-semibold transition-colors"
              >
                {editingCost ? 'Cập nhật' : 'Thêm chi phí'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Xóa chi phí"
        message="Bạn có chắc chắn muốn xóa chi phí này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
        isLoading={deleteConfirm.isLoading}
      />
    </div>
  );
};

export default Costs;

