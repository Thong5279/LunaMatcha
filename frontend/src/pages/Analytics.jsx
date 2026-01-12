import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HiChevronLeft, HiArrowPath } from 'react-icons/hi2';
import { analyticsService } from '../services/analyticsService';
import CelebrationModal from '../components/CelebrationModal';
import { dailyShiftService } from '../services/dailyShiftService';
import showToast from '../utils/toast';
import { getCurrentMonth, getCurrentYear } from '../utils/dateHelper';
import { formatCurrency } from '../utils/formatCurrency';
import {
  LineChart,
  Line,
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

const Analytics = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [period, setPeriod] = useState('month'); // 'month' | 'quarter' | 'year'
  const [month, setMonth] = useState(() => getCurrentMonth());
  const [quarter, setQuarter] = useState(1);
  const [year, setYear] = useState(() => getCurrentYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [todayRevenue, setTodayRevenue] = useState(0);

  // Đảm bảo period mặc định khi component mount
  useEffect(() => {
    const currentMonth = getCurrentMonth();
    const currentYear = getCurrentYear();
    const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
    
    if (location.pathname === '/analytics') {
      if (period === 'month') {
        setMonth(currentMonth);
      } else if (period === 'quarter') {
        setQuarter(currentQuarter);
        setYear(currentYear);
      } else if (period === 'year') {
        setYear(currentYear);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Chỉ chạy một lần khi component mount

  const fetchAnalytics = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    try {
      let response;
      switch (period) {
        case 'month': {
          const [yearStr, monthStr] = month.split('-');
          response = await analyticsService.getMonthly(month, { period: 'month', month: monthStr, year: yearStr });
          break;
        }
        case 'quarter': {
          response = await analyticsService.getQuarterly(null, { period: 'quarter', quarter, year });
          break;
        }
        case 'year': {
          response = await analyticsService.getYearly(year, { period: 'year', year });
          break;
        }
        default:
          return;
      }
      setData(response.data);
    } catch (error) {
      if (!silent) {
        showToast.error('Lỗi khi tải dữ liệu thống kê');
      }
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period, month, quarter, year]);


  // Memoize chart data for better performance
  const monthlyChartData = useMemo(() => {
    if (!data?.dailyStats) return [];
    return Object.entries(data.dailyStats).map(([day, stats]) => ({
      day: `Ngày ${day}`,
      revenue: stats.revenue,
      orders: stats.orders,
    }));
  }, [data?.dailyStats]);

  const yearlyChartData = useMemo(() => {
    if (!data?.monthlyStats) return [];
    return Object.entries(data.monthlyStats).map(([month, stats]) => ({
      month: `Tháng ${month}`,
      revenue: stats.revenue,
      orders: stats.orders,
    }));
  }, [data?.monthlyStats]);

  const topProductsBarData = useMemo(() => {
    if (!data?.topProducts) return [];
    return data.topProducts.slice(0, 8).map((product) => ({
      name: product.productName.length > 10 
        ? product.productName.substring(0, 10) + '...' 
        : product.productName,
      quantity: product.quantity,
      revenue: product.revenue,
    }));
  }, [data?.topProducts]);

  const topProductsPieData = useMemo(() => {
    if (!data?.topProducts) return [];
    return data.topProducts.slice(0, 8).map((product) => ({
      name: product.productName,
      value: product.quantity,
      revenue: product.revenue,
    }));
  }, [data?.topProducts]);

  const paymentMethodsData = useMemo(() => {
    if (data?.cashAmount === undefined || data?.bankTransferAmount === undefined) return [];
    return [
      {
        name: 'Tiền mặt',
        value: data.cashAmount || 0,
        fill: '#10b981',
      },
      {
        name: 'Chuyển khoản',
        value: data.bankTransferAmount || 0,
        fill: '#3b82f6',
      },
    ].filter(item => item.value > 0);
  }, [data?.cashAmount, data?.bankTransferAmount]);

  // Xử lý khi bấm vào linh vật
  const handleMascotClick = async () => {
    try {
      const { getTodayDate } = await import('../utils/dateHelper');
      const today = getTodayDate();
      console.log('🎯 Mascot clicked in Analytics:', { today });
      const response = await dailyShiftService.getOrCreate(today);
      const shiftData = response.data;
      const revenue = shiftData.endAmount || 0;

      console.log('📊 Revenue data:', { revenue, shiftData });

      if (revenue >= 200000) {
        setTodayRevenue(revenue);
        setShowCelebration(true);
      } else {
        showToast.info(`Chưa đạt mốc 200k để xem celebration. Doanh thu hiện tại: ${revenue.toLocaleString('vi-VN')} đ`);
      }
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu doanh thu:', error);
      showToast.error('Lỗi khi tải dữ liệu');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-light pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-gray-600">
            <HiChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold flex-1">Thống kê</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAnalytics(false)}
              disabled={refreshing}
              className="text-accent hover:text-accent-dark disabled:opacity-50"
              aria-label="Làm mới"
            >
              <HiArrowPath className={`w-6 h-6 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleMascotClick}
              className="cursor-pointer hover:scale-110 transition-transform"
              aria-label="Xem celebration"
            >
              <img
                src="https://res.cloudinary.com/dlstlvjaq/image/upload/v1766651725/psybirdb1oom_qiqb5y.gif"
                alt="Mascot"
                className="w-12 h-12 object-contain"
              />
            </button>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Period Selector */}
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {['month', 'quarter', 'year'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  period === p
                    ? 'bg-accent text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {p === 'month' && 'Tháng'}
                {p === 'quarter' && 'Quý'}
                {p === 'year' && 'Năm'}
              </button>
            ))}
          </div>

          {/* Period Picker */}
          {period === 'month' && (
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-3 py-2 border-2 border-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          )}
          {period === 'quarter' && (
            <div className="flex gap-2">
              <select
                value={quarter}
                onChange={(e) => setQuarter(parseInt(e.target.value))}
                className="flex-1 px-3 py-2 border-2 border-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value={1}>Quý 1</option>
                <option value={2}>Quý 2</option>
                <option value={3}>Quý 3</option>
                <option value={4}>Quý 4</option>
              </select>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                min="2020"
                max="2099"
                className="flex-1 px-3 py-2 border-2 border-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Năm"
              />
            </div>
          )}
          {period === 'year' && (
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              min="2020"
              max="2099"
              className="w-full px-3 py-2 border-2 border-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Năm"
            />
          )}
        </div>

        {/* Summary Cards */}
        {data && (
          <>
            {/* Main Stats: Doanh thu, Chi phí, Lãi */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-4 shadow">
                <p className="text-sm text-gray-600 mb-1">Doanh thu</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(data.revenue || data.totalRevenue || 0)} đ
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <p className="text-sm text-gray-600 mb-1">Tổng chi phí</p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(data.totalCost || 0)} đ
                </p>
              </div>
            </div>

            {/* Lãi */}
            <div className="bg-white rounded-lg p-4 shadow border-2 border-accent">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-gray-600">Lãi ({period === 'month' ? 'tháng' : period === 'quarter' ? 'quý' : 'năm'})</p>
                {data.profitMargin !== undefined && (
                  <span className={`text-sm font-medium ${
                    data.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {data.profitMargin >= 0 ? '+' : ''}{data.profitMargin.toFixed(1)}%
                  </span>
                )}
              </div>
              <p className={`text-2xl font-bold ${
                (data.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(data.profit || 0)} đ
              </p>
            </div>

            {/* Chi phí theo từng loại */}
            {data.costsByCategory && (
              <div className="bg-white rounded-lg p-4 shadow">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Chi phí theo loại</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Nguyên liệu:</span>
                    <span className="font-semibold text-gray-800">
                      {formatCurrency(data.costsByCategory.material || 0)} đ
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Nước đá:</span>
                    <span className="font-semibold text-gray-800">
                      {formatCurrency(data.costsByCategory.ice || 0)} đ
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Khác:</span>
                    <span className="font-semibold text-gray-800">
                      {formatCurrency(data.costsByCategory.other || 0)} đ
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Số đơn */}
            <div className="bg-white rounded-lg p-4 shadow">
              <p className="text-sm text-gray-600 mb-1">Số đơn hàng</p>
              <p className="text-xl font-bold">{data.totalOrders || 0}</p>
            </div>

            {/* Comparison */}
            {(data.revenueChange !== undefined || data.profitChange !== undefined) && (
              <div className="bg-white rounded-lg p-4 shadow">
                <p className="text-sm text-gray-600 mb-3 font-semibold">
                  So với {period === 'month' ? 'tháng' : period === 'quarter' ? 'quý' : 'năm'} trước
                </p>
                <div className="space-y-3">
                  {/* Doanh thu so sánh */}
                  {data.revenueChange !== undefined && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Doanh thu</p>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-base font-bold ${
                            data.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {data.revenueChange >= 0 ? '+' : ''}
                          {formatCurrency(data.revenueChange)} đ
                        </span>
                        {data.revenueChangePercent !== undefined && (
                          <span
                            className={`text-sm ${
                              data.revenueChangePercent >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            ({data.revenueChangePercent >= 0 ? '+' : ''}
                            {data.revenueChangePercent.toFixed(1)}%)
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Lãi so sánh */}
                  {data.profitChange !== undefined && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Lãi</p>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-base font-bold ${
                            data.profitChange >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {data.profitChange >= 0 ? '+' : ''}
                          {formatCurrency(data.profitChange)} đ
                        </span>
                        {data.profitChangePercent !== undefined && (
                          <span
                            className={`text-sm ${
                              data.profitChangePercent >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            ({data.profitChangePercent >= 0 ? '+' : ''}
                            {data.profitChangePercent.toFixed(1)}%)
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bar Chart: Doanh thu vs Chi phí vs Lãi */}
            {data.revenue !== undefined && (
              <div className="bg-white rounded-lg p-4 shadow">
                <h3 className="font-semibold mb-4">Doanh thu vs Chi phí vs Lãi</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={[
                      {
                        name: period === 'month' ? 'Tháng' : period === 'quarter' ? 'Quý' : 'Năm',
                        DoanhThu: data.revenue || 0,
                        ChiPhi: data.totalCost || 0,
                        Lai: data.profit || 0,
                      },
                    ]}
                    isAnimationActive={false}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => formatCurrency(value) + ' đ'}
                      labelFormatter={() => ''}
                    />
                    <Legend />
                    <Bar dataKey="DoanhThu" fill="#10b981" name="Doanh thu" />
                    <Bar dataKey="ChiPhi" fill="#ef4444" name="Chi phí" />
                    <Bar dataKey="Lai" fill="#3b82f6" name="Lãi" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Pie Chart: Phân bổ Doanh thu vs Chi phí */}
            {data.revenue !== undefined && data.totalCost !== undefined && (
              <div className="bg-white rounded-lg p-4 shadow">
                <h3 className="font-semibold mb-4">Phân bổ Doanh thu vs Chi phí</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Doanh thu', value: data.revenue || 0 },
                        { name: 'Chi phí', value: data.totalCost || 0 },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      isAnimationActive={false}
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value) + ' đ'} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Pie Chart: Phân bổ Chi phí theo loại */}
            {data.costsByCategory && (
              <div className="bg-white rounded-lg p-4 shadow">
                <h3 className="font-semibold mb-4">Phân bổ Chi phí theo loại</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Nguyên liệu', value: data.costsByCategory.material || 0 },
                        { name: 'Nước đá', value: data.costsByCategory.ice || 0 },
                        { name: 'Khác', value: data.costsByCategory.other || 0 },
                      ].filter(item => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      isAnimationActive={false}
                    >
                      <Cell fill="#7A9A6E" />
                      <Cell fill="#3b82f6" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value) + ' đ'} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Phân tích đơn giản */}
            {data.profit !== undefined && (
              <div className="bg-white rounded-lg p-4 shadow">
                <h3 className="font-semibold mb-3 text-gray-800">Phân tích</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  {data.profit >= 0 ? (
                    <p className="text-green-600 font-medium">
                      ✓ {period === 'month' ? 'Tháng' : period === 'quarter' ? 'Quý' : 'Năm'} này có lãi{' '}
                      {formatCurrency(data.profit)} đ ({data.profitMargin?.toFixed(1) || 0}%).
                    </p>
                  ) : (
                    <p className="text-red-600 font-medium">
                      ✗ {period === 'month' ? 'Tháng' : period === 'quarter' ? 'Quý' : 'Năm'} này lỗ{' '}
                      {formatCurrency(Math.abs(data.profit))} đ.
                    </p>
                  )}
                  {data.profitChange !== undefined && (
                    <p className="text-gray-600">
                      So với {period === 'month' ? 'tháng' : period === 'quarter' ? 'quý' : 'năm'} trước:{' '}
                      {data.profitChange >= 0 ? (
                        <span className="text-green-600 font-medium">
                          tăng {formatCurrency(data.profitChange)} đ
                          {data.profitChangePercent !== undefined &&
                            ` (${data.profitChangePercent >= 0 ? '+' : ''}${data.profitChangePercent.toFixed(1)}%)`}
                        </span>
                      ) : (
                        <span className="text-red-600 font-medium">
                          giảm {formatCurrency(Math.abs(data.profitChange))} đ
                          {data.profitChangePercent !== undefined &&
                            ` (${data.profitChangePercent.toFixed(1)}%)`}
                        </span>
                      )}
                    </p>
                  )}
                  {data.totalCost > 0 && (
                    <p className="text-gray-600">
                      Chi phí chiếm{' '}
                      {((data.totalCost / data.revenue) * 100).toFixed(1)}% doanh thu.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Top Products with Charts */}
            {data.topProducts && data.topProducts.length > 0 && (
              <div className="bg-white rounded-lg p-4 shadow">
                <h3 className="font-semibold mb-4">Sản phẩm bán chạy</h3>
                
                {/* Bar Chart - Số lượng bán */}
                <div className="mb-4">
                  <h4 className="text-sm text-gray-600 mb-2">Số lượng bán (Bar Chart)</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={topProductsBarData} layout="vertical" isAnimationActive={false}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip 
                        formatter={(value, name, props) => [
                          name === 'quantity' 
                            ? `${value} cái` 
                            : formatCurrency(value),
                          name === 'quantity' ? 'Số lượng' : 'Doanh thu'
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="quantity" fill="#7A9A6E" isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Pie Chart - Tỷ lệ sản phẩm */}
                <div className="mb-4">
                  <h4 className="text-sm text-gray-600 mb-2">Tỷ lệ sản phẩm (Pie Chart)</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={topProductsPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        isAnimationActive={false}
                      >
                        {topProductsPieData.map((entry, index) => {
                          const colors = [
                            '#7A9A6E', '#A8C090', '#DEE9CB', '#C4D4B0',
                            '#8EAA78', '#B8D0A0', '#62805A', '#98B080'
                          ];
                          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                        })}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name, props) => [
                          `${value} cái (${formatCurrency(props.payload.revenue)})`,
                          'Số lượng'
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Product List */}
                <div className="space-y-2">
                  {data.topProducts.slice(0, 10).map((product, index) => (
                    <div
                      key={product.productId}
                      className="flex justify-between items-center p-2 bg-gray-50 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">#{index + 1}</span>
                        <span className="font-medium">{product.productName}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{product.quantity} cái</p>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(product.revenue)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Methods Chart */}
            {data.cashAmount !== undefined && data.bankTransferAmount !== undefined && (
              <div className="bg-white rounded-lg p-4 shadow">
                <h3 className="font-semibold mb-4">Thống kê thanh toán</h3>
                
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <p className="text-xs text-gray-600 mb-1">Tiền mặt</p>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(data.cashAmount || 0)}
                    </p>
                    {data.totalRevenue > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {((data.cashAmount / data.totalRevenue) * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <p className="text-xs text-gray-600 mb-1">Chuyển khoản</p>
                    <p className="text-lg font-bold text-blue-600">
                      {formatCurrency(data.bankTransferAmount || 0)}
                    </p>
                    {data.totalRevenue > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {((data.bankTransferAmount / data.totalRevenue) * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>

                {/* Pie Chart - Payment Methods */}
                {paymentMethodsData.length > 0 && (
                  <div>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={paymentMethodsData}
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
                          {paymentMethodsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => formatCurrency(value)}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Celebration Modal */}
      {showCelebration && todayRevenue >= 200000 && (
        <CelebrationModal
          revenue={todayRevenue}
          onClose={() => setShowCelebration(false)}
        />
      )}
    </div>
  );
};

export default Analytics;

