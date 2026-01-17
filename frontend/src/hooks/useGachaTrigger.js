import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook để detect long press (3 giây) và shake để trigger gacha
 * @param {Function} onTrigger - Callback khi trigger gacha
 * @param {boolean} enabled - Bật/tắt detection
 */
export const useGachaTrigger = (onTrigger, enabled = true) => {
  const longPressTimerRef = useRef(null);
  const lastShakeTimeRef = useRef(0);
  const shakeThreshold = 15; // Ngưỡng để detect shake
  const debounceTime = 2000; // 2 giây debounce cho shake

  // Long press detection
  const handleTouchStart = useCallback((e) => {
    if (!enabled) return;
    
    // Chỉ trigger trên logo element
    const target = e.target.closest('[data-gacha-trigger]');
    if (!target) return;

    longPressTimerRef.current = setTimeout(() => {
      // Trigger gacha sau 3 giây
      onTrigger();
      // Haptic feedback nếu có
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
    }, 3000);
  }, [enabled, onTrigger]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleTouchCancel = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // Shake detection
  const handleDeviceMotion = useCallback((e) => {
    if (!enabled) return;

    const acceleration = e.accelerationIncludingGravity;
    if (!acceleration) return;

    const { x, y, z } = acceleration;
    const accelerationMagnitude = Math.sqrt(x * x + y * y + z * z);

    // Kiểm tra nếu vượt ngưỡng
    if (accelerationMagnitude > shakeThreshold) {
      const now = Date.now();
      
      // Debounce: chỉ trigger nếu đã qua 2 giây từ lần shake trước
      if (now - lastShakeTimeRef.current > debounceTime) {
        lastShakeTimeRef.current = now;
        onTrigger();
        
        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
      }
    }
  }, [enabled, onTrigger, shakeThreshold]);

  useEffect(() => {
    if (!enabled) return;

    // Long press listeners
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    // Shake detection - cần permission trên một số browser
    let motionPermissionGranted = false;
    
    const requestMotionPermission = async () => {
      if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        try {
          const permission = await DeviceMotionEvent.requestPermission();
          motionPermissionGranted = permission === 'granted';
        } catch (error) {
          console.warn('DeviceMotionEvent permission error:', error);
        }
      } else {
        // Không cần permission (desktop hoặc browser cũ)
        motionPermissionGranted = true;
      }
    };

    requestMotionPermission().then(() => {
      if (motionPermissionGranted) {
        window.addEventListener('devicemotion', handleDeviceMotion, { passive: true });
      }
    });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchCancel);
      window.removeEventListener('devicemotion', handleDeviceMotion);
      
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [enabled, handleTouchStart, handleTouchEnd, handleTouchCancel, handleDeviceMotion]);

  return {
    // Có thể return thêm state nếu cần
  };
};
