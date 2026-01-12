const themeIcons = {
  tet: ['🧨', '🧧', '🌸','🏵️'],
  valentine: ['💖', '🌹','💖', '🌹'],
  spring: ['🌸', '🦋','🌸','🦋'],
  summer: ['☀️','🍨','🍉','🍓','🍇','🍎'],
  midautumn: ['🏮', '🌙','🌙','🏮'],
  halloween: ['🎃', '🦇','🍬','👻','🧛‍♂️'],
  autumn: ['🍂', '🍎','🍁','🍂','🍎','🍁'],
  noel: ['❄️', '⛄', '🎁','🎄','🎅','🤶']
};

// Xác định theme dựa trên ngày tháng (UTC+7)
// Logic: Lễ > Mùa > Default
export const getCurrentTheme = () => {
  const now = new Date();
  const utc7 = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  const month = utc7.getUTCMonth() + 1; // 1-12
  const date = utc7.getUTCDate();
  
  // Tet - 2 tuần trước và sau Tết (khoảng 20/1 - 25/2)
  if (month === 1 && date >= 20) return 'tet';
  if (month === 2 && date <= 25) return 'tet';
  
  // Valentine - 2 tuần trước/sau 14/2 (31/1 - 28/2)
  // Chỉ hiển thị nếu không trong khoảng Tết
  if (month === 2 && date > 25 && date <= 28) return 'valentine';
  if (month === 1 && date >= 31) return 'valentine';
  if (month === 2 && date >= 1 && date < 20) return 'valentine';
  
  // Noel - 2 tuần trước/sau 25/12 (11/12 - 8/1)
  if (month === 12 && date >= 11) return 'noel';
  if (month === 1 && date <= 8) return 'noel';
  
  // Spring - tháng 3-4 (nếu không có lễ)
  if (month === 3 || month === 4) return 'spring';
  
  // Summer - tháng 5-8 (nếu không có lễ)
  if (month >= 5 && month <= 8) return 'summer';
  
  // Mid-Autumn - 2 tuần trước/sau rằm tháng 8 (10/9 - 25/9)
  if (month === 9) {
    if (date >= 10 && date <= 25) return 'midautumn';
    // Nếu không trong khoảng Mid-Autumn, dùng Autumn
    return 'autumn';
  }
  
  // Halloween - 2 tuần trước/sau 31/10 (17/10 - 14/11)
  if (month === 10 && date >= 17) return 'halloween';
  if (month === 11 && date <= 14) return 'halloween';
  
  // Autumn - tháng 10-11 (nếu không có lễ, trừ Halloween)
  if (month === 10 && date < 17) return 'autumn';
  if (month === 11 && date > 14) return 'autumn';
  
  // Default: spring
  return 'spring';
};

export const getThemeIcons = (theme) => {
  return themeIcons[theme] || themeIcons.spring;
};

