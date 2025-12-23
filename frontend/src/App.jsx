import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import Orders from './pages/Orders';
import Analytics from './pages/Analytics';
import DailyShift from './pages/DailyShift';
import BottomNav from './components/BottomNav';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-primary-light">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/shift" element={<DailyShift />} />
        </Routes>
        <BottomNav />
        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              background: '#DEE9CB',
              color: '#1a1a1a',
              border: '1px solid #A8C090',
            },
            success: {
              iconTheme: {
                primary: '#7A9A6E',
                secondary: '#DEE9CB',
              },
            },
            error: {
              iconTheme: {
                primary: '#dc2626',
                secondary: '#fee2e2',
              },
              style: {
                background: '#fee2e2',
                color: '#991b1b',
                border: '1px solid #fca5a5',
              },
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;
