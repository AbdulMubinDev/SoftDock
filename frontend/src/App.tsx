import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './lib/stores/authStore';
import { useLenisScroll } from './hooks/useLenisScroll';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { LoginCallback } from './pages/LoginCallback';
import { Register } from './pages/Register';
import { PricingPage } from './pages/PricingPage';
import { UseCasesPage } from './pages/UseCasesPage';
import { Dashboard } from './pages/Dashboard';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { Feedback } from './pages/Feedback';
import { ReviewsPage } from './pages/ReviewsPage';
import { AppShell } from './components/layout/AppShell';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/login/callback" element={<LoginCallback />} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/use-cases" element={<UseCasesPage />} />
      <Route path="/reviews" element={<ReviewsPage />} />
      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="history" element={<History />} />
        <Route path="settings" element={<Settings />} />
        <Route path="feedback" element={<Feedback />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function SmoothScrollProvider() {
  useLenisScroll();
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <SmoothScrollProvider />
      <AppRoutes />
    </BrowserRouter>
  );
}
