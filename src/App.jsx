import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { ToastContainer } from './components/ui/Toast';

import Home from './pages/Home';
import About from './pages/About';
import Login from './pages/Login';
import Sitemap from './pages/Sitemap';
import SocietyMap from './pages/SocietyMap';

import ResidentDashboard from './pages/resident/Dashboard';
import ResidentProfile from './pages/resident/Profile';
import ResidentBills from './pages/resident/Bills';
import ResidentVisitors from './pages/resident/VisitorPasses';
import ResidentComplaints from './pages/resident/Complaints';
import ResidentAmenities from './pages/resident/Amenities';
import ResidentNotices from './pages/resident/Notices';
import ResidentEmergency from './pages/resident/Emergency';

import GuardDashboard from './pages/guard/Dashboard';
import GuardVisitorLog from './pages/guard/VisitorLog';
import GuardVerify from './pages/guard/PassVerification';
import GuardOverstay from './pages/guard/Overstay';

import StaffDashboard from './pages/staff/Dashboard';

import AdminDashboard from './pages/admin/Dashboard';
import AdminResidents from './pages/admin/Residents';
import AdminFlats from './pages/admin/Flats';
import AdminBilling from './pages/admin/Billing';
import AdminHelpdesk from './pages/admin/Helpdesk';
import AdminAmenities from './pages/admin/Amenities';
import AdminSecurityLogs from './pages/admin/SecurityLogs';
import AdminNotices from './pages/admin/Notices';
import AdminStaffManagement from './pages/admin/StaffManagement';

function DashboardRedirect() {
  const { user } = useAuth();
  if (!user || !user.role) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role}/dashboard`} replace />;
}

export default function App() {
  return (
    <>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="/sitemap" element={<Sitemap />} />

          <Route
            element={
              <ProtectedRoute allow={['resident', 'guard', 'staff', 'admin']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/society-map" element={<SocietyMap />} />

            <Route path="/resident/dashboard" element={<ProtectedRoute allow={['resident']}><ResidentDashboard /></ProtectedRoute>} />
            <Route path="/resident/profile" element={<ProtectedRoute allow={['resident']}><ResidentProfile /></ProtectedRoute>} />
            <Route path="/resident/bills" element={<ProtectedRoute allow={['resident']}><ResidentBills /></ProtectedRoute>} />
            <Route path="/resident/visitors" element={<ProtectedRoute allow={['resident']}><ResidentVisitors /></ProtectedRoute>} />
            <Route path="/resident/complaints" element={<ProtectedRoute allow={['resident']}><ResidentComplaints /></ProtectedRoute>} />
            <Route path="/resident/amenities" element={<ProtectedRoute allow={['resident']}><ResidentAmenities /></ProtectedRoute>} />
            <Route path="/resident/notices" element={<ProtectedRoute allow={['resident']}><ResidentNotices /></ProtectedRoute>} />
            <Route path="/resident/emergency" element={<ProtectedRoute allow={['resident']}><ResidentEmergency /></ProtectedRoute>} />

            <Route path="/guard/dashboard" element={<ProtectedRoute allow={['guard']}><GuardDashboard /></ProtectedRoute>} />
            <Route path="/guard/visitor-log" element={<ProtectedRoute allow={['guard']}><GuardVisitorLog /></ProtectedRoute>} />
            <Route path="/guard/verify" element={<ProtectedRoute allow={['guard']}><GuardVerify /></ProtectedRoute>} />
            <Route path="/guard/overstay" element={<ProtectedRoute allow={['guard']}><GuardOverstay /></ProtectedRoute>} />

            <Route path="/staff/dashboard" element={<ProtectedRoute allow={['staff']}><StaffDashboard /></ProtectedRoute>} />

            <Route path="/admin/dashboard" element={<ProtectedRoute allow={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/residents" element={<ProtectedRoute allow={['admin']}><AdminResidents /></ProtectedRoute>} />
            <Route path="/admin/flats" element={<ProtectedRoute allow={['admin']}><AdminFlats /></ProtectedRoute>} />
            <Route path="/admin/billing" element={<ProtectedRoute allow={['admin']}><AdminBilling /></ProtectedRoute>} />
            <Route path="/admin/helpdesk" element={<ProtectedRoute allow={['admin', 'staff']}><AdminHelpdesk /></ProtectedRoute>} />
            <Route path="/admin/amenities" element={<ProtectedRoute allow={['admin']}><AdminAmenities /></ProtectedRoute>} />
            <Route path="/admin/security-logs" element={<ProtectedRoute allow={['admin', 'staff']}><AdminSecurityLogs /></ProtectedRoute>} />
            <Route path="/admin/notices" element={<ProtectedRoute allow={['admin']}><AdminNotices /></ProtectedRoute>} />
            <Route path="/admin/staff" element={<ProtectedRoute allow={['admin']}><AdminStaffManagement /></ProtectedRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </AuthProvider>
      </BrowserRouter>
      <ToastContainer />
    </>
  );
}
