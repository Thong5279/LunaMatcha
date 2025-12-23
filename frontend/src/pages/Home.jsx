import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductList from '../components/ProductList';
import SellMode from '../components/SellMode';
import ProductForm from '../components/ProductForm';
import ToppingManager from '../components/ToppingManager';
import CelebrationModal from '../components/CelebrationModal';
import { dailyShiftService } from '../services/dailyShiftService';
import showToast from '../utils/toast';
import { getTodayDate } from '../utils/dateHelper';

const Home = () => {
  const [isSellMode, setIsSellMode] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showToppingManager, setShowToppingManager] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const navigate = useNavigate();

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
              src="https://res.cloudinary.com/dlstlvjaq/image/upload/v1766524914/NTcxZGRmMzhiNzE0Mzg0YTYxMDVfd2U3YXNw.jpg" 
              alt="Luna Matcha" 
              className="w-10 h-10 rounded-full object-cover"
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
                src="https://media.tenor.com/G_ar9s-uj64AAAAi/psybirdb1oom.gif"
                alt="Mascot"
                className="w-12 h-12 object-contain"
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
        <SellMode onComplete={() => setIsSellMode(false)} />
      ) : (
        <ProductList />
      )}

      {/* Product Form Modal */}
      {showProductForm && (
        <ProductForm onClose={() => setShowProductForm(false)} />
      )}

      {/* Topping Manager Modal */}
      {showToppingManager && (
        <ToppingManager onClose={() => setShowToppingManager(false)} />
      )}

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

export default Home;

