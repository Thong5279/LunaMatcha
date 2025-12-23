import { useEffect, useState } from 'react';
import { HiXMark } from 'react-icons/hi2';

const CelebrationModal = ({ revenue, onClose }) => {
  const [showConfetti, setShowConfetti] = useState(true);

  // Tạo dữ liệu confetti một lần khi component mount
  const [confettiData] = useState(() => {
    return Array.from({ length: 150 }, () => ({
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
    if (revenue >= 500000) {
      return {
        sticker: 'https://media.tenor.com/nmKjcoq2HZIAAAAi/bug-cat-capoo.gif',
        message: '🎉 Xuất sắc! Bạn đã đạt hơn 500k! 🎉',
        subMessage: 'Thôi đi về nghỉ ngơi thôi bé iu hẹ hẹ!',
      };
    } else if (revenue >= 400000) {
      return {
        sticker: 'https://media.tenor.com/bz2SRHsDJgEAAAAi/bugcat-capoo.gif',
        message: '🎊 Tuyệt vời! Bạn đã đạt hơn 400k! 🎊',
        subMessage: 'bé iu của anh giỏi quá dị nè!',
      };
    } else if (revenue >= 300000) {
      return {
        sticker: 'https://media.tenor.com/2xcaj7Iu1g0AAAAi/bug-cat.gif',
        message: '🌟 Tuyệt vời! Bạn đã đạt hơn 300k! 🌟',
        subMessage: 'Ai giỏi quá dị nè chời!',
      };
    } else if (revenue >= 200000) {
      return {
        sticker: 'https://media.tenor.com/Gp2PDF56kYcAAAAi/capoo-cat.gif',
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
    return null;
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
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

      <div className="bg-white rounded-2xl p-6 max-w-sm w-full relative z-10 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Đóng"
        >
          <HiXMark className="w-6 h-6" />
        </button>

        <div className="text-center">
          {/* Sticker */}
          <div className="mb-4 flex justify-center">
            <img
              src={celebrationData.sticker}
              alt="Celebration"
              className="w-48 h-48 object-contain"
            />
          </div>

          {/* Message */}
          <h2 className="text-2xl font-bold text-accent-dark mb-2">
            {celebrationData.message}
          </h2>
          <p className="text-lg text-gray-600 mb-4">
            {celebrationData.subMessage}
          </p>

          {/* Revenue Display */}
          <div className="bg-primary rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-1">Doanh thu hôm nay</p>
            <p className="text-3xl font-bold text-accent">
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

