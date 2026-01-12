import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiChevronLeft, HiArrowPath, HiPlus, HiPencil, HiTrash } from 'react-icons/hi2';
import { costService } from '../services/costService';
import { analyticsService } from '../services/analyticsService';
import showToast from '../utils/toast';
import { getTodayDate, formatDateDisplay, getCurrentMonth, getCurrentYear } from '../utils/dateHelper';
import { formatCurrencyWithUnit, formatCurrency } from '../utils/formatCurrency';
import ConfirmModal from '../components/ConfirmModal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import { HiCube } from 'react-icons/hi2';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const Costs = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('costs'); // 'costs' | 'profit'
  
  // Costs tab state
  const [costs, setCosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => getTodayDate());
  const [showForm, setShowForm] = useState(false);
  const [editingCost, setEditingCost] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, costId: null, isLoading: false });
  
  // Profit tab state
  const [profitPeriod, setProfitPeriod] = useState('monthly'); // 'monthly' | 'quarterly' | 'yearly'
  const [profitMonth, setProfitMonth] = useState(() => getCurrentMonth());
  const [profitQuarter, setProfitQuarter] = useState(1);
  const [profitYear, setProfitYear] = useState(() => getCurrentYear());
  const [profitData, setProfitData] = useState(null);
  const [profitLoading, setProfitLoading] = useState(false);

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
    if (activeTab === 'costs') {
      fetchCosts();
    }
  }, [selectedDate, activeTab]);

  useEffect(() => {
    if (activeTab === 'profit') {
      fetchProfitData();
    }
  }, [profitPeriod, profitMonth, profitQuarter, profitYear, activeTab]);

  // Disable body scroll when modal is open
  useEffect(() => {
    if (showForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showForm]);

  // Helper functions for profit tab
  const getQuarterStartEnd = (year, quarter) => {
    const startMonth = (quarter - 1) * 3;
    const start = new Date(year, startMonth, 1, 0, 0, 0, 0);
    const end = new Date(year, startMonth + 3, 0, 23, 59, 59, 999);
    return { start, end };
  };

  const getYearStartEnd = (year) => {
    const start = new Date(year, 0, 1, 0, 0, 0, 0);
    const end = new Date(year, 11, 31, 23, 59, 59, 999);
    return { start, end };
  };

  const getPreviousPeriod = (period, month, quarter, year) => {
    if (period === 'monthly') {
      const [y, m] = month.split('-').map(Number);
      const prevMonth = m === 1 ? 12 : m - 1;
      const prevYear = m === 1 ? y - 1 : y;
      return `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
    } else if (period === 'quarterly') {
      const prevQuarter = quarter === 1 ? 4 : quarter - 1;
      const prevYear = quarter === 1 ? parseInt(year) - 1 : parseInt(year);
      return { quarter: prevQuarter, year: prevYear.toString() };
    } else if (period === 'yearly') {
      return (parseInt(year) - 1).toString();
    }
    return null;
  };

  const calculateProfitMargin = (revenue, costs) => {
    if (!revenue || revenue === 0) return 0;
    return ((revenue - costs) / revenue) * 100;
  };

  const fetchProfitData = async () => {
    try {
      setProfitLoading(true);
      let revenue = 0;
      let previousRevenue = 0;
      let startDate, endDate;
      let previousStartDate, previousEndDate;

      // Get date range based on period
      if (profitPeriod === 'monthly') {
        const [year, month] = profitMonth.split('-').map(Number);
        startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
        endDate = new Date(year, month, 0, 23, 59, 59, 999);
        
        // Get previous month
        const prevMonth = getPreviousPeriod('monthly', profitMonth, null, null);
        const [prevYear, prevMonthNum] = prevMonth.split('-').map(Number);
        previousStartDate = new Date(prevYear, prevMonthNum - 1, 1, 0, 0, 0, 0);
        previousEndDate = new Date(prevYear, prevMonthNum, 0, 23, 59, 59, 999);

        const response = await analyticsService.getMonthly(profitMonth);
        revenue = response.data?.totalRevenue || 0;
        
        // Get previous month revenue
        const prevResponse = await analyticsService.getMonthly(prevMonth);
        previousRevenue = prevResponse.data?.totalRevenue || 0;
      } else if (profitPeriod === 'quarterly') {
        const { start, end } = getQuarterStartEnd(parseInt(profitYear), profitQuarter);
        startDate = start;
        endDate = end;

        // Get previous quarter
        const prev = getPreviousPeriod('quarterly', null, profitQuarter, profitYear);
        const { start: prevStart, end: prevEnd } = getQuarterStartEnd(prev.year, prev.quarter);
        previousStartDate = prevStart;
        previousEndDate = prevEnd;

        const quarter = `${profitYear}-Q${profitQuarter}`;
        const response = await analyticsService.getQuarterly(quarter);
        revenue = response.data?.totalRevenue || 0;

        // Get previous quarter revenue
        const prevQuarter = `${prev.year}-Q${prev.quarter}`;
        const prevResponse = await analyticsService.getQuarterly(prevQuarter);
        previousRevenue = prevResponse.data?.totalRevenue || 0;
      } else if (profitPeriod === 'yearly') {
        const { start, end } = getYearStartEnd(parseInt(profitYear));
        startDate = start;
        endDate = end;

        // Get previous year
        const prevYear = getPreviousPeriod('yearly', null, null, profitYear);
        const { start: prevStart, end: prevEnd } = getYearStartEnd(parseInt(prevYear));
        previousStartDate = prevStart;
        previousEndDate = prevEnd;

        const response = await analyticsService.getYearly(profitYear);
        revenue = response.data?.totalRevenue || 0;

        // Get previous year revenue
        const prevResponse = await analyticsService.getYearly(prevYear);
        previousRevenue = prevResponse.data?.totalRevenue || 0;
      }

      // Get costs for the period
      const costsResponse = await costService.getAll({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });
      const costs = costsResponse.data || [];
      const totalCosts = costs.reduce((sum, cost) => sum + cost.amount, 0);

      // Get previous period costs
      const prevCostsResponse = await costService.getAll({
        startDate: previousStartDate.toISOString().split('T')[0],
        endDate: previousEndDate.toISOString().split('T')[0],
      });
      const prevCosts = prevCostsResponse.data || [];
      const previousTotalCosts = prevCosts.reduce((sum, cost) => sum + cost.amount, 0);

      // Calculate profit
      const profit = revenue - totalCosts;
      const previousProfit = previousRevenue - previousTotalCosts;
      const profitChange = profit - previousProfit;
      const profitChangePercent = previousProfit !== 0 ? (profitChange / previousProfit) * 100 : (profit > 0 ? 100 : 0);

      // Group costs by category
      const costsByCategory = costs.reduce((acc, cost) => {
        acc[cost.category] = (acc[cost.category] || 0) + cost.amount;
        return acc;
      }, { material: 0, ice: 0, other: 0 });

      setProfitData({
        revenue,
        costs: totalCosts,
        profit,
        profitMargin: calculateProfitMargin(revenue, totalCosts),
        previousRevenue,
        previousCosts: previousTotalCosts,
        previousProfit,
        profitChange,
        profitChangePercent,
        costsByCategory,
        costs,
      });
    } catch (error) {
      showToast.error('Lỗi khi tải dữ liệu lãi/lỗ');
      console.error(error);
    } finally {
      setProfitLoading(false);
    }
  };

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

  if (activeTab === 'costs' && loading) {
    return <LoadingSkeleton type="page" />;
  }

  return (
    <div className="min-h-screen bg-primary-light pb-28">
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
        {/* Tab System */}
        <div className="bg-white rounded-lg shadow">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('costs')}
              className={`flex-1 px-4 py-3 text-center font-medium transition-colors ${
                activeTab === 'costs'
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-gray-600 hover:text-accent'
              }`}
            >
              Chi phí
            </button>
            <button
              onClick={() => setActiveTab('profit')}
              className={`flex-1 px-4 py-3 text-center font-medium transition-colors ${
                activeTab === 'profit'
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-gray-600 hover:text-accent'
              }`}
            >
              Lãi/Lỗ
            </button>
          </div>
        </div>

        {/* Costs Tab Content */}
        {activeTab === 'costs' && (
          <>
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
          </>
        )}

        {/* Profit Tab Content */}
        {activeTab === 'profit' && (
          <>
            {/* Period Selector */}
            <div className="bg-white rounded-lg p-4 shadow">
              <div className="flex gap-2 mb-4 overflow-x-auto">
                {['monthly', 'quarterly', 'yearly'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setProfitPeriod(p)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                      profitPeriod === p
                        ? 'bg-accent text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {p === 'monthly' && 'Tháng'}
                    {p === 'quarterly' && 'Quý'}
                    {p === 'yearly' && 'Năm'}
                  </button>
                ))}
              </div>

              {/* Period Input */}
              {profitPeriod === 'monthly' && (
                <input
                  type="month"
                  value={profitMonth}
                  onChange={(e) => setProfitMonth(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              )}
              {profitPeriod === 'quarterly' && (
                <div className="flex gap-2">
                  <select
                    value={profitQuarter}
                    onChange={(e) => setProfitQuarter(parseInt(e.target.value))}
                    className="flex-1 px-3 py-2 border-2 border-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value={1}>Quý 1</option>
                    <option value={2}>Quý 2</option>
                    <option value={3}>Quý 3</option>
                    <option value={4}>Quý 4</option>
                  </select>
                  <input
                    type="number"
                    value={profitYear}
                    onChange={(e) => setProfitYear(e.target.value)}
                    min="2020"
                    max="2099"
                    className="flex-1 px-3 py-2 border-2 border-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Năm"
                  />
                </div>
              )}
              {profitPeriod === 'yearly' && (
                <input
                  type="number"
                  value={profitYear}
                  onChange={(e) => setProfitYear(e.target.value)}
                  min="2020"
                  max="2099"
                  className="w-full px-3 py-2 border-2 border-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Năm"
                />
              )}
            </div>

            {/* Profit Data Display */}
            {profitLoading ? (
              <LoadingSkeleton type="page" />
            ) : profitData ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-sm text-gray-600 mb-1">Doanh thu</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(profitData.revenue)}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-sm text-gray-600 mb-1">Chi phí</p>
                    <p className="text-xl font-bold text-red-600">
                      {formatCurrency(profitData.costs)}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-sm text-gray-600 mb-1">Lãi/Lỗ</p>
                    <p className={`text-xl font-bold ${
                      profitData.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(profitData.profit)}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-sm text-gray-600 mb-1">Tỷ lệ lãi/lỗ</p>
                    <p className={`text-xl font-bold ${
                      profitData.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {profitData.profitMargin.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Bar Chart: Revenue vs Costs vs Profit */}
                <div className="bg-white rounded-lg p-4 shadow">
                  <h3 className="font-semibold mb-4">Doanh thu vs Chi phí vs Lãi/Lỗ</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={[
                        {
                          name: profitPeriod === 'monthly' ? 'Tháng' : profitPeriod === 'quarterly' ? 'Quý' : 'Năm',
                          DoanhThu: profitData.revenue,
                          ChiPhi: profitData.costs,
                          LaiLo: profitData.profit,
                        },
                      ]}
                      isAnimationActive={false}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="DoanhThu" fill="#10b981" />
                      <Bar dataKey="ChiPhi" fill="#ef4444" />
                      <Bar dataKey="LaiLo" fill={profitData.profit >= 0 ? '#10b981' : '#ef4444'} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Pie Chart: Costs by Category */}
                {profitData.costs > 0 && (
                  <div className="bg-white rounded-lg p-4 shadow">
                    <h3 className="font-semibold mb-4">Phân bổ chi phí theo loại</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Nguyên liệu', value: profitData.costsByCategory.material || 0 },
                            { name: 'Nước đá', value: profitData.costsByCategory.ice || 0 },
                            { name: 'Khác', value: profitData.costsByCategory.other || 0 },
                          ].filter(item => item.value > 0)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent, value }) => 
                            `${name}: ${(percent * 100).toFixed(1)}% (${formatCurrency(value)})`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          isAnimationActive={false}
                        >
                          {[
                            { name: 'Nguyên liệu', value: profitData.costsByCategory.material || 0 },
                            { name: 'Nước đá', value: profitData.costsByCategory.ice || 0 },
                            { name: 'Khác', value: profitData.costsByCategory.other || 0 },
                          ]
                            .filter(item => item.value > 0)
                            .map((entry, index) => {
                              const colors = ['#7A9A6E', '#A8C090', '#DEE9CB'];
                              return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                            })}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Comparison with Previous Period */}
                <div className="bg-white rounded-lg p-4 shadow">
                  <p className="text-sm text-gray-600 mb-2">
                    So với {profitPeriod === 'monthly' ? 'tháng trước' : profitPeriod === 'quarterly' ? 'quý trước' : 'năm trước'}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${
                        profitData.profitChange >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {profitData.profitChange >= 0 ? '+' : ''}
                        {formatCurrency(profitData.profitChange)}
                      </span>
                      {profitData.profitChangePercent !== undefined && (
                        <span className={`text-sm ${
                          profitData.profitChangePercent >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ({profitData.profitChangePercent >= 0 ? '+' : ''}
                          {profitData.profitChangePercent.toFixed(1)}%)
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Kỳ trước - Doanh thu: {formatCurrency(profitData.previousRevenue)}</p>
                      <p>Kỳ trước - Chi phí: {formatCurrency(profitData.previousCosts)}</p>
                      <p>Kỳ trước - Lãi/Lỗ: {formatCurrency(profitData.previousProfit)}</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <EmptyState
                icon={HiCube}
                title="Chưa có dữ liệu"
                message="Chọn thời gian để xem lãi/lỗ"
              />
            )}
          </>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-end">
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

            <form onSubmit={handleSubmit} className="p-4 pb-24 space-y-4">
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

