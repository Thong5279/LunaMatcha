// Helper functions cho animations

/**
 * Animate number from one value to another
 * @param {Function} callback - Callback function that receives the current value
 * @param {number} from - Starting value
 * @param {number} to - Ending value
 * @param {number} duration - Animation duration in ms
 * @param {Function} easing - Easing function (default: easeOutCubic)
 */
export const animateNumber = (callback, from, to, duration = 1000, easing = easeOutCubic) => {
  const startTime = performance.now();
  const difference = to - from;
  
  const animate = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easing(progress);
    const current = from + (difference * eased);
    
    callback(current);
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      callback(to); // Ensure final value
    }
  };
  
  requestAnimationFrame(animate);
};

/**
 * Easing functions
 */
export const easeOutCubic = (t) => {
  return 1 - Math.pow(1 - t, 3);
};

export const easeInOutQuad = (t) => {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
};

/**
 * Create ripple effect on button click
 * @param {Event} event - Click event
 * @param {HTMLElement} element - Element to add ripple to
 */
export const createRipple = (event, element) => {
  const ripple = document.createElement('span');
  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;
  
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  ripple.classList.add('ripple');
  
  element.appendChild(ripple);
  
  // Remove ripple after animation
  setTimeout(() => {
    ripple.remove();
  }, 600);
};

