import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PortfolioInput from './pages/PortfolioInput';
import Dashboard from './pages/Dashboard';
import MyPortfolios from './pages/MyPortfolios';
import Scenarios from './pages/Scenarios';
import WatchlistPage from './pages/Watchlist';
import Goals from './pages/Goals';
import Alerts from './pages/Alerts';
import Notifications from './pages/Notifications';
import RiskQuestionnaire from './pages/RiskQuestionnaire';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/portfolio" element={
        <ProtectedRoute>
          <PortfolioInput />
        </ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/my-portfolios" element={
        <ProtectedRoute>
          <MyPortfolios />
        </ProtectedRoute>
      } />
      <Route path="/scenarios" element={
        <ProtectedRoute>
          <Scenarios />
        </ProtectedRoute>
      } />
      <Route path="/watchlist" element={
        <ProtectedRoute>
          <WatchlistPage />
        </ProtectedRoute>
      } />
      <Route path="/goals" element={
        <ProtectedRoute>
          <Goals />
        </ProtectedRoute>
      } />
      <Route path="/alerts" element={
        <ProtectedRoute>
          <Alerts />
        </ProtectedRoute>
      } />
      <Route path="/notifications" element={
        <ProtectedRoute>
          <Notifications />
        </ProtectedRoute>
      } />
      <Route path="/risk-questionnaire" element={
        <ProtectedRoute>
          <RiskQuestionnaire />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}