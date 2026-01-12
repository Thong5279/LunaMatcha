import { useEffect, useRef } from 'react';
import './ParticleEffect.css';

const ParticleEffect = ({ duration = 3000, particleCount = 50 }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const particles = [];
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#FFE66D'];

    // Tạo particles
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      
      const size = Math.random() * 8 + 4; // 4-12px
      const startX = Math.random() * 100; // 0-100%
      const startY = Math.random() * 100; // 0-100%
      const duration = Math.random() * 2000 + 2000; // 2-4s
      const delay = Math.random() * 500; // 0-0.5s
      const color = colors[Math.floor(Math.random() * colors.length)];
      const angle = Math.random() * 360; // 0-360 degrees
      const distance = Math.random() * 200 + 100; // 100-300px
      
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${startX}%`;
      particle.style.top = `${startY}%`;
      particle.style.backgroundColor = color;
      particle.style.animationDuration = `${duration}ms`;
      particle.style.animationDelay = `${delay}ms`;
      particle.style.setProperty('--angle', `${angle}deg`);
      particle.style.setProperty('--distance', `${distance}px`);
      
      container.appendChild(particle);
      particles.push(particle);
    }

    // Cleanup sau khi animation kết thúc
    const cleanup = setTimeout(() => {
      particles.forEach(particle => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      });
    }, duration + 2000);

    return () => {
      clearTimeout(cleanup);
      particles.forEach(particle => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      });
    };
  }, [duration, particleCount]);

  return (
    <div
      ref={containerRef}
      className="particle-container"
      style={{ animationDuration: `${duration}ms` }}
    />
  );
};

export default ParticleEffect;

