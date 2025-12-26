import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HiChevronLeft, HiArrowPath, HiPrinter } from 'react-icons/hi2';
import { dailyShiftService } from '../services/dailyShiftService';
import CelebrationModal from '../components/CelebrationModal';
import showToast from '../utils/toast';
import { getTodayDate, isToday as isTodayHelper } from '../utils/dateHelper';
import { 
  checkAndroidApp, 
  generateEscPosCommands, 
  convertToBase64 
} from '../utils/escposHelper';

const DailyShift = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [shift, setShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingStartAmount, setEditingStartAmount] = useState(false);
  const [startAmount, setStartAmount] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => getTodayDate());
  const [showCelebration, setShowCelebration] = useState(false);
  const [printing, setPrinting] = useState(false);
  const intervalRef = useRef(null);

  // Đảm bảo ngày mặc định luôn là hôm nay khi component mount lần đầu
  useEffect(() => {
    if (location.pathname === '/shift') {
      const today = getTodayDate();
      setSelectedDate(today);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Chỉ chạy một lần khi component mount

  const isToday = () => {
    return isTodayHelper(selectedDate);
  };

  const fetchShift = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      const response = await dailyShiftService.getOrCreate(selectedDate);
      const shiftData = response.data;
      setShift(shiftData);
      setStartAmount(shiftData.startAmount.toString());
    } catch (error) {
      if (!silent) {
        showToast.error('Lỗi khi tải dữ liệu ca làm việc');
      }
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchShift();
  }, [selectedDate]);

  // Real-time polling for today's shift
  useEffect(() => {
    // Only poll if selected date is today and we're on this page
    if (isToday() && location.pathname === '/shift') {
      const startPolling = () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(() => {
          fetchShift(true); // Silent refresh
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
        } else if (isToday() && location.pathname === '/shift') {
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
      // Clear interval if not today or not on this page
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [selectedDate, location.pathname, isToday]);

  const handleUpdateStartAmount = async () => {
    try {
      const response = await dailyShiftService.updateStartAmount(shift._id, parseFloat(startAmount));
      setShift(response.data);
      setEditingStartAmount(false);
      showToast.success('Đã cập nhật tiền đầu ca');
    } catch (error) {
      showToast.error('Lỗi khi cập nhật tiền đầu ca');
      console.error(error);
    }
  };

  // Xử lý khi bấm vào linh vật
  const handleMascotClick = () => {
    const today = getTodayDate();
    console.log('🎯 Mascot clicked:', { 
      selectedDate, 
      today, 
      isToday: isToday(), 
      shiftEndAmount: shift?.endAmount,
      shift: shift ? 'exists' : 'null'
    });
    
    if (isToday() && shift && shift.endAmount >= 200000) {
      setShowCelebration(true);
    } else if (!isToday()) {
      showToast.info(`Chỉ có thể xem celebration cho ngày hôm nay (${today}). Ngày đã chọn: ${selectedDate}`);
    } else if (!shift || shift.endAmount < 200000) {
      showToast.info(`Chưa đạt mốc 200k để xem celebration. Doanh thu hiện tại: ${shift?.endAmount || 0} đ`);
    }
  };

  const handlePrint = () => {
    if (!shift || !shift._id) {
      showToast.error('Không có dữ liệu ca làm việc để in');
      return;
    }

    try {
      setPrinting(true);

      // Kiểm tra Android app có sẵn không
      if (checkAndroidApp()) {
        // In qua Android app
        printViaAndroid(shift);
      } else {
        // Fallback: HTML print page
        printViaHtml(shift);
      }
    } catch (error) {
      console.error('Error printing:', error);
      showToast.error('Lỗi khi in: ' + (error.message || 'Lỗi không xác định'));
      setPrinting(false);
    }
  };

  // In qua Android app
  const printViaAndroid = (shift) => {
    try {
      // Setup callbacks
      window.onPrintSuccess = () => {
        console.log('In thành công!');
        showToast.success('In thành công!');
        setPrinting(false);
      };

      window.onPrintError = (error) => {
        console.error('Lỗi in:', error);
        showToast.error('Lỗi khi in: ' + error);
        setPrinting(false);
      };

      // Generate ESC/POS commands
      const escposCommands = generateEscPosCommands(shift);
      
      // Convert to Base64
      const escposBase64 = convertToBase64(escposCommands);

      // Hiển thị thông báo
      showToast.info('Đang gửi lệnh in đến máy in...');

      // Gọi Android app
      // IP mặc định: 192.168.0.4, Port: 9100
      window.AndroidPrinter.print(escposBase64, '192.168.0.4', 9100);
    } catch (error) {
      console.error('Error printing via Android:', error);
      showToast.error('Lỗi khi gọi Android app: ' + (error.message || 'Lỗi không xác định'));
      setPrinting(false);
    }
  };

  // Fallback: In qua HTML print page
  const printViaHtml = (shift) => {
    try {
      // Lấy URL HTML print từ service
      const printUrl = dailyShiftService.print(shift._id);
      
      // Hiển thị thông báo
      showToast.info('Đang mở trang in...');
      
      // Mở HTML print page trong tab mới
      // iOS sẽ tự động hiện Share Sheet khi mở
      const printWindow = window.open(printUrl, '_blank');
      
      if (!printWindow) {
        showToast.error('Không thể mở trang in. Vui lòng kiểm tra popup blocker.');
        setPrinting(false);
      } else {
        // Reset printing state sau một chút
        setTimeout(() => {
          setPrinting(false);
        }, 1000);
      }
    } catch (error) {
      console.error('Error printing via HTML:', error);
      showToast.error('Lỗi khi mở trang in: ' + (error.message || 'Lỗi không xác định'));
      setPrinting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-light flex items-center justify-center">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-light pb-24">
      {/* Header */}
      <header className="bg-primary shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-gray-600">
            <HiChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold flex-1 text-accent-dark">Ca làm việc</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchShift(false)}
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
        {/* Date Selector */}
        <div className="bg-white rounded-lg p-4 shadow">
          <label className="block text-sm font-medium mb-2">Chọn ngày</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border-2 border-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {shift && (
          <>
            {/* Start Amount */}
            <div className="bg-white rounded-lg p-4 shadow">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-600">Tiền đầu ca</label>
                {!editingStartAmount && (
                  <button
                    onClick={() => setEditingStartAmount(true)}
                    className="text-sm text-accent hover:text-accent-dark"
                  >
                    Sửa
                  </button>
                )}
              </div>
              {editingStartAmount ? (
                <div className="space-y-2">
                  <input
                    type="number"
                    value={startAmount}
                    onChange={(e) => setStartAmount(e.target.value)}
                    placeholder="Nhập tiền đầu ca..."
                    min="0"
                    step="1000"
                    className="w-full px-3 py-2 border-2 border-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingStartAmount(false);
                        setStartAmount(shift.startAmount.toString());
                      }}
                      className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleUpdateStartAmount}
                      className="flex-1 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark"
                    >
                      Lưu
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-2xl font-bold text-accent">{formatCurrency(shift.startAmount)}</p>
              )}
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-br from-primary to-primary-dark rounded-lg p-6 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-accent-dark">Tổng kết ca làm việc</h2>
                <button
                  onClick={handlePrint}
                  disabled={printing}
                  className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors disabled:opacity-50"
                  aria-label="In bill"
                >
                  <HiPrinter className={`w-5 h-5 text-accent-dark ${printing ? 'animate-pulse' : ''}`} />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Tiền đầu ca */}
                <div className="bg-white bg-opacity-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Tiền đầu ca</p>
                      <p className="text-xs text-gray-500">(Tiền mang theo để thối cho khách)</p>
                    </div>
                    <span className="text-2xl font-bold text-accent-dark">{formatCurrency(shift.startAmount)}</span>
                  </div>
                </div>

                {/* Doanh thu hôm nay */}
                <div className="bg-white bg-opacity-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Doanh thu hôm nay</p>
                      <p className="text-xs text-gray-500">(Tổng tiền bán được)</p>
                    </div>
                    <span className="text-2xl font-bold text-green-600">{formatCurrency(shift.endAmount)}</span>
                  </div>
                </div>

                {/* Tổng tiền có */}
                <div className="bg-accent bg-opacity-20 rounded-lg p-4 border-2 border-accent">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-semibold text-accent-dark mb-1">Tổng tiền có</p>
                      <p className="text-xs text-gray-600">(Tiền đầu ca + Doanh thu)</p>
                    </div>
                    <span className="text-3xl font-bold text-accent">{formatCurrency(shift.startAmount + shift.endAmount)}</span>
                  </div>
                </div>
                
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-4 shadow text-center">
                <p className="text-sm text-gray-600 mb-1">Số đơn hàng</p>
                <p className="text-2xl font-bold text-accent">{shift.orders.length}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow text-center">
                <p className="text-sm text-gray-600 mb-1">Đơn hàng trung bình</p>
                <p className="text-2xl font-bold text-accent">
                  {shift.orders.length > 0 
                    ? formatCurrency(Math.round(shift.endAmount / shift.orders.length))
                    : formatCurrency(0)
                  }
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Celebration Modal */}
      {showCelebration && shift && isToday() && shift.endAmount >= 200000 && (
        <CelebrationModal
          revenue={shift.endAmount}
          onClose={() => setShowCelebration(false)}
        />
      )}
    </div>
  );
};

export default DailyShift;

