import { useEffect, useState } from 'react';

// Các mốc doanh thu
const MILESTONES = [200000, 300000, 400000, 500000, 600000, 700000, 800000, 900000, 1000000];

const ProgressRing = ({ revenue = 0, size = 56, strokeWidth = 4, children }) => {
  const [progress, setProgress] = useState(0);
  const [currentMilestone, setCurrentMilestone] = useState(0);
  const [nextMilestone, setNextMilestone] = useState(200000);

  useEffect(() => {
    // Tìm mốc hiện tại và mốc tiếp theo
    let current = 0;
    let next = MILESTONES[0];
    
    for (let i = 0; i < MILESTONES.length; i++) {
      if (revenue >= MILESTONES[i]) {
        current = MILESTONES[i];
        next = MILESTONES[i + 1] || MILESTONES[MILESTONES.length - 1];
      } else {
        next = MILESTONES[i];
        break;
      }
    }
    
    setCurrentMilestone(current);
    setNextMilestone(next);
    
    // Tính % progress đến mốc tiếp theo
    if (current === next) {
      // Đã đạt mốc cuối cùng
      setProgress(100);
    } else {
      const range = next - current;
      const progressValue = ((revenue - current) / range) * 100;
      setProgress(Math.min(Math.max(progressValue, 0), 100));
    }
  }, [revenue]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  // Màu sắc thay đổi theo progress
  const getColor = () => {
    if (progress < 33) return '#7A9A6E'; // Xanh lá
    if (progress < 66) return '#FFA500'; // Cam
    return '#FF6B6B'; // Đỏ
  };

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.5s ease-out, stroke 0.5s ease-out',
          }}
        />
      </svg>
      {/* Children (mascot) sẽ được render bên trong */}
      <div className="relative z-10 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

export default ProgressRing;

