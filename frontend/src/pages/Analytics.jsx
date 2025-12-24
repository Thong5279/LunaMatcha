import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HiChevronLeft, HiArrowPath } from 'react-icons/hi2';
import { analyticsService } from '../services/analyticsService';
import CelebrationModal from '../components/CelebrationModal';
import { dailyShiftService } from '../services/dailyShiftService';
import showToast from '../utils/toast';
import { getTodayDate, getCurrentMonth, getCurrentYear, isToday as isTodayHelper } from '../utils/dateHelper';
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
  const [period, setPeriod] = useState('daily');
  const [date, setDate] = useState(() => getTodayDate());
  const [month, setMonth] = useState(() => getCurrentMonth());
  const [year, setYear] = useState(() => getCurrentYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const intervalRef = useRef(null);

  // Đảm bảo ngày mặc định luôn là hôm nay khi component mount lần đầu
  useEffect(() => {
    const today = getTodayDate();
    const currentMonth = getCurrentMonth();
    const currentYear = getCurrentYear();
    
    // Chỉ reset nếu đang ở trang analytics và chưa có giá trị
    if (location.pathname === '/analytics') {
      // Reset về ngày hôm nay nếu đang ở period daily
      if (period === 'daily') {
        setDate(today);
      }
      // Reset về tháng hiện tại nếu đang ở period monthly
      if (period === 'monthly') {
        setMonth(currentMonth);
      }
      // Reset về năm hiện tại nếu đang ở period yearly
      if (period === 'yearly') {
        setYear(currentYear);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Chỉ chạy một lần khi component mount

  const isToday = () => {
    return isTodayHelper(date);
  };

  const shouldPoll = () => {
    return period === 'daily' && isToday() && location.pathname === '/analytics';
  };

  const fetchAnalytics = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    try {
      let response;
      switch (period) {
        case 'daily':
          response = await analyticsService.getDaily(date);
          break;
        case 'weekly':
          const week = getWeekNumber(new Date(date));
          response = await analyticsService.getWeekly(week);
          break;
        case 'monthly':
          response = await analyticsService.getMonthly(month);
          break;
        case 'quarterly':
          const quarter = `${year}-Q${Math.ceil(
            (new Date(month + '-01').getMonth() + 1) / 3
          )}`;
          response = await analyticsService.getQuarterly(quarter);
          break;
        case 'yearly':
          response = await analyticsService.getYearly(year);
          break;
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
  }, [period, date, month, year]);

  // Real-time polling for daily analytics (today only)
  useEffect(() => {
    if (shouldPoll()) {
      const startPolling = () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(() => {
          fetchAnalytics(true); // Silent refresh
        }, 10000); // Poll every 10 seconds (reduced from 5s for better mobile performance)
      };

      // Start polling if tab is visible
      if (!document.hidden) {
        startPolling();
      }

      // Handle visibility change
      const handleVisibilityChange = () => {
        if (document.hidden) {
          // Stop polling when tab is not active
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        } else if (shouldPoll()) {
          // Resume polling when tab becomes active
          startPolling();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    } else {
      // Clear interval if conditions not met
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [period, date, location.pathname, shouldPoll]);

  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return `${d.getUTCFullYear()}-W${Math.ceil(
      ((d - yearStart) / 86400000 + 1) / 7
    )}`;
  };

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
      const today = getTodayDate();
      console.log('🎯 Mascot clicked in Analytics:', { today, currentDate: date });
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
                src="https://media.tenor.com/G_ar9s-uj64AAAAi/psybirdb1oom.gif"
                alt="Mascot"
                className="w-12 h-12 object-contain"
              />
            </button>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Period Selector */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {['daily', 'weekly', 'monthly', 'quarterly', 'yearly'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  period === p
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {p === 'daily' && 'Ngày'}
                {p === 'weekly' && 'Tuần'}
                {p === 'monthly' && 'Tháng'}
                {p === 'quarterly' && 'Quý'}
                {p === 'yearly' && 'Năm'}
              </button>
            ))}
          </div>

          {/* Date/Period Inputs */}
          {period === 'daily' && (
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          )}
          {period === 'monthly' && (
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          )}
          {period === 'yearly' && (
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              min="2020"
              max="2099"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          )}
        </div>

        {/* Summary Cards */}
        {data && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-4 shadow">
                <p className="text-sm text-gray-600 mb-1">Doanh thu</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(data.totalRevenue || 0)}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <p className="text-sm text-gray-600 mb-1">Số đơn</p>
                <p className="text-xl font-bold">{data.totalOrders || 0}</p>
              </div>
            </div>

            {/* Additional Stats for Daily */}
            {period === 'daily' && (
              <div className="grid grid-cols-2 gap-3">
                {data.totalItems !== undefined && (
                  <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-sm text-gray-600 mb-1">Số lượng sản phẩm</p>
                    <p className="text-xl font-bold">{data.totalItems || 0}</p>
                  </div>
                )}
                {data.totalOrders > 0 && (
                  <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-sm text-gray-600 mb-1">Đơn hàng trung bình</p>
                    <p className="text-xl font-bold text-accent">
                      {formatCurrency(Math.round((data.totalRevenue || 0) / data.totalOrders))}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Comparison */}
            {data.revenueChange !== undefined && (
              <div className="bg-white rounded-lg p-4 shadow">
                <p className="text-sm text-gray-600 mb-2">
                  {period === 'daily' ? 'So với ngày hôm qua' : 'So với kỳ trước'}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-lg font-bold ${
                        data.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {data.revenueChange >= 0 ? '+' : ''}
                      {formatCurrency(data.revenueChange)}
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
                  {period === 'daily' && data.previousDayRevenue !== undefined && (
                    <p className="text-xs text-gray-500">
                      Ngày hôm qua: {formatCurrency(data.previousDayRevenue)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Charts */}
            {period === 'monthly' && monthlyChartData.length > 0 && (
              <div className="bg-white rounded-lg p-4 shadow">
                <h3 className="font-semibold mb-4">Doanh thu theo ngày</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyChartData} isAnimationActive={false}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#10b981" isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {period === 'yearly' && yearlyChartData.length > 0 && (
              <div className="bg-white rounded-lg p-4 shadow">
                <h3 className="font-semibold mb-4">Doanh thu theo tháng</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={yearlyChartData} isAnimationActive={false}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
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

