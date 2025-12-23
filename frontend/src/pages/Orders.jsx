import { useNavigate } from 'react-router-dom';
import { HiChevronLeft } from 'react-icons/hi2';
import OrderList from '../components/OrderList';

const Orders = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-primary-light pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600"
          >
            <HiChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold flex-1">Đơn hàng</h1>
        </div>
      </header>

      <OrderList />
    </div>
  );
};

export default Orders;

