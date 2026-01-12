import { useState, lazy, Suspense, useEffect } from 'react';
import ProductList from '../components/ProductList';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ProgressRing from '../components/ProgressRing';
import { dailyShiftService } from '../services/dailyShiftService';
import showToast from '../utils/toast';
import { getTodayDate } from '../utils/dateHelper';

// Lazy load các components không cần thiết ngay
const SellMode = lazy(() => import('../components/SellMode'));
const ProductForm = lazy(() => import('../components/ProductForm'));
const ToppingManager = lazy(() => import('../components/ToppingManager'));
const CelebrationModal = lazy(() => import('../components/CelebrationModal'));
const SettingsModal = lazy(() => import('../components/SettingsModal'));

const Home = () => {
  const [isSellMode, setIsSellMode] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showToppingManager, setShowToppingManager] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [todayRevenue, setTodayRevenue] = useState(0);

  // Fetch doanh thu để hiển thị progress ring
  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const today = getTodayDate();
        const response = await dailyShiftService.getOrCreate(today);
        const shiftData = response.data;
        const revenue = shiftData.endAmount || 0;
        setTodayRevenue(revenue);
      } catch (error) {
        console.error('Lỗi khi lấy doanh thu:', error);
      }
    };
    
    fetchRevenue();
    // Refresh mỗi 30 giây
    const interval = setInterval(fetchRevenue, 30000);
    return () => clearInterval(interval);
  }, []);

  // Tính gradient color dựa trên doanh thu - sử dụng các sắc thái xanh lá phù hợp với màu chủ đạo
  const getGradientColor = () => {
    // Sử dụng các sắc thái xanh lá từ màu chủ đạo
    if (todayRevenue < 200000) {
      return 'linear-gradient(135deg, #DEE9CB 0%, #C8D9B5 100%)'; // Primary → Primary-dark
    }
    if (todayRevenue < 500000) {
      return 'linear-gradient(135deg, #C8D9B5 0%, #A8C090 100%)'; // Primary-dark → Secondary
    }
    if (todayRevenue < 800000) {
      return 'linear-gradient(135deg, #A8C090 0%, #98B080 100%)'; // Secondary → Secondary-dark
    }
    return 'linear-gradient(135deg, #98B080 0%, #7A9A6E 100%)'; // Secondary-dark → Accent
  };

  // Xử lý khi bấm vào linh vật
  const handleMascotClick = async () => {
    try {
      const today = getTodayDate();
      console.log('🎯 Mascot clicked in Home:', { today });
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

  return (
    <div className="min-h-screen bg-primary-light pb-24">
      {/* Header với gradient */}
      <header 
        className="shadow-sm sticky top-0 z-10 transition-all duration-500"
        style={{ background: getGradientColor() }}
      >
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img 
              src="https://res.cloudinary.com/dlstlvjaq/image/upload/w_80,h_80,c_fill,q_auto,f_auto/v1766524914/571ddf38b714384a6105_we7asp.jpg" 
              alt="Luna Matcha" 
              className="w-10 h-10 rounded-full object-cover"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
            <h1 className="text-xl font-bold text-accent-dark">Luna Matcha</h1>
          </div>
          <div className="flex items-center">
            <button
              onClick={handleMascotClick}
              className="cursor-pointer hover:scale-110 transition-transform relative"
              aria-label="Xem celebration"
            >
              <ProgressRing revenue={todayRevenue} size={56} strokeWidth={4}>
                <img
                  src="https://res.cloudinary.com/dlstlvjaq/image/upload/w_48,h_48,c_fill,q_auto,f_auto/v1766651725/psybirdb1oom_qiqb5y.gif"
                  alt="Mascot"
                  className="w-12 h-12 object-contain"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                />
              </ProgressRing>
            </button>
          </div>
        </div>
      </header>

      {/* Sell Mode Toggle */}
      <div className="sticky top-[57px] bg-white border-b border-primary-dark z-10 px-4 py-3">
        <div className="flex gap-3">
          <button
            onClick={() => setIsSellMode(!isSellMode)}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold text-base transition-all shadow-md ${
              isSellMode
                ? 'bg-accent text-white hover:bg-accent-dark'
                : 'bg-secondary text-white hover:bg-secondary-dark'
            }`}
          >
            {isSellMode ? 'Hoàn tất' : 'Bán'}
          </button>
          {!isSellMode && (
            <>
              <button
                onClick={() => setShowProductForm(true)}
                className="px-4 py-3 bg-primary text-accent-dark rounded-lg hover:bg-primary-dark font-semibold transition-colors border border-accent"
              >
                + Sản phẩm
              </button>
              <button
                onClick={() => setShowToppingManager(true)}
                className="px-4 py-3 bg-primary text-accent-dark rounded-lg hover:bg-primary-dark font-semibold transition-colors border border-accent"
              >
                Topping
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {isSellMode ? (
        <Suspense fallback={<LoadingSkeleton type="page" />}>
          <SellMode onComplete={() => setIsSellMode(false)} />
        </Suspense>
      ) : (
        <ProductList />
      )}

      {/* Product Form Modal */}
      {showProductForm && (
        <Suspense fallback={<LoadingSkeleton type="modal" />}>
          <ProductForm onClose={() => setShowProductForm(false)} />
        </Suspense>
      )}

      {/* Topping Manager Modal */}
      {showToppingManager && (
        <Suspense fallback={<LoadingSkeleton type="modal" />}>
          <ToppingManager onClose={() => setShowToppingManager(false)} />
        </Suspense>
      )}

      {/* Celebration Modal */}
      {showCelebration && todayRevenue >= 200000 && (
        <Suspense fallback={null}>
          <CelebrationModal
            revenue={todayRevenue}
            onClose={() => setShowCelebration(false)}
          />
        </Suspense>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <Suspense fallback={null}>
          <SettingsModal
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
          />
        </Suspense>
      )}

    </div>
  );
};

export default Home;

