import { useEffect, useState } from 'react';
import { HiXMark } from 'react-icons/hi2';

const CelebrationModal = ({ revenue, onClose }) => {
  const [showConfetti, setShowConfetti] = useState(true);

  // Tạo dữ liệu confetti một lần khi component mount - giảm số lượng trên mobile
  const [confettiData] = useState(() => {
    const isMobile = window.innerWidth <= 768;
    const count = isMobile ? 80 : 150; // Giảm số lượng confetti trên mobile
    return Array.from({ length: count }, () => ({
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 2}s`,
      animationDuration: `${2 + Math.random() * 2}s`,
      backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'][
        Math.floor(Math.random() * 6)
      ],
    }));
  });

  // Xác định sticker và message dựa trên doanh thu
  const getCelebrationData = () => {
    if (revenue >= 1000000) {
      return {
        sticker: 'https://res.cloudinary.com/dlstlvjaq/image/upload/v1768201134/E0_B8_A3_E0_B8_A7_E0_B8_A2-_E0_B8_A1_E0_B8_B5_E0_B9_80_E0_B8_87_E0_B8_B4_E0_B8_99_szbvxx.gif',
        message: '💖giàu hơn thần tài,💰triệu phú aka phú bà💖',
        subMessage: 'Thôi đi về nghỉ ngơi thôi bé iu hẹ hẹ!',
      };
    } else if (revenue >= 900000) {
      return {
        sticker: 'https://res.cloudinary.com/dlstlvjaq/image/upload/v1768201184/tutu-tutu-capoo_kidrcp.gif',
        message: '🧧Thần tài gõ cửa!🧧',
        subMessage: 'Thôi đi về nghỉ ngơi thôi bé iu hẹ hẹ!',
      };
    } else if (revenue >= 800000) {
      return {
        sticker: 'https://res.cloudinary.com/dlstlvjaq/image/upload/v1768201067/capoo-bugcat_xsn66s.gif',
        message: '💲yeahhhhhhhh bé iu giỏi quá đi💲',
        subMessage: 'Thôi đi về nghỉ ngơi thôi bé iu hẹ hẹ!',
      };
    } else if (revenue >= 700000) {
      return {
        sticker: 'https://res.cloudinary.com/dlstlvjaq/image/upload/v1768201013/bugcat-capoo_wphjel.gif',
        message: '💰Phú bà nèo dị chời💰',
        subMessage: 'Thôi đi về nghỉ ngơi thôi bé iu hẹ hẹ!',
      };
    } else if (revenue >= 600000) {
      return {
        sticker: 'https://res.cloudinary.com/dlstlvjaq/image/upload/v1768200844/capoo-_E8_8A_B1_E8_8A_B1_gll2pt.gif',
        message: '🎋Người thành công có lối đi riêng🎋',
        subMessage: 'Thôi đi về nghỉ ngơi thôi bé iu hẹ hẹ!',
      };
    } else if (revenue >= 500000) {
      return {
        sticker: 'https://res.cloudinary.com/dlstlvjaq/image/upload/v1766650346/bug-cat-capoo_fk2boh.gif',
        message: '🎉 Xuất sắc! Bạn đã đạt hơn 500k! 🎉',
        subMessage: 'Thôi đi về nghỉ ngơi thôi bé iu hẹ hẹ!',
      };
    } else if (revenue >= 400000) {
      return {
        sticker: 'https://res.cloudinary.com/dlstlvjaq/image/upload/v1766650386/bugcat-capoo_yw1ltt.gif',
        message: '🎊 Tuyệt vời! Bạn đã đạt hơn 400k! 🎊',
        subMessage: 'bé iu của anh giỏi quá dị nè!',
      };
    } else if (revenue >= 300000) {
      return {
        sticker: 'https://res.cloudinary.com/dlstlvjaq/image/upload/v1766650430/bug-cat_n9apec.gif',
        message: '🌟 Tuyệt vời! Bạn đã đạt hơn 300k! 🌟',
        subMessage: 'Ai giỏi quá dị nè chời!',
      };
    } else if (revenue >= 200000) {
      return {
        sticker: 'https://res.cloudinary.com/dlstlvjaq/image/upload/v1766650462/capoo-cat_vqabit.gif',
        message: '🎈 Chúc mừng! Bạn đã đạt chỉ tiêu 200k! 🎈',
        subMessage: 'Cố gắng tiếp nhé bé iu của anh!',
      };
    }
    return null;
  };

  const celebrationData = getCelebrationData();

  useEffect(() => {
    // Tự động ẩn confetti sau 3 giây
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!celebrationData) {
    console.log('No celebration data for revenue:', revenue);
    return null;
  }

  console.log('Rendering CelebrationModal with:', { revenue, celebrationData });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-2 sm:p-4 overflow-hidden" style={{ WebkitOverflowScrolling: 'touch' }}>
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-[101]">
          {confettiData.map((confetti, i) => (
            <div
              key={i}
              className="absolute confetti"
              style={{
                left: confetti.left,
                animationDelay: confetti.animationDelay,
                animationDuration: confetti.animationDuration,
                backgroundColor: confetti.backgroundColor,
              }}
            />
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl p-4 sm:p-6 max-w-sm w-full relative z-[102] shadow-2xl mx-4 max-h-[90vh] overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', position: 'relative' }}>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 text-gray-500 hover:text-gray-700 min-w-[44px] min-h-[44px] flex items-center justify-center z-[103]"
          aria-label="Đóng"
        >
          <HiXMark className="w-6 h-6" />
        </button>

        <div className="text-center">
          {/* Sticker - Responsive cho iPhone 14 Pro Max */}
          <div className="mb-3 sm:mb-4 flex justify-center">
            <img
              src={celebrationData.sticker}
              alt="Celebration"
              className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 object-contain max-w-[200px] max-h-[200px]"
              onError={(e) => {
                console.error('Lỗi load sticker:', celebrationData.sticker);
                e.target.style.display = 'none';
              }}
              onLoad={() => {
                console.log('Sticker loaded successfully:', celebrationData.sticker);
              }}
              loading="eager"
              crossOrigin="anonymous"
            />
          </div>

          {/* Message - Responsive text */}
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-accent-dark mb-2 px-2">
            {celebrationData.message}
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-3 sm:mb-4 px-2">
            {celebrationData.subMessage}
          </p>

          {/* Revenue Display */}
          <div className="bg-primary rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Doanh thu hôm nay</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-accent">
              {formatCurrency(revenue)}
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-accent text-white font-semibold rounded-lg hover:bg-accent-dark transition-colors"
          >
            Tuyệt vời!
          </button>
        </div>
      </div>
    </div>
  );
};

export default CelebrationModal;

