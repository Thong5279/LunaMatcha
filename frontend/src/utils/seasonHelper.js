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
export const getCurrentTheme = () => {
  const now = new Date();
  const utc7 = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  const month = utc7.getUTCMonth() + 1; // 1-12
  const date = utc7.getUTCDate();
  
  // Tet (Tết Nguyên Đán) - khoảng cuối tháng 1 đến đầu tháng 2
  if (month === 1 && date >= 20) return 'tet';
  if (month === 2 && date <= 10) return 'tet';
  
  // Valentine - 14/2
  if (month === 2 && date === 14) return 'valentine';
  
  // Spring - tháng 3-4
  if (month === 3 || month === 4) return 'spring';
  
  // Summer - tháng 5-8
  if (month >= 5 && month <= 8) return 'summer';
  
  // Mid-Autumn - khoảng tháng 9 (rằm tháng 8)
  if (month === 9 && date >= 10 && date <= 25) return 'midautumn';
  
  // Halloween - 31/10
  if (month === 10 && date === 31) return 'halloween';
  
  // Autumn - tháng 10-11
  if (month === 10 || month === 11) return 'autumn';
  
  // Noel - tháng 12
  if (month === 12) return 'noel';
  
  // Default: spring
  return 'spring';
};

export const getThemeIcons = (theme) => {
  return themeIcons[theme] || themeIcons.spring;
};

