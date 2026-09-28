/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import AlertModal from './components/AlertModal';

// Pages
import Dashboard from './pages/Dashboard';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Office from './pages/Office';
import Profile from './pages/Profile';
import WorkOrder from './pages/WorkOrder';
import ReviewWO from './pages/ReviewWO';
import WorkPlan from './pages/WorkPlan';
import RealisasiKerja from './pages/RealisasiKerja';
import Laporan from './pages/Laporan';
import Personil from './pages/Personil';
import Warehouse from './pages/Warehouse';
import { WelcomeGuild } from './pages/WelcomeGuild';
import { Guild } from './pages/Guild';

export default function App() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <Router>
      <AlertModal />
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to={user?.bidang?.toUpperCase() === 'BAKTI' ? '/welcome-guild' : '/office'} />} />
        <Route path="/office" element={isAuthenticated ? <Office /> : <Navigate to="/login" />} />
        <Route path="/profil" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/work-order" element={isAuthenticated ? <WorkOrder /> : <Navigate to="/login" />} />
        <Route path="/review-wo" element={isAuthenticated ? <ReviewWO /> : <Navigate to="/login" />} />
        <Route path="/work-plan" element={isAuthenticated ? <WorkPlan /> : <Navigate to="/login" />} />
        <Route path="/realisasi" element={isAuthenticated ? <RealisasiKerja /> : <Navigate to="/login" />} />
        <Route path="/laporan" element={isAuthenticated ? <Laporan /> : <Navigate to="/login" />} />
        <Route path="/personil" element={isAuthenticated ? <Personil /> : <Navigate to="/login" />} />
        <Route path="/warehouse" element={isAuthenticated ? <Warehouse /> : <Navigate to="/login" />} />
        <Route path="/welcome-guild" element={isAuthenticated ? <WelcomeGuild /> : <Navigate to="/login" />} />
        <Route path="/guild" element={isAuthenticated ? <Guild /> : <Navigate to="/login" />} />
        {/* Fallback to dashboard for unknown routes */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
