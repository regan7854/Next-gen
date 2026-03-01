import { Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import DiscoverPage from './pages/DiscoverPage.jsx';
import CollaborationsPage from './pages/CollaborationsPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import OnboardingPage from './pages/OnboardingPage.jsx';
import TrendingPage from './pages/TrendingPage.jsx';
import Navbar from './components/Navbar.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/auth" replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/home" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />

        {/* All protected pages share the Navbar layout */}
        <Route element={<ProtectedRoute><Navbar /></ProtectedRoute>}>
          <Route path="/home" element={<DashboardPage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/trending" element={<TrendingPage />} />
          <Route path="/collaborations" element={<CollaborationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </AuthProvider>
  );
}
