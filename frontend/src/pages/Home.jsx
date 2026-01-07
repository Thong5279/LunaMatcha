import { useState, lazy, Suspense } from 'react';
import ProductList from '../components/ProductList';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { dailyShiftService } from '../services/dailyShiftService';
import showToast from '../utils/toast';
import { getTodayDate } from '../utils/dateHelper';

// Lazy load các components không cần thiết ngay
const SellMode = lazy(() => import('../components/SellMode'));
const ProductForm = lazy(() => import('../components/ProductForm'));
const ToppingManager = lazy(() => import('../components/ToppingManager'));
const CelebrationModal = lazy(() => import('../components/CelebrationModal'));

const Home = () => {
  const [isSellMode, setIsSellMode] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showToppingManager, setShowToppingManager] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [todayRevenue, setTodayRevenue] = useState(0);

  // Loại bỏ prefetch phức tạp - ProductList và ToppingContext sẽ tự fetch khi cần

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
      {/* Header */}
      <header className="bg-primary shadow-sm sticky top-0 z-10">
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
              className="cursor-pointer hover:scale-110 transition-transform"
              aria-label="Xem celebration"
            >
              <img
                src="https://res.cloudinary.com/dlstlvjaq/image/upload/w_48,h_48,c_fill,q_auto,f_auto/v1766651725/psybirdb1oom_qiqb5y.gif"
                alt="Mascot"
                className="w-12 h-12 object-contain"
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
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

    </div>
  );
};

export default Home;

