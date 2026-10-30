import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import BottomNav from './components/BottomNav';

// Pages
import WelcomePage from './pages/WelcomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import ScanPage from './pages/ScanPage';
import QrScannerPage from './pages/QrScannerPage';
import ReportPage from './pages/ReportPage';
import MyReportsPage from './pages/MyReportsPage';
import IncidentDetailPage from './pages/IncidentDetailPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-[#0a0f1e] text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950">
          <main className="flex-1">
            <Routes>
              {/* Public & Onboarding */}
              <Route path="/" element={<WelcomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Core Features */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/scan" element={<ScanPage />} />
              <Route path="/qr-scanner" element={<QrScannerPage />} />
              <Route path="/report" element={<ReportPage />} />
              <Route path="/reports" element={<MyReportsPage />} />
              <Route path="/reports/:id" element={<IncidentDetailPage />} />
              <Route path="/profile" element={<ProfilePage />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>

          {/* Mobile Bottom Navigation */}
          <BottomNav />
        </div>
      </Router>
    </AuthProvider>
  );
}
