import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import './utils/testConnection'; // Auto-test Supabase connection - disabled to prevent errors
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CandidatesPage from './pages/CandidatesPage';
import InterviewPage from './pages/InterviewPage';
import ReportsPage from './pages/ReportsPage';
import JobDescriptionsPage from './pages/JobDescriptionsPage';
import JobViewPage from './pages/JobViewPage';
import SettingsPage from './pages/SettingsPage';
import CandidateLoginPage from './pages/CandidateLoginPage';
import CandidateDashboardPage from './pages/CandidateDashboardPage';
import CandidateInterviewPage from './pages/CandidateInterviewPage';
import CandidateProfilePage from './pages/CandidateProfilePage';
import AIAgentsPage from './pages/AIAgentsPage';
import AdminInterviewTestPage from './pages/AdminInterviewTestPage';
import InterviewReportPage from './pages/InterviewReportPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsAndConditionsPage from './pages/TermsAndConditionsPage';
import DisclaimerPage from './pages/DisclaimerPage';
import HelpSupportPage from './pages/HelpSupportPage';
import RegisterPage from './pages/RegisterPage';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import LoadingSpinner from './components/ui/LoadingSpinner';

const AppContent: React.FC = () => {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/candidate" element={<CandidateLoginPage />} />
        <Route path="/candidate/dashboard" element={<CandidateDashboardPage />} />
        <Route path="/candidate/interview/:sessionToken" element={<CandidateInterviewPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
        <Route path="/disclaimer" element={<DisclaimerPage />} />
        <Route path="/help" element={<HelpSupportPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={signOut} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1">
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/interviews" element={<Navigate to="/admin-interview-test" replace />} />
            <Route path="/candidates" element={<CandidatesPage />} />
            <Route path="/candidates/:id" element={<CandidateProfilePage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/reports/:reportId" element={<InterviewReportPage />} />
            <Route path="/job-descriptions" element={<JobDescriptionsPage />} />
            <Route path="/job-descriptions/:id" element={<JobViewPage />} />
            <Route path="/job-descriptions/edit/:id" element={<JobDescriptionsPage />} />
            <Route path="/ai-agents" element={<AIAgentsPage />} />
            <Route path="/admin-interview-test" element={<AdminInterviewTestPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
            <Route path="/disclaimer" element={<DisclaimerPage />} />
            <Route path="/help" element={<HelpSupportPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
