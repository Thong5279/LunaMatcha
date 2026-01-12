import { createContext, useContext, useState, useEffect } from 'react';
import { toppingService } from '../services/toppingService';

const ToppingContext = createContext();

export const useToppings = () => {
  const context = useContext(ToppingContext);
  if (!context) {
    throw new Error('useToppings must be used within ToppingProvider');
  }
  return context;
};

export const ToppingProvider = ({ children }) => {
  const [toppings, setToppings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchToppings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await toppingService.getAll();
      setToppings(response.data);
    } catch (err) {
      console.error('Lỗi khi tải danh sách topping:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToppings();
  }, []);

  const refreshToppings = () => {
    return fetchToppings();
  };

  return (
    <ToppingContext.Provider value={{ toppings, loading, error, refreshToppings }}>
      {children}
    </ToppingContext.Provider>
  );
};



