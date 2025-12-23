import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductList from '../components/ProductList';
import SellMode from '../components/SellMode';
import ProductForm from '../components/ProductForm';
import ToppingManager from '../components/ToppingManager';

const Home = () => {
  const [isSellMode, setIsSellMode] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showToppingManager, setShowToppingManager] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-primary-light pb-24">
      {/* Header */}
      <header className="bg-primary shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img 
              src="/img/LogoLuna.jpg" 
              alt="Luna Matcha" 
              className="w-10 h-10 rounded-full object-cover"
            />
            <h1 className="text-xl font-bold text-accent-dark">Luna Matcha</h1>
          </div>
        </div>
      </header>

      {/* Sell Mode Toggle */}
      <div className="sticky top-[57px] bg-white border-b border-primary-dark z-10 px-4 py-3">
        <div className="flex gap-3">
          <button
            onClick={() => setIsSellMode(!isSellMode)}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold text-base transition-all shadow-md ${
              isSellMode
                ? 'bg-accent text-white hover:bg-accent-dark'
                : 'bg-secondary text-white hover:bg-secondary-dark'
            }`}
          >
            {isSellMode ? 'Hoàn tất' : 'Bán'}
          </button>
          {!isSellMode && (
            <>
              <button
                onClick={() => setShowProductForm(true)}
                className="px-4 py-3 bg-primary text-accent-dark rounded-lg hover:bg-primary-dark font-semibold transition-colors border border-accent"
              >
                + Sản phẩm
              </button>
              <button
                onClick={() => setShowToppingManager(true)}
                className="px-4 py-3 bg-primary text-accent-dark rounded-lg hover:bg-primary-dark font-semibold transition-colors border border-accent"
              >
                Topping
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {isSellMode ? (
        <SellMode onComplete={() => setIsSellMode(false)} />
      ) : (
        <ProductList />
      )}

      {/* Product Form Modal */}
      {showProductForm && (
        <ProductForm onClose={() => setShowProductForm(false)} />
      )}

      {/* Topping Manager Modal */}
      {showToppingManager && (
        <ToppingManager onClose={() => setShowToppingManager(false)} />
      )}
    </div>
  );
};

export default Home;

