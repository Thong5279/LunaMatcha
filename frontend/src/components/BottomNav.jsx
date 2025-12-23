import { useNavigate, useLocation } from 'react-router-dom';
import { HiHome } from 'react-icons/hi2';
import { HiClipboardDocumentList } from 'react-icons/hi2';
import { HiCurrencyDollar } from 'react-icons/hi2';
import { HiChartBar } from 'react-icons/hi2';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: HiHome, label: 'Trang chủ' },
    { path: '/orders', icon: HiClipboardDocumentList, label: 'Đơn hàng' },
    { path: '/shift', icon: HiCurrencyDollar, label: 'Ca làm việc' },
    { path: '/analytics', icon: HiChartBar, label: 'Thống kê' },
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-primary-dark z-50">
      <div className="max-w-[430px] mx-auto">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-all ${
                isActive(item.path)
                  ? 'text-accent bg-primary'
                  : 'text-gray-500 hover:text-accent'
              }`}
            >
              <item.icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;

