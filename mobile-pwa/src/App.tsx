import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import BottomNav from './components/BottomNav';
import { EmergencyAlertBanner } from './components/EmergencyAlertBanner';

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

// Innovation Feature Pages
import { RadarPage } from './pages/RadarPage';
import { ThreatDnaPage } from './pages/ThreatDnaPage';
import { TrustGraphPage } from './pages/TrustGraphPage';
import { CoachPage } from './pages/CoachPage';
import { InvestigationPage } from './pages/InvestigationPage';
import DownloadPage from './pages/DownloadPage';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-[#F7F8FA] text-[#202A35] flex flex-col font-sans selection:bg-[#315E63] selection:text-white">
          {/* Emergency Campus Red Alert Broadcast Relay Banner */}
          <EmergencyAlertBanner />

          <main className="flex-1">
            <Routes>
              {/* Root & Onboarding */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/welcome" element={<WelcomePage />} />
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

              {/* Innovation Features */}
              <Route path="/radar" element={<RadarPage />} />
              <Route path="/threat-dna" element={<ThreatDnaPage />} />
              <Route path="/campaigns" element={<ThreatDnaPage />} />
              <Route path="/trust-graph" element={<TrustGraphPage />} />
              <Route path="/coach" element={<CoachPage />} />
              <Route path="/investigation" element={<InvestigationPage />} />
              <Route path="/download" element={<DownloadPage />} />

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
