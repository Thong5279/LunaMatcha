import { useEffect, useState } from 'react';

const ProgressBar = ({ progress = 0, onCancel, showCancel = false }) => {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    // Smooth animation khi progress thay đổi
    const timer = setTimeout(() => {
      setDisplayProgress(progress);
    }, 50);

    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          Đang tải: {Math.round(displayProgress)}%
        </span>
        {showCancel && onCancel && (
          <button
            onClick={onCancel}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Hủy
          </button>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-accent h-2.5 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${displayProgress}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;

