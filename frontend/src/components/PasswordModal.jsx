import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiXMark } from 'react-icons/hi2';
import ParticleEffect from './ParticleEffect';
import soundManager from '../utils/soundManager';

const PasswordModal = ({ isOpen, onSuccess, onCancel, title = "Nhập mật khẩu", message = "Vui lòng nhập mật khẩu để truy cập" }) => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [stickerUrl, setStickerUrl] = useState('https://res.cloudinary.com/dlstlvjaq/image/upload/v1768400992/giphy_twqudm.gif');
  const [showParticles, setShowParticles] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
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
  
  const PASSWORD = "031222";
  
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError('');
      setStickerUrl('https://res.cloudinary.com/dlstlvjaq/image/upload/v1768400992/giphy_twqudm.gif');
      setShowParticles(false);
      setShowConfetti(false);
      setIsSuccess(false);
    }
  }, [isOpen]);
  
  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && !isSuccess) {
      const timer = setTimeout(() => {
        const input = document.getElementById('password-input');
        if (input) input.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isSuccess]);

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/');
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (!password.trim()) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }
    
    setLoading(true);
    
    // Simulate validation delay for better UX
    setTimeout(() => {
      if (password.trim() === PASSWORD) {
        // Nhập đúng
        setLoading(false);
        setIsSuccess(true);
        setStickerUrl('https://res.cloudinary.com/dlstlvjaq/image/upload/v1768400803/giphy_dg0qvs.gif');
        setShowParticles(true);
        setShowConfetti(true);
        soundManager.play('milestone');
        
        // Tự động ẩn confetti sau 3 giây
        setTimeout(() => {
          setShowConfetti(false);
        }, 3000);
        
        // Tự động gọi onSuccess sau 2-3 giây
        setTimeout(() => {
          setPassword('');
          onSuccess();
        }, 2500);
      } else {
        // Nhập sai
        setLoading(false);
        setError('Mật khẩu không đúng');
        setStickerUrl('https://res.cloudinary.com/dlstlvjaq/image/upload/v1768400596/giphy_gmoeb3.gif');
        setPassword('');
        
        // Reset về sticker bình thường sau 2 giây
        setTimeout(() => {
          setStickerUrl('https://res.cloudinary.com/dlstlvjaq/image/upload/v1768400992/giphy_twqudm.gif');
        }, 2000);
        
        // Focus input again after error
        setTimeout(() => {
          const input = document.getElementById('password-input');
          if (input) input.focus();
        }, 100);
      }
    }, 300);
  };
  
  const handleChange = (e) => {
    setPassword(e.target.value);
    // Clear error when user starts typing
    if (error) {
      setError('');
      // Reset về sticker bình thường khi bắt đầu nhập lại
      if (stickerUrl !== 'https://res.cloudinary.com/dlstlvjaq/image/upload/v1768400992/giphy_twqudm.gif') {
        setStickerUrl('https://res.cloudinary.com/dlstlvjaq/image/upload/v1768400992/giphy_twqudm.gif');
      }
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isSuccess) {
      handleSubmit(e);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm overflow-hidden">
      {/* Particle Effect - chỉ hiển thị khi nhập đúng */}
      {showParticles && <ParticleEffect duration={3000} particleCount={50} />}
      
      {/* Confetti Effect - chỉ hiển thị khi nhập đúng */}
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

      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 relative z-[10001] max-h-[90vh] overflow-y-auto">
        {/* Nút X để đóng */}
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 min-w-[44px] min-h-[44px] flex items-center justify-center z-[10002]"
          aria-label="Đóng"
        >
          <HiXMark className="w-6 h-6" />
        </button>

        <div className="text-center">
          {/* Sticker */}
          <div className="mb-4 flex justify-center">
            <img
              src={stickerUrl}
              alt="Sticker"
              className="w-32 h-32 sm:w-40 sm:h-40 object-contain"
              onError={(e) => {
                console.error('Lỗi load sticker:', stickerUrl);
                e.target.style.display = 'none';
              }}
            />
          </div>
          
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {title}
          </h2>
          
          <p className="text-sm text-gray-600 mb-6">
            {message}
          </p>

          {/* Thông báo thành công */}
          {isSuccess && (
            <div className="mb-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
              <p className="text-lg font-bold text-green-600">
                🎉 Mật khẩu đúng! 🎉
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Đang chuyển đến trang chi phí...
              </p>
            </div>
          )}

          {/* Form nhập mật khẩu - chỉ hiển thị khi chưa thành công */}
          {!isSuccess && (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="password-input" className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu
                </label>
                <input
                  id="password-input"
                  type="password"
                  value={password}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Nhập mật khẩu"
                  autoComplete="off"
                />
                {error && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <span>⚠️</span>
                    <span>{error}</span>
                  </p>
                )}
              </div>
              
              <button
                type="submit"
                disabled={loading || !password.trim()}
                className="w-full bg-accent text-white font-semibold py-3 rounded-lg hover:bg-accent-dark transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-300 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Đang xác thực...</span>
                  </>
                ) : (
                  'Xác nhận'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PasswordModal;
