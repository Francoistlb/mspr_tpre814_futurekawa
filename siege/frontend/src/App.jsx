import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Stocks from './pages/Stocks';
import LotDetail from './pages/LotDetail';
import Alertes from './pages/Alertes';

export default function App() {
  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Routes>
          <Route path="/"         element={<Dashboard />} />
          <Route path="/stocks"   element={<Stocks />} />
          <Route path="/lots/:id" element={<LotDetail />} />
          <Route path="/alertes"  element={<Alertes />} />
          <Route path="*"         element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
