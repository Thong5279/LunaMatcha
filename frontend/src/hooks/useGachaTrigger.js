import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook để detect long press (3 giây) và shake để trigger gacha
 * @param {Function} onTrigger - Callback khi trigger gacha
 * @param {boolean} enabled - Bật/tắt detection
 */
export const useGachaTrigger = (onTrigger, enabled = true) => {
  const longPressTimerRef = useRef(null);
  const lastShakeTimeRef = useRef(0);
  const shakeCountRef = useRef(0);
  const shakeResetTimerRef = useRef(null);
  const shakeThreshold = 15; // Ngưỡng để detect shake
  const debounceTime = 500; // 500ms debounce giữa các lần shake
  const shakeResetTime = 3000; // 3 giây không shake thì reset counter
  const requiredShakes = 5; // Số lần shake cần thiết để trigger

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
      
      // Debounce: chỉ đếm nếu đã qua 500ms từ lần shake trước
      if (now - lastShakeTimeRef.current > debounceTime) {
        lastShakeTimeRef.current = now;
        shakeCountRef.current += 1;
        
        // Haptic feedback cho mỗi lần shake
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
        
        // Reset timer nếu đang có
        if (shakeResetTimerRef.current) {
          clearTimeout(shakeResetTimerRef.current);
        }
        
        // Kiểm tra nếu đã đủ số lần shake
        if (shakeCountRef.current >= requiredShakes) {
          // Trigger gacha
          onTrigger();
          
          // Reset counter
          shakeCountRef.current = 0;
          
          // Haptic feedback mạnh hơn khi trigger
          if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
          }
        } else {
          // Set timer để reset counter nếu không shake tiếp trong 3 giây
          shakeResetTimerRef.current = setTimeout(() => {
            shakeCountRef.current = 0;
          }, shakeResetTime);
        }
      }
    }
  }, [enabled, onTrigger, shakeThreshold, debounceTime, shakeResetTime, requiredShakes]);

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
      if (shakeResetTimerRef.current) {
        clearTimeout(shakeResetTimerRef.current);
      }
    };
  }, [enabled, handleTouchStart, handleTouchEnd, handleTouchCancel, handleDeviceMotion]);

  return {
    // Có thể return thêm state nếu cần
  };
};
