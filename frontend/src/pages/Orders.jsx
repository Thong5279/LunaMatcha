import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiChevronLeft } from 'react-icons/hi2';
import OrderList from '../components/OrderList';
import CelebrationModal from '../components/CelebrationModal';
import { dailyShiftService } from '../services/dailyShiftService';
import showToast from '../utils/toast';
import { getTodayDate } from '../utils/dateHelper';

const Orders = () => {
  const navigate = useNavigate();
  const [showCelebration, setShowCelebration] = useState(false);
  const [todayRevenue, setTodayRevenue] = useState(0);

  // Xử lý khi bấm vào linh vật
  const handleMascotClick = async () => {
    try {
      const today = getTodayDate();
      console.log('🎯 Mascot clicked in Orders:', { today });
      const response = await dailyShiftService.getOrCreate(today);
      const shiftData = response.data;
      const revenue = (shiftData.cashAmount || 0) + (shiftData.bankTransferAmount || 0);

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
    <div className="min-h-screen bg-primary-light pb-28">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600"
          >
            <HiChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold flex-1">Đơn hàng</h1>
          <div className="flex items-center">
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

      <OrderList />

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

export default Orders;

