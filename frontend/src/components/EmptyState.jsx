import { HiCube } from 'react-icons/hi2';
import { HiBeaker } from 'react-icons/hi2';

const EmptyState = ({ icon, title, message, action, illustration }) => {
  const IconComponent = icon || HiCube;
  
  // Default illustrations cho các loại empty state
  const defaultIllustrations = {
    products: '🛍️',
    orders: '📦',
    analytics: '📊',
    default: '✨',
  };
  
  const displayIllustration = illustration || defaultIllustrations.default;
  
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 animate-fadeIn">
      {/* Illustration với animation */}
      <div className="mb-6 animate-bounce-slow">
        {illustration && (illustration.startsWith('http://') || illustration.startsWith('https://')) ? (
          <img 
            src={illustration} 
            alt="Empty state illustration" 
            className="w-32 h-32 object-contain mb-4"
            loading="lazy"
          />
        ) : typeof displayIllustration === 'string' ? (
          <div className="text-8xl mb-2" role="img" aria-label="Empty state illustration">
            {displayIllustration}
          </div>
        ) : (
          <IconComponent className="w-20 h-20 text-gray-300 mb-4" />
        )}
      </div>
      
      {/* Title */}
      <h3 className="text-xl font-bold text-gray-800 mb-3 text-center">{title}</h3>
      
      {/* Message */}
      <p className="text-sm text-gray-500 text-center mb-6 max-w-sm">{message}</p>
      
      {/* Action button với animation */}
      {action && (
        <div className="animate-slideUp">
          {typeof action === 'function' ? (
            <button
              onClick={action}
              className="px-6 py-3 bg-accent text-white font-semibold rounded-lg hover:bg-accent-dark transition-all transform hover:scale-105 shadow-md"
            >
              {title.includes('sản phẩm') ? 'Thêm sản phẩm đầu tiên' : 
               title.includes('đơn hàng') ? 'Tạo đơn hàng đầu tiên' : 
               'Bắt đầu'}
            </button>
          ) : (
            action
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;

