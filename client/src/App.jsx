import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { AdminAuthProvider } from './context/AdminAuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';

// Admin imports
import AdminProtectedRoute from './components/admin/AdminProtectedRoute.jsx';
import AdminLayout from './components/admin/AdminLayout.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import ManageUsers from './pages/admin/ManageUsers.jsx';
import ManageCollaborations from './pages/admin/ManageCollaborations.jsx';
import ManageConnections from './pages/admin/ManageConnections.jsx';
import AdminSettings from './pages/admin/AdminSettings.jsx';
import './styles/admin.css';

// Customer imports
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LandingPage from './pages/LandingPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import DiscoverPage from './pages/DiscoverPage.jsx';
import TrendingPage from './pages/TrendingPage.jsx';
import CollaborationsPage from './pages/CollaborationsPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import OnboardingPage from './pages/OnboardingPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* ═══ ADMIN ROUTES ═══ */}
        <Route path="/admin" element={<AdminAuthProvider><AdminLogin /></AdminAuthProvider>} />
        <Route element={<AdminAuthProvider><AdminProtectedRoute><AdminLayout /></AdminProtectedRoute></AdminAuthProvider>}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<ManageUsers />} />
          <Route path="/admin/collaborations" element={<ManageCollaborations />} />
          <Route path="/admin/connections" element={<ManageConnections />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>

        {/* ═══ PUBLIC ROUTES ═══ */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />

        {/* ═══ PROTECTED CUSTOMER ROUTES ═══ */}
        <Route element={
          <ProtectedRoute><NotificationProvider><Navbar /></NotificationProvider></ProtectedRoute>
        }>
          <Route path="/home" element={<DashboardPage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/trending" element={<TrendingPage />} />
          <Route path="/collaborations" element={<CollaborationsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
        </Route>

        {/* ═══ CATCH-ALL — Must be LAST ═══ */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;