import { useState, useEffect, useMemo, useRef } from 'react';
import { HiXMark } from 'react-icons/hi2';
import ParticleEffect from './ParticleEffect';
import soundManager from '../utils/soundManager';
import { formatCurrencyWithUnit } from '../utils/formatCurrency';

const GachaModal = ({ isOpen, onClose, products, onAddToCart }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [resultIndex, setResultIndex] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiData] = useState(() => {
    const isMobile = window.innerWidth <= 768;
    const count = isMobile ? 80 : 150;
    return Array.from({ length: count }, () => ({
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 2}s`,
      animationDuration: `${2 + Math.random() * 2}s`,
      backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'][
        Math.floor(Math.random() * 6)
      ],
    }));
  });
  
  const intervalRef = useRef(null);
  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(null);

  // Tạo mảng tất cả combinations: products × [small, large]
  const combinations = useMemo(() => {
    if (!products || products.length === 0) return [];
    
    const combos = [];
    products.forEach((product) => {
      combos.push({ product, size: 'small', sizeLabel: 'Nhỏ', price: product.priceSmall });
      combos.push({ product, size: 'large', sizeLabel: 'Lớn', price: product.priceLarge });
    });
    return combos;
  }, [products]);

  // Reset khi mở modal
  useEffect(() => {
    if (isOpen) {
      setIsSpinning(false);
      setCurrentIndex(0);
      setResultIndex(null);
      setShowResult(false);
      setShowConfetti(false);
    }
  }, [isOpen]);

  // Easing function (ease-out)
  const easeOut = (t) => {
    return 1 - Math.pow(1 - t, 3);
  };

  // Bắt đầu gacha
  const startGacha = () => {
    if (combinations.length === 0) {
      return;
    }

    setIsSpinning(true);
    setShowResult(false);
    setShowConfetti(false);
    setResultIndex(null);
    
    // Phát âm thanh khi bắt đầu
    soundManager.play('addProduct');

    const totalDuration = 7000; // 7 giây tổng cộng (5s nhanh + 2s chậm)
    const fastPhaseDuration = 5000; // 5 giây quay nhanh
    const slowPhaseDuration = 2000; // 2 giây chậm dần
    
    startTimeRef.current = performance.now();
    let lastUpdateTime = startTimeRef.current;

    const animate = (currentTime) => {
      if (!isSpinning && !isOpen) {
        return;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / totalDuration, 1);

      if (progress < 1) {
        let interval;
        
        if (elapsed < fastPhaseDuration) {
          // Phase 1: Quay nhanh (50-100ms interval)
          interval = 50 + Math.random() * 50;
        } else {
          // Phase 2: Chậm dần với ease-out
          const slowProgress = (elapsed - fastPhaseDuration) / slowPhaseDuration;
          const eased = easeOut(slowProgress);
          // Interval tăng dần từ 100ms đến 500ms
          interval = 100 + (eased * 400);
        }

        // Chỉ update nếu đã qua đủ thời gian interval
        if (currentTime - lastUpdateTime >= interval) {
          setCurrentIndex((prev) => (prev + 1) % combinations.length);
          lastUpdateTime = currentTime;
        }

        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Kết thúc - chọn kết quả ngẫu nhiên
        const finalIndex = Math.floor(Math.random() * combinations.length);
        setCurrentIndex(finalIndex);
        setResultIndex(finalIndex);
        setIsSpinning(false);
        setShowResult(true);
        setShowConfetti(true);
        
        // Phát âm thanh khi dừng
        soundManager.play('milestone');
        
        // Tự động ẩn confetti sau 3 giây
        setTimeout(() => {
          setShowConfetti(false);
        }, 3000);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // Cleanup khi unmount hoặc đóng
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Tự động bắt đầu gacha khi mở modal
  useEffect(() => {
    if (isOpen && combinations.length > 0 && !isSpinning && !showResult) {
      // Delay nhỏ để modal render xong
      const timer = setTimeout(() => {
        startGacha();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, combinations.length]);

  const handleAddToCart = () => {
    if (resultIndex !== null && combinations[resultIndex]) {
      const combo = combinations[resultIndex];
      onAddToCart(combo.product, combo.size, 1, 'common', [], '');
      onClose();
    }
  };

  const handleGachaAgain = () => {
    startGacha();
  };

  if (!isOpen) return null;

  const currentCombo = combinations[currentIndex] || combinations[0];
  const resultCombo = resultIndex !== null ? combinations[resultIndex] : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[9999] flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      {/* Particle Effect - chỉ hiển thị khi có kết quả */}
      {showResult && <ParticleEffect duration={3000} particleCount={50} />}
      
      {/* Confetti Effect - chỉ hiển thị khi có kết quả */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-[10000]">
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

      <div className="bg-white rounded-2xl p-4 sm:p-6 max-w-sm w-full relative z-[10001] shadow-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 text-gray-500 hover:text-gray-700 min-w-[44px] min-h-[44px] flex items-center justify-center z-[10002]"
          aria-label="Đóng"
        >
          <HiXMark className="w-6 h-6" />
        </button>

        <div className="text-center">
          {/* Title */}
          <h2 className="text-2xl sm:text-3xl font-bold text-accent-dark mb-4">
            {showResult ? '🎉 KẾT QUẢ 🎉' : '🎰 GACHA MÓN NƯỚC 🎰'}
          </h2>

          {/* Product Display */}
          <div className="mb-4">
            <div className="relative aspect-square w-full max-w-[200px] mx-auto bg-primary rounded-xl overflow-hidden shadow-lg">
              <img
                src={currentCombo?.product?.image || ''}
                alt={currentCombo?.product?.name || 'Đang quay...'}
                className={`w-full h-full object-cover transition-all duration-200 ${
                  isSpinning ? 'scale-95' : 'scale-100'
                }`}
                style={{
                  filter: isSpinning ? 'brightness(0.8)' : 'brightness(1)',
                }}
              />
              {/* Overlay khi đang quay */}
              {isSpinning && (
                <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                  <div className="text-white text-xl font-bold animate-pulse">🎰</div>
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="mb-4">
            <h3 className="text-xl sm:text-2xl font-bold text-accent-dark mb-2">
              {currentCombo?.product?.name || 'Đang quay...'}
            </h3>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-lg font-semibold text-gray-700">
                Size: <span className="text-accent">{currentCombo?.sizeLabel || ''}</span>
              </span>
            </div>
            {showResult && resultCombo && (
              <p className="text-xl font-bold text-green-600">
                {formatCurrencyWithUnit(resultCombo.price)}
              </p>
            )}
          </div>

          {/* Action Buttons - chỉ hiển thị khi có kết quả */}
          {showResult && resultCombo && (
            <div className="space-y-3 mt-6">
              <button
                onClick={handleAddToCart}
                className="w-full py-3 bg-accent text-white font-semibold rounded-lg hover:bg-accent-dark transition-colors shadow-md"
              >
                Thêm vào giỏ hàng
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleGachaAgain}
                  className="flex-1 py-3 bg-secondary text-white font-semibold rounded-lg hover:bg-secondary-dark transition-colors"
                >
                  Gacha lại
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}

          {/* Loading indicator khi đang quay */}
          {isSpinning && (
            <div className="mt-4">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <p className="text-sm text-gray-500 mt-2">Đang quay...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GachaModal;
