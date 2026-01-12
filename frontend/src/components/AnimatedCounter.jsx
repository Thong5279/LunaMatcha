import { useEffect, useState, useRef } from 'react';
import { animateNumber } from '../utils/animationHelpers';
import { formatCurrency } from '../utils/formatCurrency';

const AnimatedCounter = ({ value, duration = 1000, prefix = '', suffix = '', format = 'currency' }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValueRef = useRef(0);

  useEffect(() => {
    // Chỉ animate nếu value thay đổi
    if (value !== previousValueRef.current) {
      const startValue = previousValueRef.current;
      previousValueRef.current = value;
      
      animateNumber(
        (current) => {
          setDisplayValue(Math.round(current));
        },
        startValue,
        value,
        duration
      );
    }
  }, [value, duration]);

  const formatValue = (val) => {
    if (format === 'currency') {
      return formatCurrency(val);
    } else if (format === 'number') {
      return new Intl.NumberFormat('vi-VN').format(val);
    }
    return val.toString();
  };

  return (
    <span className="animated-counter">
      {prefix}
      {formatValue(displayValue)}
      {suffix}
    </span>
  );
};

export default AnimatedCounter;

