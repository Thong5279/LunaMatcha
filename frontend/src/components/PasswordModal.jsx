import { useState, useEffect } from 'react';
import { HiLockClosed } from 'react-icons/hi2';

const PasswordModal = ({ isOpen, onSuccess, title = "Nhập mật khẩu", message = "Vui lòng nhập mật khẩu để truy cập" }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const PASSWORD = "031222";
  
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError('');
    }
  }, [isOpen]);
  
  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        const input = document.getElementById('password-input');
        if (input) input.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
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
        setLoading(false);
        setPassword('');
        onSuccess();
      } else {
        setLoading(false);
        setError('Mật khẩu không đúng');
        setPassword('');
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
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md mx-4 animate-fadeIn">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-accent/10 rounded-full p-3">
            <HiLockClosed className="w-8 h-8 text-accent" />
          </div>
        </div>
        
        <h2 className="text-xl font-bold text-gray-800 text-center mb-2">
          {title}
        </h2>
        
        <p className="text-sm text-gray-600 text-center mb-6">
          {message}
        </p>
        
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
      </div>
    </div>
  );
};

export default PasswordModal;

