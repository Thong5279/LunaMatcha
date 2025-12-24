import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import BottomNav from './components/BottomNav';
import LoadingSkeleton from './components/LoadingSkeleton';

// Lazy load các pages lớn để giảm initial bundle size
const Orders = lazy(() => import('./pages/Orders'));
const Analytics = lazy(() => import('./pages/Analytics'));
const DailyShift = lazy(() => import('./pages/DailyShift'));

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-primary-light">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route 
            path="/orders" 
            element={
              <Suspense fallback={<LoadingSkeleton type="page" />}>
                <Orders />
              </Suspense>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <Suspense fallback={<LoadingSkeleton type="page" />}>
                <Analytics />
              </Suspense>
            } 
          />
          <Route 
            path="/shift" 
            element={
              <Suspense fallback={<LoadingSkeleton type="page" />}>
                <DailyShift />
              </Suspense>
            } 
          />
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
