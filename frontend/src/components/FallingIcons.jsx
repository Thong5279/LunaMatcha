import { useEffect, useRef, useState, useCallback } from 'react';
import { getCurrentTheme, getThemeIcons } from '../utils/seasonHelper';
import './FallingIcons.css';

const MAX_ICONS = 22; // Tối đa 22 icon đồng thời (tăng từ 15)
const MIN_SPAWN_INTERVAL = 800; // Tối thiểu 800ms
const MAX_SPAWN_INTERVAL = 1200; // Tối đa 1200ms (random 800-1200ms)
const MIN_DURATION = 6000; // Tối thiểu 6 giây
const MAX_DURATION = 10000; // Tối đa 10 giây

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
  
  // Tạo icon mới với nhiều hiệu ứng ngẫu nhiên
  const spawnIcon = useCallback(() => {
    if (!enabled || !isVisible) return;
    
    const theme = getCurrentTheme();
    themeRef.current = theme;
    const iconList = getThemeIcons(theme);
    const icon = iconList[Math.floor(Math.random() * iconList.length)];
    
    const left = Math.random() * 100; // 0-100%
    const delay = Math.random() * 1000; // Random delay 0-1s
    const duration = MIN_DURATION + Math.random() * (MAX_DURATION - MIN_DURATION); // 6-10s
    
    // Random rotation: 0-720 độ
    const rotation = Math.random() * 720;
    
    // Random size: 18-32px (desktop), 16-28px (mobile)
    const isMobile = window.innerWidth <= 768;
    const minSize = isMobile ? 16 : 18;
    const maxSize = isMobile ? 28 : 32;
    const size = minSize + Math.random() * (maxSize - minSize);
    
    // Random horizontal drift: -20px đến +20px
    const drift = (Math.random() - 0.5) * 40; // -20px to +20px
    
    // Sparkle effect: 30% icon có sparkle
    const hasSparkle = Math.random() < 0.3;
    
    // Opacity: 0.6-0.7 ban đầu
    const startOpacity = 0.6 + Math.random() * 0.1; // 0.6-0.7
    const midOpacity = 0.7 + Math.random() * 0.1; // 0.7-0.8
    
    const newIcon = {
      id: Date.now() + Math.random(),
      icon,
      left,
      delay,
      duration,
      rotation,
      size,
      drift,
      hasSparkle,
      startOpacity,
      midOpacity,
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
      // Spawn icon mới với interval ngẫu nhiên 800-1200ms
      const spawnInterval = MIN_SPAWN_INTERVAL + Math.random() * (MAX_SPAWN_INTERVAL - MIN_SPAWN_INTERVAL);
      if (currentTime - lastSpawnRef.current >= spawnInterval) {
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
      {icons.map(({ id, icon, left, delay, duration, rotation, size, drift, hasSparkle, startOpacity, midOpacity }) => (
        <div
          key={id}
          className={`falling-icon ${hasSparkle ? 'sparkle' : ''}`}
          style={{
            left: `${left}%`,
            animationDelay: `${delay}ms`,
            animationDuration: `${duration}ms`,
            fontSize: `${size}px`,
            '--rotation': `${rotation}deg`,
            '--drift': `${drift}px`,
            '--start-opacity': startOpacity,
            '--mid-opacity': midOpacity,
          }}
        >
          {icon}
        </div>
      ))}
    </div>
  );
};

export default FallingIcons;

