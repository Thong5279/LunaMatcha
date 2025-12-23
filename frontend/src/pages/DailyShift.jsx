import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiChevronLeft } from 'react-icons/hi2';
import { dailyShiftService } from '../services/dailyShiftService';
import showToast from '../utils/toast';

const DailyShift = () => {
  const navigate = useNavigate();
  const [shift, setShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingStartAmount, setEditingStartAmount] = useState(false);
  const [startAmount, setStartAmount] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchShift();
  }, [selectedDate]);

  const fetchShift = async () => {
    try {
      setLoading(true);
      const response = await dailyShiftService.getOrCreate(selectedDate);
      setShift(response.data);
      setStartAmount(response.data.startAmount.toString());
    } catch (error) {
      showToast.error('Lỗi khi tải dữ liệu ca làm việc');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStartAmount = async () => {
    try {
      const response = await dailyShiftService.updateStartAmount(shift._id, parseFloat(startAmount));
      setShift(response.data);
      setEditingStartAmount(false);
      showToast.success('Đã cập nhật tiền đầu ca');
    } catch (error) {
      showToast.error('Lỗi khi cập nhật tiền đầu ca');
      console.error(error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-light flex items-center justify-center">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-light pb-24">
      {/* Header */}
      <header className="bg-primary shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-gray-600">
            <HiChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold flex-1 text-accent-dark">Ca làm việc</h1>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Date Selector */}
        <div className="bg-white rounded-lg p-4 shadow">
          <label className="block text-sm font-medium mb-2">Chọn ngày</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border-2 border-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {shift && (
          <>
            {/* Start Amount */}
            <div className="bg-white rounded-lg p-4 shadow">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-600">Tiền đầu ca</label>
                {!editingStartAmount && (
                  <button
                    onClick={() => setEditingStartAmount(true)}
                    className="text-sm text-accent hover:text-accent-dark"
                  >
                    Sửa
                  </button>
                )}
              </div>
              {editingStartAmount ? (
                <div className="space-y-2">
                  <input
                    type="number"
                    value={startAmount}
                    onChange={(e) => setStartAmount(e.target.value)}
                    placeholder="Nhập tiền đầu ca..."
                    min="0"
                    step="1000"
                    className="w-full px-3 py-2 border-2 border-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingStartAmount(false);
                        setStartAmount(shift.startAmount.toString());
                      }}
                      className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleUpdateStartAmount}
                      className="flex-1 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark"
                    >
                      Lưu
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-2xl font-bold text-accent">{formatCurrency(shift.startAmount)}</p>
              )}
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-br from-primary to-primary-dark rounded-lg p-6 shadow-lg">
              <h2 className="text-lg font-bold mb-4 text-accent-dark">Tổng kết ca làm việc</h2>
              
              <div className="space-y-4">
                {/* Tiền đầu ca */}
                <div className="bg-white bg-opacity-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Tiền đầu ca</p>
                      <p className="text-xs text-gray-500">(Tiền mang theo để thối cho khách)</p>
                    </div>
                    <span className="text-2xl font-bold text-accent-dark">{formatCurrency(shift.startAmount)}</span>
                  </div>
                </div>

                {/* Doanh thu hôm nay */}
                <div className="bg-white bg-opacity-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Doanh thu hôm nay</p>
                      <p className="text-xs text-gray-500">(Tổng tiền bán được)</p>
                    </div>
                    <span className="text-2xl font-bold text-green-600">{formatCurrency(shift.endAmount)}</span>
                  </div>
                </div>

                {/* Tổng tiền có */}
                <div className="bg-accent bg-opacity-20 rounded-lg p-4 border-2 border-accent">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-semibold text-accent-dark mb-1">Tổng tiền có</p>
                      <p className="text-xs text-gray-600">(Tiền đầu ca + Doanh thu)</p>
                    </div>
                    <span className="text-3xl font-bold text-accent">{formatCurrency(shift.startAmount + shift.endAmount)}</span>
                  </div>
                </div>
                
                {/* Tiền thực tế thu được */}
                <div className="border-t-2 border-accent-dark pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-semibold text-accent-dark mb-1">Tiền thực tế thu được</p>
                      <p className="text-xs text-gray-600">(Doanh thu - Tiền đầu ca)</p>
                    </div>
                    <span className="text-2xl font-bold text-accent-dark">{formatCurrency(shift.netAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-4 shadow text-center">
                <p className="text-sm text-gray-600 mb-1">Số đơn hàng</p>
                <p className="text-2xl font-bold text-accent">{shift.orders.length}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow text-center">
                <p className="text-sm text-gray-600 mb-1">Đơn hàng trung bình</p>
                <p className="text-2xl font-bold text-accent">
                  {shift.orders.length > 0 
                    ? formatCurrency(Math.round(shift.endAmount / shift.orders.length))
                    : formatCurrency(0)
                  }
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DailyShift;

