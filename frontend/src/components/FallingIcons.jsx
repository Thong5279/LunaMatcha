import { useEffect, useRef, useState, useCallback } from 'react';
import { getCurrentTheme, getThemeIcons } from '../utils/seasonHelper';
import './FallingIcons.css';

const MAX_ICONS = 15; // Tối đa 15 icon đồng thời
const SPAWN_INTERVAL = 2000; // 2-3 giây giữa mỗi lần spawn
const ANIMATION_DURATION = 8000; // 8 giây để icon rơi từ trên xuống

const FallingIcons = ({ enabled = true }) => {
  const [icons, setIcons] = useState([]);
  const containerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastSpawnRef = useRef(0);
  const themeRef = useRef(getCurrentTheme());
  
  // Kiểm tra tab có active không
  const [isVisible, setIsVisible] = useState(!document.hidden);
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // Cleanup icon sau khi animation kết thúc
  const removeIcon = useCallback((id) => {
    setIcons(prev => prev.filter(icon => icon.id !== id));
  }, []);
  
  // Tạo icon mới
  const spawnIcon = useCallback(() => {
    if (!enabled || !isVisible) return;
    
    const theme = getCurrentTheme();
    themeRef.current = theme;
    const iconList = getThemeIcons(theme);
    const icon = iconList[Math.floor(Math.random() * iconList.length)];
    
    const left = Math.random() * 100; // 0-100%
    const delay = Math.random() * 1000; // Random delay 0-1s
    const duration = ANIMATION_DURATION + (Math.random() * 2000 - 1000); // 7-9s
    
    const newIcon = {
      id: Date.now() + Math.random(),
      icon,
      left,
      delay,
      duration,
    };
    
    setIcons(prev => {
      const updated = [...prev, newIcon];
      // Giới hạn số lượng icon
      if (updated.length > MAX_ICONS) {
        return updated.slice(-MAX_ICONS);
      }
      return updated;
    });
    
    // Tự động remove sau khi animation kết thúc
    setTimeout(() => {
      removeIcon(newIcon.id);
    }, duration + delay + 100);
  }, [enabled, isVisible, removeIcon]);
  
  // Animation loop với requestAnimationFrame
  useEffect(() => {
    if (!enabled || !isVisible) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }
    
    const animate = (currentTime) => {
      // Spawn icon mới mỗi 2-3 giây
      if (currentTime - lastSpawnRef.current >= SPAWN_INTERVAL) {
        spawnIcon();
        lastSpawnRef.current = currentTime;
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enabled, isVisible, spawnIcon]);
  
  // Update theme mỗi phút (để chuyển theme khi đổi ngày)
  useEffect(() => {
    const interval = setInterval(() => {
      themeRef.current = getCurrentTheme();
    }, 60000); // Check mỗi phút
    
    return () => clearInterval(interval);
  }, []);
  
  if (!enabled) return null;
  
  return (
    <div ref={containerRef} className="falling-icons-container">
      {icons.map(({ id, icon, left, delay, duration }) => (
        <div
          key={id}
          className="falling-icon"
          style={{
            left: `${left}%`,
            animationDelay: `${delay}ms`,
            animationDuration: `${duration}ms`,
          }}
        >
          {icon}
        </div>
      ))}
    </div>
  );
};

export default FallingIcons;

