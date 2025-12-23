import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiChevronLeft } from 'react-icons/hi2';
import { analyticsService } from '../services/analyticsService';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import showToast from '../utils/toast';

const Analytics = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('daily');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [month, setMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [period, date, month, year]);

  const fetchAnalytics = async () => {
    setLoading(true);
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
      showToast.error('Lỗi khi tải dữ liệu thống kê');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return `${d.getUTCFullYear()}-W${Math.ceil(
      ((d - yearStart) / 86400000 + 1) / 7
    )}`;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
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

            {/* Comparison */}
            {data.revenueChange !== undefined && (
              <div className="bg-white rounded-lg p-4 shadow">
                <p className="text-sm text-gray-600 mb-2">So với kỳ trước</p>
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
              </div>
            )}

            {/* Charts */}
            {period === 'monthly' && data.dailyStats && (
              <div className="bg-white rounded-lg p-4 shadow">
                <h3 className="font-semibold mb-4">Doanh thu theo ngày</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={Object.entries(data.dailyStats).map(([day, stats]) => ({
                    day: `Ngày ${day}`,
                    revenue: stats.revenue,
                    orders: stats.orders,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {period === 'yearly' && data.monthlyStats && (
              <div className="bg-white rounded-lg p-4 shadow">
                <h3 className="font-semibold mb-4">Doanh thu theo tháng</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart
                    data={Object.entries(data.monthlyStats).map(([month, stats]) => ({
                      month: `Tháng ${month}`,
                      revenue: stats.revenue,
                      orders: stats.orders,
                    }))}
                  >
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
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Top Products */}
            {data.topProducts && data.topProducts.length > 0 && (
              <div className="bg-white rounded-lg p-4 shadow">
                <h3 className="font-semibold mb-4">Sản phẩm bán chạy</h3>
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
          </>
        )}
      </div>
    </div>
  );
};

export default Analytics;

