import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiChevronLeft, HiArrowPath, HiPlus, HiPencil, HiTrash } from 'react-icons/hi2';
import { costService } from '../services/costService';
import { analyticsService } from '../services/analyticsService';
import showToast from '../utils/toast';
import { getTodayDate, formatDateDisplay, getCurrentMonth, getCurrentYear, formatDateForAPI } from '../utils/dateHelper';
import { formatCurrencyWithUnit, formatCurrency } from '../utils/formatCurrency';
import ConfirmModal from '../components/ConfirmModal';
import PasswordModal from '../components/PasswordModal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import { HiCube } from 'react-icons/hi2';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const Costs = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('costs_authenticated') === 'true';
  });
  const [activeTab, setActiveTab] = useState('costs'); // 'costs' | 'profit'

  const handlePasswordSuccess = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem('costs_authenticated', 'true');
  };
  
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
  const [trendsData, setTrendsData] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [advancedAnalysis, setAdvancedAnalysis] = useState(null);

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
      fetchTrendsData();
    }
  }, [profitPeriod, profitMonth, profitQuarter, profitYear, activeTab]);

  const fetchTrendsData = async () => {
    try {
      const periods = [];
      const currentYear = parseInt(profitYear);
      
      // Fetch last 6 periods
      for (let i = 0; i < 6; i++) {
        if (profitPeriod === 'monthly') {
          const [year, month] = profitMonth.split('-').map(Number);
          const targetDate = new Date(year, month - 1 - i, 1);
          const targetMonth = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
          periods.push({ period: targetMonth, label: `T${targetDate.getMonth() + 1}/${targetDate.getFullYear()}` });
        } else if (profitPeriod === 'quarterly') {
          const targetQuarter = profitQuarter - i;
          let targetYear = currentYear;
          let q = targetQuarter;
          if (q <= 0) {
            q += 4;
            targetYear -= 1;
          }
          periods.push({ period: `${targetYear}-Q${q}`, label: `Q${q}/${targetYear}` });
        } else if (profitPeriod === 'yearly') {
          periods.push({ period: (currentYear - i).toString(), label: (currentYear - i).toString() });
        }
      }

      const trends = await Promise.all(
        periods.map(async ({ period, label }) => {
          try {
            let revenue = 0;
            let costs = 0;
            let startDate, endDate;

            if (profitPeriod === 'monthly') {
              const [year, month] = period.split('-').map(Number);
              startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
              endDate = new Date(year, month, 0, 23, 59, 59, 999);
              const response = await analyticsService.getMonthly(period);
              revenue = response.data?.totalRevenue || 0;
            } else if (profitPeriod === 'quarterly') {
              const [year, quarterNum] = period.split('-Q').map(Number);
              const { start, end } = getQuarterStartEnd(year, quarterNum);
              startDate = start;
              endDate = end;
              const response = await analyticsService.getQuarterly(period);
              revenue = response.data?.totalRevenue || 0;
            } else if (profitPeriod === 'yearly') {
              const { start, end } = getYearStartEnd(parseInt(period));
              startDate = start;
              endDate = end;
              const response = await analyticsService.getYearly(period);
              revenue = response.data?.totalRevenue || 0;
            }

            const startDateStr = formatDateForAPI(startDate);
            const endDateStr = formatDateForAPI(endDate);
            
            const costsResponse = await costService.getAll({
              startDate: startDateStr,
              endDate: endDateStr,
            });
            
            console.log(`[DEBUG] Trends - Period ${period} costs response:`, {
              period,
              startDate: startDateStr,
              endDate: endDateStr,
              hasData: !!costsResponse?.data,
              isArray: Array.isArray(costsResponse?.data)
            });
            
            // Handle different response formats - axios wraps response in .data
            let periodCosts = [];
            if (Array.isArray(costsResponse?.data)) {
              // Standard axios response format
              periodCosts = costsResponse.data;
            } else if (Array.isArray(costsResponse)) {
              // Direct array response (shouldn't happen with axios, but handle it)
              periodCosts = costsResponse;
            } else if (costsResponse?.data && typeof costsResponse.data === 'object' && !Array.isArray(costsResponse.data)) {
              // If data is an object, try to extract array
              periodCosts = Object.values(costsResponse.data).filter(item => Array.isArray(item)).flat() || [];
            } else {
              // Fallback: empty array
              periodCosts = [];
            }
            
            // Ensure periodCosts is always an array
            if (!Array.isArray(periodCosts)) {
              periodCosts = [];
            }
            
            costs = periodCosts.reduce((sum, cost) => {
              const amount = cost?.amount || 0;
              return sum + (typeof amount === 'number' ? amount : parseFloat(amount) || 0);
            }, 0);
            
            console.log(`[DEBUG] Trends - Period ${period} calculated:`, {
              period,
              costsCount: periodCosts.length,
              costs: costs,
              revenue: revenue,
              profit: revenue - costs
            });

            return {
              period: label,
              revenue,
              costs,
              profit: revenue - costs,
            };
          } catch (error) {
            console.error(`Error fetching trend data for ${period}:`, error);
            return { period: label, revenue: 0, costs: 0, profit: 0 };
          }
        })
      );

      setTrendsData(trends.reverse()); // Reverse để hiển thị từ cũ đến mới
    } catch (error) {
      console.error('Error fetching trends data:', error);
    }
  };

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

  // AI Analysis helper
  const generateAIAnalysis = (profitData) => {
    if (!profitData) return null;

    const { revenue, costs, profit, profitMargin, profitChange, profitChangePercent, previousRevenue, previousCosts } = profitData;
    const revenueChange = revenue - previousRevenue;
    const revenueChangePercent = previousRevenue > 0 ? ((revenue - previousRevenue) / previousRevenue) * 100 : 0;
    const costChange = costs - previousCosts;
    const costChangePercent = previousCosts > 0 ? ((costs - previousCosts) / previousCosts) * 100 : 0;

    const analysis = {
      status: profit >= 0 ? 'positive' : 'negative',
      insights: [],
      warnings: [],
      trends: [],
    };

    // Profit analysis
    if (profit >= 0) {
      analysis.insights.push(`Kỳ này có lãi ${formatCurrency(profit)} (${profitMargin.toFixed(1)}% doanh thu)`);
    } else {
      analysis.warnings.push(`⚠️ Kỳ này bị lỗ ${formatCurrency(Math.abs(profit))}`);
    }

    // Revenue trend
    if (revenueChange > 0) {
      analysis.trends.push(`📈 Doanh thu tăng ${formatCurrency(revenueChange)} (${revenueChangePercent.toFixed(1)}%) so với kỳ trước`);
    } else if (revenueChange < 0) {
      analysis.warnings.push(`⚠️ Doanh thu giảm ${formatCurrency(Math.abs(revenueChange))} (${Math.abs(revenueChangePercent).toFixed(1)}%)`);
    } else {
      analysis.trends.push(`➡️ Doanh thu giữ nguyên so với kỳ trước`);
    }

    // Cost trend
    if (costChange > 0) {
      analysis.warnings.push(`⚠️ Chi phí tăng ${formatCurrency(costChange)} (${costChangePercent.toFixed(1)}%)`);
    } else if (costChange < 0) {
      analysis.insights.push(`✅ Chi phí giảm ${formatCurrency(Math.abs(costChange))} (${Math.abs(costChangePercent).toFixed(1)}%)`);
    }

    // Profit change
    if (profitChange > 0) {
      analysis.insights.push(`📊 Lãi tăng ${formatCurrency(profitChange)} (${profitChangePercent.toFixed(1)}%) so với kỳ trước`);
    } else if (profitChange < 0) {
      analysis.warnings.push(`⚠️ Lãi giảm ${formatCurrency(Math.abs(profitChange))} (${Math.abs(profitChangePercent).toFixed(1)}%)`);
    }

    // Profit margin analysis
    if (profitMargin > 30) {
      analysis.insights.push(`💎 Tỷ lệ lãi rất tốt (${profitMargin.toFixed(1)}%)`);
    } else if (profitMargin < 10 && profitMargin >= 0) {
      analysis.warnings.push(`⚠️ Tỷ lệ lãi thấp (${profitMargin.toFixed(1)}%), cần cải thiện`);
    } else if (profitMargin < 0) {
      analysis.warnings.push(`🚨 Đang bị lỗ, cần hành động ngay`);
    }

    return analysis;
  };

  // Generate recommendations
  const generateRecommendations = (profitData) => {
    if (!profitData) return [];

    const { revenue, costs, profit, profitMargin, profitChange, previousRevenue, previousCosts, costsByCategory } = profitData;
    const revenueChange = revenue - previousRevenue;
    const costChange = costs - previousCosts;
    const recommendations = [];

    // Cost reduction recommendations
    if (costs > revenue * 0.7) {
      recommendations.push({
        type: 'cost',
        priority: 'high',
        title: 'Giảm chi phí',
        description: `Chi phí chiếm ${((costs / revenue) * 100).toFixed(1)}% doanh thu. Cần xem xét giảm chi phí để cải thiện lãi.`,
        actions: [
          'Xem xét đàm phán lại giá với nhà cung cấp',
          'Tối ưu hóa quy trình sản xuất để giảm lãng phí',
          'Kiểm tra và cắt giảm chi phí không cần thiết',
        ],
      });
    }

    // Revenue increase recommendations
    if (revenueChange < 0) {
      recommendations.push({
        type: 'revenue',
        priority: 'high',
        title: 'Tăng doanh thu',
        description: `Doanh thu giảm ${formatCurrency(Math.abs(revenueChange))} so với kỳ trước.`,
        actions: [
          'Tăng cường marketing và quảng cáo',
          'Mở rộng sản phẩm/dịch vụ',
          'Cải thiện chất lượng để tăng giá trị đơn hàng',
        ],
      });
    }

    // Category-specific recommendations
    const totalCosts = costsByCategory.material + costsByCategory.ice + costsByCategory.other;
    if (costsByCategory.material > totalCosts * 0.6) {
      recommendations.push({
        type: 'category',
        priority: 'medium',
        title: 'Tối ưu chi phí nguyên liệu',
        description: `Chi phí nguyên liệu chiếm ${((costsByCategory.material / totalCosts) * 100).toFixed(1)}% tổng chi phí.`,
        actions: [
          'Tìm nhà cung cấp với giá tốt hơn',
          'Mua số lượng lớn để được giảm giá',
          'Kiểm tra chất lượng nguyên liệu để tránh lãng phí',
        ],
      });
    }

    // Profit margin recommendations
    if (profitMargin < 15 && profitMargin >= 0) {
      recommendations.push({
        type: 'margin',
        priority: 'medium',
        title: 'Cải thiện tỷ lệ lãi',
        description: `Tỷ lệ lãi hiện tại ${profitMargin.toFixed(1)}% còn thấp.`,
        actions: [
          'Tăng giá bán nếu thị trường cho phép',
          'Giảm chi phí vận hành',
          'Tối ưu hóa quy trình để tăng hiệu quả',
        ],
      });
    }

    if (profit < 0) {
      recommendations.push({
        type: 'urgent',
        priority: 'critical',
        title: 'Hành động khẩn cấp',
        description: `Đang bị lỗ ${formatCurrency(Math.abs(profit))}. Cần hành động ngay.`,
        actions: [
          'Xem xét tăng giá bán',
          'Giảm chi phí không cần thiết ngay lập tức',
          'Tăng cường bán hàng để tăng doanh thu',
          'Xem xét tạm dừng các hoạt động không sinh lời',
        ],
      });
    }

    return recommendations;
  };

  // Generate Advanced AI Analysis
  const generateAdvancedAIAnalysis = (profitData, analyticsData, trendsData) => {
    if (!profitData) return null;

    const { revenue, costs, profit, profitMargin, profitChange, profitChangePercent, previousRevenue, previousCosts, costsByCategory } = profitData;
    const totalOrders = analyticsData?.totalOrders || 0;
    const topProducts = analyticsData?.topProducts || [];
    
    // Calculate advanced metrics
    const aov = calculateAOV(revenue, totalOrders);
    const costEfficiency = calculateCostEfficiency(revenue, costs);
    const revenueGrowthRate = calculateGrowthRate(revenue, previousRevenue);
    const costGrowthRate = calculateGrowthRate(costs, previousCosts);
    const profitPerOrder = totalOrders > 0 ? profit / totalOrders : 0;
    
    // Pattern detection
    const patterns = identifyPatterns(trendsData);
    const anomalies = detectAnomalies(trendsData.map(d => ({ value: d.revenue, period: d.period })));
    
    // Calculate health score (0-100)
    let healthScore = 50; // Base score
    if (profitMargin > 30) healthScore += 20;
    else if (profitMargin > 15) healthScore += 10;
    else if (profitMargin < 0) healthScore -= 30;
    else if (profitMargin < 10) healthScore -= 10;
    
    if (revenueGrowthRate > 10) healthScore += 10;
    else if (revenueGrowthRate < -10) healthScore -= 15;
    
    if (costGrowthRate > revenueGrowthRate && revenueGrowthRate > 0) healthScore -= 10;
    if (costEfficiency > 2) healthScore += 10;
    else if (costEfficiency < 1.2) healthScore -= 15;
    
    healthScore = Math.max(0, Math.min(100, healthScore));

    // Executive Summary
    const executiveSummary = {
      healthScore,
      healthStatus: healthScore >= 70 ? 'excellent' : healthScore >= 50 ? 'good' : healthScore >= 30 ? 'fair' : 'poor',
      keyMetrics: {
        revenue,
        costs,
        profit,
        profitMargin,
        aov,
        costEfficiency,
        totalOrders
      },
      criticalAlerts: []
    };

    if (profit < 0) {
      executiveSummary.criticalAlerts.push({
        type: 'loss',
        message: `Đang bị lỗ ${formatCurrency(Math.abs(profit))}. Cần hành động ngay.`,
        severity: 'critical'
      });
    }
    if (profitMargin < 5 && profitMargin >= 0) {
      executiveSummary.criticalAlerts.push({
        type: 'low_margin',
        message: `Tỷ lệ lãi rất thấp (${profitMargin.toFixed(1)}%).`,
        severity: 'high'
      });
    }
    if (costGrowthRate > revenueGrowthRate && revenueGrowthRate > 0) {
      executiveSummary.criticalAlerts.push({
        type: 'cost_growth',
        message: `Chi phí tăng nhanh hơn doanh thu (${costGrowthRate.toFixed(1)}% vs ${revenueGrowthRate.toFixed(1)}%).`,
        severity: 'high'
      });
    }

    // Revenue Analysis
    const revenueAnalysis = {
      trends: [],
      aov,
      growthRate: revenueGrowthRate,
      growthAcceleration: 0, // Would need more historical data
      consistency: 'stable', // Simplified
      productContribution: topProducts.slice(0, 5).map(p => ({
        name: p.productName,
        revenue: p.revenue || 0,
        quantity: p.quantity || 0,
        contributionPercent: revenue > 0 ? ((p.revenue || 0) / revenue) * 100 : 0
      }))
    };

    if (revenueGrowthRate > 10) {
      revenueAnalysis.trends.push(`Doanh thu tăng mạnh ${revenueGrowthRate.toFixed(1)}% so với kỳ trước`);
    } else if (revenueGrowthRate < -10) {
      revenueAnalysis.trends.push(`Doanh thu giảm ${Math.abs(revenueGrowthRate).toFixed(1)}% - cần chú ý`);
    }

    if (aov > 0) {
      revenueAnalysis.trends.push(`Giá trị đơn hàng trung bình: ${formatCurrency(aov)}`);
    }

    // Cost Analysis
    const costAnalysis = {
      efficiency: costEfficiency,
      costPerOrder: totalOrders > 0 ? costs / totalOrders : 0,
      categoryBreakdown: costsByCategory,
      optimizationOpportunities: []
    };

    const categoryPercentages = Object.entries(costsByCategory).map(([cat, amount]) => ({
      category: cat,
      amount,
      percentage: costs > 0 ? (amount / costs) * 100 : 0
    }));

    // Find largest cost category
    const largestCategory = categoryPercentages.reduce((max, cat) => 
      cat.percentage > max.percentage ? cat : max, categoryPercentages[0] || { category: 'material', percentage: 0 }
    );

    if (largestCategory.percentage > 60) {
      costAnalysis.optimizationOpportunities.push({
        category: largestCategory.category,
        message: `${categoryLabels[largestCategory.category]} chiếm ${largestCategory.percentage.toFixed(1)}% tổng chi phí - có thể tối ưu`,
        potential: 'high'
      });
    }

    // Operational Insights
    const operationalInsights = {
      profitability: {
        profitPerOrder,
        breakEven: calculateBreakEven(0, costs, revenue, totalOrders),
        margin: profitMargin
      },
      efficiency: {
        costEfficiency,
        revenuePerCost: costEfficiency,
        ordersGrowth: analyticsData?.totalOrders && analyticsData?.previousPeriodOrders ? 
          calculateGrowthRate(analyticsData.totalOrders, analyticsData.previousPeriodOrders) : 0
      },
      benchmarks: {
        aovBenchmark: aov > 50000 ? 'good' : aov > 30000 ? 'average' : 'low',
        marginBenchmark: profitMargin > 25 ? 'excellent' : profitMargin > 15 ? 'good' : profitMargin > 5 ? 'fair' : 'poor'
      }
    };

    // Trends & Predictions
    const trendsAnalysis = {
      patterns: patterns,
      predictions: projectTrends(trendsData, 2),
      anomalies: anomalies,
      seasonal: patterns.seasonal,
      trend: patterns.trend
    };

    return {
      executiveSummary,
      revenueAnalysis,
      costAnalysis,
      operationalInsights,
      trends: trendsAnalysis
    };
  };

  // Generate Strategic Recommendations
  const generateStrategicRecommendations = (analysis, profitData, analyticsData) => {
    if (!analysis || !profitData) return { quickWins: [], strategic: [], risks: [] };

    const recommendations = { quickWins: [], strategic: [], risks: [] };
    const { revenue, costs, profit, profitMargin, costsByCategory } = profitData;
    const { executiveSummary, revenueAnalysis, costAnalysis, operationalInsights } = analysis;
    const topProducts = analyticsData?.topProducts || [];

    // Quick Wins
    if (costAnalysis.optimizationOpportunities.length > 0) {
      recommendations.quickWins.push({
        title: `Tối ưu chi phí ${categoryLabels[costAnalysis.optimizationOpportunities[0].category]}`,
        description: costAnalysis.optimizationOpportunities[0].message,
        impact: 'medium',
        effort: 'low',
        timeframe: '1-2 tuần'
      });
    }

    if (profitMargin < 15 && profitMargin >= 0) {
      recommendations.quickWins.push({
        title: 'Tăng giá trị đơn hàng trung bình',
        description: `AOV hiện tại ${formatCurrency(revenueAnalysis.aov)}. Tăng 10% có thể tăng lãi đáng kể.`,
        impact: 'high',
        effort: 'low',
        timeframe: 'Ngay lập tức',
        actions: [
          'Khuyến khích khách hàng thêm topping',
          'Tạo combo giá trị cao',
          'Upsell sản phẩm bổ sung'
        ]
      });
    }

    // Strategic Recommendations
    if (revenueAnalysis.growthRate < 0) {
      recommendations.strategic.push({
        title: 'Chiến lược tăng trưởng doanh thu',
        description: `Doanh thu giảm ${Math.abs(revenueAnalysis.growthRate).toFixed(1)}%. Cần chiến lược dài hạn.`,
        impact: 'high',
        effort: 'high',
        timeframe: '1-3 tháng',
        actions: [
          'Phân tích sản phẩm bán chạy và tăng cường marketing',
          'Mở rộng kênh bán hàng',
          'Cải thiện trải nghiệm khách hàng',
          'Chạy chương trình khuyến mãi có chiến lược'
        ]
      });
    }

    if (topProducts.length > 0) {
      const topProduct = topProducts[0];
      recommendations.strategic.push({
        title: `Tối ưu hóa sản phẩm "${topProduct.productName}"`,
        description: `Sản phẩm này đóng góp ${revenueAnalysis.productContribution[0]?.contributionPercent.toFixed(1)}% doanh thu.`,
        impact: 'medium',
        effort: 'medium',
        timeframe: '2-4 tuần',
        actions: [
          'Đảm bảo luôn có sẵn sản phẩm này',
          'Tăng cường marketing cho sản phẩm',
          'Xem xét tăng giá nếu thị trường cho phép'
        ]
      });
    }

    // Risk Management
    if (profit < 0) {
      recommendations.risks.push({
        title: 'Cảnh báo: Đang bị lỗ',
        description: `Cần hành động ngay để tránh tổn thất lớn hơn.`,
        severity: 'critical',
        actions: [
          'Xem xét tăng giá bán ngay lập tức',
          'Giảm chi phí không cần thiết',
          'Tăng cường bán hàng',
          'Xem xét tạm dừng hoạt động không sinh lời'
        ]
      });
    }

    if (costAnalysis.efficiency < 1.2) {
      recommendations.risks.push({
        title: 'Hiệu quả chi phí thấp',
        description: `Tỷ lệ doanh thu/chi phí chỉ ${costAnalysis.efficiency.toFixed(2)}. Cần cải thiện.`,
        severity: 'high',
        actions: [
          'Đàm phán lại giá với nhà cung cấp',
          'Tìm nguồn cung cấp rẻ hơn',
          'Tối ưu quy trình để giảm lãng phí'
        ]
      });
    }

    if (operationalInsights.profitability.breakEven.breakEvenOrders > analyticsData?.totalOrders * 0.8) {
      recommendations.risks.push({
        title: 'Điểm hòa vốn cao',
        description: `Cần ${operationalInsights.profitability.breakEven.breakEvenOrders} đơn hàng để hòa vốn.`,
        severity: 'medium',
        actions: [
          'Giảm chi phí cố định',
          'Tăng giá trị đơn hàng trung bình',
          'Tối ưu chi phí biến đổi'
        ]
      });
    }

    return recommendations;
  };

  const fetchProfitData = async () => {
    try {
      setProfitLoading(true);
      console.log('[DEBUG] Fetching profit data:', { profitPeriod, profitMonth, profitQuarter, profitYear });
      
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
        const totalOrders = response.data?.totalOrders || 0;
        const topProducts = response.data?.topProducts || [];
        
        // Get previous month revenue
        const prevResponse = await analyticsService.getMonthly(prevMonth);
        previousRevenue = prevResponse.data?.totalRevenue || 0;
        const prevTotalOrders = prevResponse.data?.totalOrders || 0;
        
        // Store analytics data
        setAnalyticsData({
          totalOrders,
          topProducts,
          paymentMethods: response.data?.cashAmount && response.data?.bankTransferAmount ? {
            cash: response.data.cashAmount,
            bankTransfer: response.data.bankTransferAmount
          } : null,
          previousPeriodOrders: prevTotalOrders
        });
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
        const totalOrders = response.data?.totalOrders || 0;
        const topProducts = response.data?.topProducts || [];
        
        // Get previous quarter revenue
        const prevQuarter = `${prev.year}-Q${prev.quarter}`;
        const prevResponse = await analyticsService.getQuarterly(prevQuarter);
        previousRevenue = prevResponse.data?.totalRevenue || 0;
        const prevTotalOrders = prevResponse.data?.totalOrders || 0;
        
        // Store analytics data
        setAnalyticsData({
          totalOrders,
          topProducts,
          paymentMethods: response.data?.cashAmount && response.data?.bankTransferAmount ? {
            cash: response.data.cashAmount,
            bankTransfer: response.data.bankTransferAmount
          } : null,
          previousPeriodOrders: prevTotalOrders
        });
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
        const totalOrders = response.data?.totalOrders || 0;
        const topProducts = response.data?.topProducts || [];
        
        // Get previous year revenue
        const prevResponse = await analyticsService.getYearly(prevYear);
        previousRevenue = prevResponse.data?.totalRevenue || 0;
        const prevTotalOrders = prevResponse.data?.totalOrders || 0;
        
        // Store analytics data
        setAnalyticsData({
          totalOrders,
          topProducts,
          paymentMethods: response.data?.cashAmount && response.data?.bankTransferAmount ? {
            cash: response.data.cashAmount,
            bankTransfer: response.data.bankTransferAmount
          } : null,
          monthlyStats: response.data?.monthlyStats || null,
          previousPeriodOrders: prevTotalOrders
        });
      }

      // Get costs for the period
      const startDateStr = formatDateForAPI(startDate);
      const endDateStr = formatDateForAPI(endDate);
      console.log('[DEBUG] Fetching costs for period:', { startDate: startDateStr, endDate: endDateStr });
      
      const costsResponse = await costService.getAll({
        startDate: startDateStr,
        endDate: endDateStr,
      });
      console.log('[DEBUG] Costs API response (raw):', { 
        response: costsResponse, 
        hasData: !!costsResponse?.data,
        isArray: Array.isArray(costsResponse?.data),
        responseType: typeof costsResponse,
        responseKeys: costsResponse ? Object.keys(costsResponse) : [],
        dataType: typeof costsResponse?.data,
        dataIsArray: Array.isArray(costsResponse?.data)
      });
      
      // Handle different response formats - axios wraps response in .data
      let costs = [];
      if (Array.isArray(costsResponse?.data)) {
        // Standard axios response format
        costs = costsResponse.data;
        console.log('[DEBUG] Extracted costs from costsResponse.data (axios format)');
      } else if (Array.isArray(costsResponse)) {
        // Direct array response (shouldn't happen with axios, but handle it)
        costs = costsResponse;
        console.log('[DEBUG] Extracted costs from direct array response');
      } else if (costsResponse?.data && typeof costsResponse.data === 'object' && !Array.isArray(costsResponse.data)) {
        // If data is an object, try to extract array
        costs = Object.values(costsResponse.data).filter(item => Array.isArray(item)).flat() || [];
        console.log('[DEBUG] Extracted costs from object response');
      } else {
        // Fallback: empty array
        costs = [];
        console.warn('[DEBUG] Could not extract costs array, using empty array');
      }
      
      // Ensure costs is always an array
      if (!Array.isArray(costs)) {
        console.warn('[DEBUG] Costs is not an array, converting to array');
        costs = [];
      }
      
      console.log('[DEBUG] Processed costs:', { 
        costsCount: costs.length, 
        costs: costs,
        costsSample: costs.slice(0, 2),
        firstCostAmount: costs[0]?.amount,
        firstCostCategory: costs[0]?.category
      });
      
      const totalCosts = costs.reduce((sum, cost) => {
        const amount = cost?.amount || 0;
        return sum + (typeof amount === 'number' ? amount : parseFloat(amount) || 0);
      }, 0);
      console.log('[DEBUG] Total costs calculated from array:', totalCosts);

      // Get previous period costs
      const prevStartDateStr = formatDateForAPI(previousStartDate);
      const prevEndDateStr = formatDateForAPI(previousEndDate);
      console.log('[DEBUG] Fetching previous period costs:', { startDate: prevStartDateStr, endDate: prevEndDateStr });
      
      const prevCostsResponse = await costService.getAll({
        startDate: prevStartDateStr,
        endDate: prevEndDateStr,
      });
      console.log('[DEBUG] Previous costs API response (raw):', { 
        response: prevCostsResponse,
        hasData: !!prevCostsResponse?.data,
        isArray: Array.isArray(prevCostsResponse?.data)
      });
      
      let prevCosts = [];
      if (Array.isArray(prevCostsResponse?.data)) {
        prevCosts = prevCostsResponse.data;
        console.log('[DEBUG] Extracted previous costs from prevCostsResponse.data (axios format)');
      } else if (Array.isArray(prevCostsResponse)) {
        prevCosts = prevCostsResponse;
        console.log('[DEBUG] Extracted previous costs from direct array response');
      } else if (prevCostsResponse?.data && typeof prevCostsResponse.data === 'object' && !Array.isArray(prevCostsResponse.data)) {
        prevCosts = Object.values(prevCostsResponse.data).filter(item => Array.isArray(item)).flat() || [];
        console.log('[DEBUG] Extracted previous costs from object response');
      } else {
        prevCosts = [];
        console.warn('[DEBUG] Could not extract previous costs array, using empty array');
      }
      
      // Ensure prevCosts is always an array
      if (!Array.isArray(prevCosts)) {
        console.warn('[DEBUG] PrevCosts is not an array, converting to array');
        prevCosts = [];
      }
      
      const previousTotalCosts = prevCosts.reduce((sum, cost) => {
        const amount = cost?.amount || 0;
        return sum + (typeof amount === 'number' ? amount : parseFloat(amount) || 0);
      }, 0);
      console.log('[DEBUG] Previous total costs calculated:', previousTotalCosts);

      // Calculate profit
      const profit = revenue - totalCosts;
      const previousProfit = previousRevenue - previousTotalCosts;
      const profitChange = profit - previousProfit;
      const profitChangePercent = previousProfit !== 0 ? (profitChange / previousProfit) * 100 : (profit > 0 ? 100 : 0);

      // Group costs by category
      const costsByCategory = costs.reduce((acc, cost) => {
        const category = cost?.category || 'other';
        const amount = cost?.amount || 0;
        const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
        acc[category] = (acc[category] || 0) + numAmount;
        return acc;
      }, { material: 0, ice: 0, other: 0 });
      
      console.log('[DEBUG] Costs by category:', costsByCategory);
      
      // Fallback: If totalCosts is 0 but costsByCategory has values, recalculate from costsByCategory
      const sumFromCategory = Object.values(costsByCategory).reduce((sum, val) => sum + (val || 0), 0);
      const finalTotalCosts = totalCosts > 0 ? totalCosts : sumFromCategory;
      
      console.log('[DEBUG] Cost calculation validation:', {
        totalCostsFromArray: totalCosts,
        sumFromCategory: sumFromCategory,
        finalTotalCosts: finalTotalCosts,
        usingFallback: totalCosts === 0 && sumFromCategory > 0
      });
      
      // Recalculate profit with final total costs
      const finalProfit = revenue - finalTotalCosts;
      const finalProfitChange = finalProfit - previousProfit;
      const finalProfitChangePercent = previousProfit !== 0 ? (finalProfitChange / previousProfit) * 100 : (finalProfit > 0 ? 100 : 0);

      const profitDataToSet = {
        revenue: revenue || 0,
        costs: finalTotalCosts || 0,
        profit: finalProfit || 0,
        profitMargin: calculateProfitMargin(revenue, finalTotalCosts),
        previousRevenue: previousRevenue || 0,
        previousCosts: previousTotalCosts || 0,
        previousProfit: previousProfit || 0,
        profitChange: finalProfitChange || 0,
        profitChangePercent: finalProfitChangePercent || 0,
        costsByCategory: costsByCategory || { material: 0, ice: 0, other: 0 },
        costs: costs || [],
      };
      
      console.log('[DEBUG] Final profitData to set:', profitDataToSet);
      console.log('[DEBUG] Costs breakdown:', {
        totalCostsFromArray: totalCosts,
        sumFromCategory: sumFromCategory,
        finalTotalCosts: finalTotalCosts,
        costsCount: costs.length,
        costsByCategory,
        revenue,
        profit: finalProfit
      });
      setProfitData(profitDataToSet);
    } catch (error) {
      console.error('[DEBUG] Error fetching profit data:', error);
      console.error('[DEBUG] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack?.substring(0, 500)
      });
      showToast.error(error.response?.data?.message || 'Lỗi khi tải dữ liệu lãi/lỗ');
      // Set profitData to null để hiển thị empty state
      setProfitData(null);
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
      
      // Handle different response formats
      let costsData = [];
      if (Array.isArray(response?.data)) {
        costsData = response.data;
      } else if (Array.isArray(response)) {
        costsData = response;
      } else if (response?.data && typeof response.data === 'object') {
        costsData = Object.values(response.data).filter(item => Array.isArray(item)).flat() || [];
      }
      
      setCosts(costsData);
    } catch (error) {
      showToast.error('Lỗi khi tải danh sách chi phí');
      console.error('[DEBUG] Error fetching costs:', error);
      setCosts([]);
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

  // Show password modal if not authenticated
  if (!isAuthenticated) {
    return (
      <PasswordModal
        isOpen={true}
        onSuccess={handlePasswordSuccess}
        title="Bảo vệ trang chi phí"
        message="Vui lòng nhập mật khẩu để truy cập trang chi phí"
      />
    );
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
            illustration="https://res.cloudinary.com/dlstlvjaq/image/upload/v1768242097/giphy_xuodgw.gif"
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
            ) : profitData && (profitData.revenue !== undefined || profitData.costs !== undefined) ? (
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
                      {formatCurrency(profitData.costs || 0)}
                    </p>
                    {profitData.costsByCategory && (
                      <p className="text-xs text-gray-500 mt-1">
                        {Object.entries(profitData.costsByCategory)
                          .filter(([_, amount]) => amount > 0)
                          .map(([category, amount]) => `${categoryLabels[category]}: ${formatCurrency(amount)}`)
                          .join(', ')}
                      </p>
                    )}
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

                {/* Trends Chart - Line Chart */}
                {trendsData.length > 0 && (() => {
                  console.log('[DEBUG] Rendering Trends Chart with data:', {
                    trendsDataLength: trendsData.length,
                    trendsData: trendsData,
                    costsValues: trendsData.map(d => d.costs),
                    revenueValues: trendsData.map(d => d.revenue),
                    profitValues: trendsData.map(d => d.profit)
                  });
                  return (
                    <div className="bg-white rounded-lg p-4 shadow">
                      <h3 className="font-semibold mb-4">Xu hướng theo thời gian</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={trendsData} isAnimationActive={false}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#10b981"
                          strokeWidth={2}
                          name="Doanh thu"
                          isAnimationActive={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="costs"
                          stroke="#ef4444"
                          strokeWidth={2}
                          name="Chi phí"
                          isAnimationActive={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="profit"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          name="Lãi/Lỗ"
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  );
                })()}

                {/* Bar Chart: Revenue vs Costs vs Profit */}
                {(() => {
                  const barChartData = [{
                    name: profitPeriod === 'monthly' ? 'Tháng' : profitPeriod === 'quarterly' ? 'Quý' : 'Năm',
                    DoanhThu: profitData.revenue,
                    ChiPhi: profitData.costs,
                    LaiLo: profitData.profit,
                  }];
                  console.log('[DEBUG] Rendering Bar Chart with data:', {
                    barChartData,
                    revenue: profitData.revenue,
                    costs: profitData.costs,
                    profit: profitData.profit
                  });
                  return (
                    <div className="bg-white rounded-lg p-4 shadow">
                      <h3 className="font-semibold mb-4">Doanh thu vs Chi phí vs Lãi/Lỗ (Kỳ này)</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart
                          data={barChartData}
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
                  );
                })()}

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

                {/* Enhanced AI Analysis Section */}
                {advancedAnalysis && (
                  <div className="space-y-4">
                    {/* Executive Summary */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 shadow border border-blue-200">
                      <h3 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                        <span className="text-2xl">📊</span>
                        Tóm tắt điều hành
                      </h3>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-white rounded-lg p-3">
                          <p className="text-xs text-gray-600 mb-1">Điểm sức khỏe</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  advancedAnalysis.executiveSummary.healthScore >= 70
                                    ? 'bg-green-500'
                                    : advancedAnalysis.executiveSummary.healthScore >= 50
                                    ? 'bg-yellow-500'
                                    : advancedAnalysis.executiveSummary.healthScore >= 30
                                    ? 'bg-orange-500'
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${advancedAnalysis.executiveSummary.healthScore}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold">
                              {advancedAnalysis.executiveSummary.healthScore}/100
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {advancedAnalysis.executiveSummary.healthStatus === 'excellent' && 'Xuất sắc'}
                            {advancedAnalysis.executiveSummary.healthStatus === 'good' && 'Tốt'}
                            {advancedAnalysis.executiveSummary.healthStatus === 'fair' && 'Trung bình'}
                            {advancedAnalysis.executiveSummary.healthStatus === 'poor' && 'Cần cải thiện'}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-3">
                          <p className="text-xs text-gray-600 mb-1">Giá trị đơn hàng TB</p>
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(advancedAnalysis.revenueAnalysis.aov || 0)}
                          </p>
                        </div>
                      </div>
                      {advancedAnalysis.executiveSummary.criticalAlerts.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {advancedAnalysis.executiveSummary.criticalAlerts.map((alert, idx) => (
                            <div
                              key={idx}
                              className={`p-2 rounded ${
                                alert.severity === 'critical'
                                  ? 'bg-red-100 border border-red-300'
                                  : 'bg-orange-100 border border-orange-300'
                              }`}
                            >
                              <p className="text-sm font-medium">{alert.message}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Revenue Deep Dive */}
                    <div className="bg-white rounded-lg p-4 shadow">
                      <h3 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                        <span className="text-xl">💰</span>
                        Phân tích doanh thu
                      </h3>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Tăng trưởng</p>
                            <p className={`text-lg font-bold ${
                              advancedAnalysis.revenueAnalysis.growthRate >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {advancedAnalysis.revenueAnalysis.growthRate >= 0 ? '+' : ''}
                              {advancedAnalysis.revenueAnalysis.growthRate.toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Hiệu quả chi phí</p>
                            <p className="text-lg font-bold text-blue-600">
                              {advancedAnalysis.costAnalysis.efficiency.toFixed(2)}x
                            </p>
                          </div>
                        </div>
                        {advancedAnalysis.revenueAnalysis.trends.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Xu hướng:</p>
                            <ul className="space-y-1">
                              {advancedAnalysis.revenueAnalysis.trends.map((trend, idx) => (
                                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                  <span className="text-blue-600 mt-0.5">•</span>
                                  <span>{trend}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {advancedAnalysis.revenueAnalysis.productContribution.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Đóng góp sản phẩm:</p>
                            <div className="space-y-2">
                              {advancedAnalysis.revenueAnalysis.productContribution.slice(0, 3).map((product, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm">
                                  <span className="text-gray-700">{product.name}</span>
                                  <span className="font-semibold text-gray-900">
                                    {product.contributionPercent.toFixed(1)}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Cost Deep Dive */}
                    <div className="bg-white rounded-lg p-4 shadow">
                      <h3 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                        <span className="text-xl">📉</span>
                        Phân tích chi phí
                      </h3>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Chi phí/đơn hàng</p>
                            <p className="text-lg font-bold text-red-600">
                              {formatCurrency(advancedAnalysis.costAnalysis.costPerOrder || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Tỷ lệ doanh thu/chi phí</p>
                            <p className="text-lg font-bold text-blue-600">
                              {advancedAnalysis.costAnalysis.efficiency.toFixed(2)}x
                            </p>
                          </div>
                        </div>
                        {advancedAnalysis.costAnalysis.optimizationOpportunities.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Cơ hội tối ưu:</p>
                            <ul className="space-y-1">
                              {advancedAnalysis.costAnalysis.optimizationOpportunities.map((opp, idx) => (
                                <li key={idx} className="text-sm text-orange-700 flex items-start gap-2">
                                  <span className="text-orange-600 mt-0.5">💡</span>
                                  <span>{opp.message}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Operational Insights */}
                    <div className="bg-white rounded-lg p-4 shadow">
                      <h3 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                        <span className="text-xl">⚙️</span>
                        Hiệu quả vận hành
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Lãi/đơn hàng</p>
                          <p className={`text-lg font-bold ${
                            advancedAnalysis.operationalInsights.profitability.profitPerOrder >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}>
                            {formatCurrency(advancedAnalysis.operationalInsights.profitability.profitPerOrder || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Benchmark AOV</p>
                          <p className={`text-sm font-semibold ${
                            advancedAnalysis.operationalInsights.benchmarks.aovBenchmark === 'good'
                              ? 'text-green-600'
                              : advancedAnalysis.operationalInsights.benchmarks.aovBenchmark === 'average'
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}>
                            {advancedAnalysis.operationalInsights.benchmarks.aovBenchmark === 'good' && 'Tốt'}
                            {advancedAnalysis.operationalInsights.benchmarks.aovBenchmark === 'average' && 'Trung bình'}
                            {advancedAnalysis.operationalInsights.benchmarks.aovBenchmark === 'low' && 'Thấp'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Trends & Predictions */}
                    {advancedAnalysis.trends && (
                      <div className="bg-white rounded-lg p-4 shadow">
                        <h3 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                          <span className="text-xl">📈</span>
                          Xu hướng & Dự đoán
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-600">Xu hướng:</span>
                            <span className={`font-semibold ${
                              advancedAnalysis.trends.trend === 'increasing'
                                ? 'text-green-600'
                                : advancedAnalysis.trends.trend === 'decreasing'
                                ? 'text-red-600'
                                : 'text-gray-600'
                            }`}>
                              {advancedAnalysis.trends.trend === 'increasing' && 'Tăng trưởng'}
                              {advancedAnalysis.trends.trend === 'decreasing' && 'Suy giảm'}
                              {advancedAnalysis.trends.trend === 'stable' && 'Ổn định'}
                            </span>
                          </div>
                          {advancedAnalysis.trends.seasonal && (
                            <p className="text-sm text-blue-600">✓ Phát hiện mô hình theo mùa</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Fallback to old AI Analysis if advanced not available */}
                {!advancedAnalysis && generateAIAnalysis(profitData) && (() => {
                  const analysis = generateAIAnalysis(profitData);
                  return (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 shadow border border-blue-200">
                      <h3 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                        <span className="text-2xl">🤖</span>
                        Phân tích AI
                      </h3>
                      <div className="space-y-3">
                        {analysis.insights.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Nhận định tích cực:</p>
                            <ul className="space-y-1">
                              {analysis.insights.map((insight, idx) => (
                                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                  <span className="text-green-600 mt-0.5">✓</span>
                                  <span>{insight}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {analysis.warnings.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-red-700 mb-2">Cảnh báo:</p>
                            <ul className="space-y-1">
                              {analysis.warnings.map((warning, idx) => (
                                <li key={idx} className="text-sm text-red-700 flex items-start gap-2">
                                  <span className="text-red-600 mt-0.5">⚠</span>
                                  <span>{warning}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {analysis.trends.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Xu hướng:</p>
                            <ul className="space-y-1">
                              {analysis.trends.map((trend, idx) => (
                                <li key={idx} className="text-sm text-gray-700">{trend}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Breakdown Analysis */}
                {profitData.costsByCategory && (
                  <div className="bg-white rounded-lg p-4 shadow">
                    <h3 className="font-semibold mb-4">Phân tích chi tiết chi phí</h3>
                    {profitData.costs > 0 ? (
                      <div className="space-y-3">
                        {Object.entries(profitData.costsByCategory).map(([category, amount]) => {
                          if (amount === 0) return null;
                          const percentage = (amount / profitData.costs) * 100;
                        return (
                          <div key={category} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-gray-800">
                                {categoryLabels[category]}
                              </span>
                              <span className="font-bold text-gray-900">
                                {formatCurrency(amount)}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-accent h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {percentage.toFixed(1)}% tổng chi phí
                            </p>
                          </div>
                        );
                      })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Chưa có chi phí nào trong kỳ này</p>
                    )}
                  </div>
                )}

                {/* Strategic Recommendations */}
                {advancedAnalysis && (() => {
                  const strategicRecs = generateStrategicRecommendations(advancedAnalysis, profitData, analyticsData);
                  return (
                    (strategicRecs.quickWins.length > 0 || strategicRecs.strategic.length > 0 || strategicRecs.risks.length > 0) && (
                      <div className="bg-white rounded-lg p-4 shadow border-l-4 border-yellow-400">
                        <h3 className="font-semibold mb-4 text-gray-800 flex items-center gap-2">
                          <span className="text-2xl">💡</span>
                          Gợi ý chiến lược
                        </h3>
                        <div className="space-y-4">
                          {strategicRecs.quickWins.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-green-700 mb-2">⚡ Quick Wins (Thắng nhanh)</h4>
                              <div className="space-y-3">
                                {strategicRecs.quickWins.map((rec, idx) => (
                                  <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-3">
                                    <div className="flex items-start justify-between mb-2">
                                      <h5 className="font-semibold text-gray-800">{rec.title}</h5>
                                      <span className="text-xs text-green-700 bg-green-200 px-2 py-1 rounded">
                                        {rec.timeframe}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                                    {rec.actions && rec.actions.length > 0 && (
                                      <ul className="space-y-1">
                                        {rec.actions.map((action, aIdx) => (
                                          <li key={aIdx} className="text-sm text-gray-600 flex items-start gap-2">
                                            <span className="text-green-600 mt-0.5">•</span>
                                            <span>{action}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {strategicRecs.strategic.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-blue-700 mb-2">🎯 Chiến lược dài hạn</h4>
                              <div className="space-y-3">
                                {strategicRecs.strategic.map((rec, idx) => (
                                  <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <div className="flex items-start justify-between mb-2">
                                      <h5 className="font-semibold text-gray-800">{rec.title}</h5>
                                      <span className="text-xs text-blue-700 bg-blue-200 px-2 py-1 rounded">
                                        {rec.timeframe}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                                    {rec.actions && rec.actions.length > 0 && (
                                      <ul className="space-y-1">
                                        {rec.actions.map((action, aIdx) => (
                                          <li key={aIdx} className="text-sm text-gray-600 flex items-start gap-2">
                                            <span className="text-blue-600 mt-0.5">•</span>
                                            <span>{action}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {strategicRecs.risks.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-red-700 mb-2">⚠️ Quản lý rủi ro</h4>
                              <div className="space-y-3">
                                {strategicRecs.risks.map((rec, idx) => (
                                  <div key={idx} className={`border rounded-lg p-3 ${
                                    rec.severity === 'critical'
                                      ? 'bg-red-50 border-red-300'
                                      : 'bg-orange-50 border-orange-300'
                                  }`}>
                                    <div className="flex items-start justify-between mb-2">
                                      <h5 className="font-semibold text-gray-800">{rec.title}</h5>
                                      <span className={`text-xs px-2 py-1 rounded ${
                                        rec.severity === 'critical'
                                          ? 'bg-red-200 text-red-800'
                                          : 'bg-orange-200 text-orange-800'
                                      }`}>
                                        {rec.severity === 'critical' ? 'Khẩn cấp' : 'Cao'}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                                    {rec.actions && rec.actions.length > 0 && (
                                      <ul className="space-y-1">
                                        {rec.actions.map((action, aIdx) => (
                                          <li key={aIdx} className="text-sm text-gray-600 flex items-start gap-2">
                                            <span className={`mt-0.5 ${
                                              rec.severity === 'critical' ? 'text-red-600' : 'text-orange-600'
                                            }`}>•</span>
                                            <span>{action}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  );
                })()}

                {/* Fallback Recommendations */}
                {(!advancedAnalysis || !generateStrategicRecommendations(advancedAnalysis, profitData, analyticsData)) && generateRecommendations(profitData).length > 0 && (
                  <div className="bg-white rounded-lg p-4 shadow border-l-4 border-yellow-400">
                    <h3 className="font-semibold mb-4 text-gray-800 flex items-center gap-2">
                      <span className="text-2xl">💡</span>
                      Gợi ý cải thiện
                    </h3>
                    <div className="space-y-4">
                      {generateRecommendations(profitData).map((rec, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border ${
                            rec.priority === 'critical'
                              ? 'bg-red-50 border-red-300'
                              : rec.priority === 'high'
                              ? 'bg-orange-50 border-orange-300'
                              : 'bg-blue-50 border-blue-300'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-800">{rec.title}</h4>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                rec.priority === 'critical'
                                  ? 'bg-red-200 text-red-800'
                                  : rec.priority === 'high'
                                  ? 'bg-orange-200 text-orange-800'
                                  : 'bg-blue-200 text-blue-800'
                              }`}
                            >
                              {rec.priority === 'critical' ? 'Khẩn cấp' : rec.priority === 'high' ? 'Cao' : 'Trung bình'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                          <ul className="space-y-1">
                            {rec.actions.map((action, actionIdx) => (
                              <li key={actionIdx} className="text-sm text-gray-600 flex items-start gap-2">
                                <span className="text-accent mt-0.5">•</span>
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
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
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-gray-500">Kỳ trước</p>
                        <p className="font-semibold text-gray-800">Doanh thu: {formatCurrency(profitData.previousRevenue)}</p>
                        <p className="font-semibold text-gray-800">Chi phí: {formatCurrency(profitData.previousCosts)}</p>
                        <p className="font-semibold text-gray-800">Lãi/Lỗ: {formatCurrency(profitData.previousProfit)}</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-gray-500">Kỳ này</p>
                        <p className="font-semibold text-green-600">Doanh thu: {formatCurrency(profitData.revenue)}</p>
                        <p className="font-semibold text-red-600">Chi phí: {formatCurrency(profitData.costs)}</p>
                        <p className={`font-semibold ${profitData.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          Lãi/Lỗ: {formatCurrency(profitData.profit)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <EmptyState
                illustration="https://res.cloudinary.com/dlstlvjaq/image/upload/v1768242097/giphy_xuodgw.gif"
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

            <form onSubmit={handleSubmit} className="p-4 pb-36 space-y-4">
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

