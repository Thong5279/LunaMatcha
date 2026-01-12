import { useState, useEffect } from 'react';
import { HiXMark } from 'react-icons/hi2';
import soundManager from '../utils/soundManager';

const SettingsModal = ({ isOpen, onClose }) => {
  const [soundEnabled, setSoundEnabled] = useState(soundManager.isEnabled());

  useEffect(() => {
    if (isOpen) {
      setSoundEnabled(soundManager.isEnabled());
    }
  }, [isOpen]);

  const handleSoundToggle = (enabled) => {
    setSoundEnabled(enabled);
    soundManager.setEnabled(enabled);
    // Test sound nếu bật
    if (enabled) {
      soundManager.play('addProduct');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Đóng"
        >
          <HiXMark className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-accent-dark mb-6">Cài đặt</h2>

        <div className="space-y-4">
          {/* Sound Effects Toggle */}
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <h3 className="font-semibold text-gray-800">Âm thanh</h3>
              <p className="text-sm text-gray-500">Bật/tắt âm thanh khi thao tác</p>
            </div>
            <button
              onClick={() => handleSoundToggle(!soundEnabled)}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                soundEnabled ? 'bg-accent' : 'bg-gray-300'
              }`}
              aria-label={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            >
              <span
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  soundEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 bg-accent text-white font-semibold rounded-lg hover:bg-accent-dark transition-colors"
        >
          Đóng
        </button>
      </div>
    </div>
  );
};

export default SettingsModal;

