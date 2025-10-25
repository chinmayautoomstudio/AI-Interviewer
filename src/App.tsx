import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import './utils/testConnection'; // Auto-test Supabase connection - disabled to prevent errors
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LayoutProvider } from './contexts/LayoutContext';
import { NotificationProvider } from './contexts/NotificationContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CandidatesPage from './pages/CandidatesPage';
import ReportsPage from './pages/ReportsPage';
import JobDescriptionsPage from './pages/JobDescriptionsPage';
import JobViewPage from './pages/JobViewPage';
import SettingsPage from './pages/SettingsPage';
import CandidateLoginPage from './pages/CandidateLoginPage';
import CandidateDashboardPage from './pages/CandidateDashboardPage';
import CandidateInterviewPage from './pages/CandidateInterviewPage';
import CandidateProfilePage from './pages/CandidateProfilePage';
import CandidatePasswordUpdatePage from './pages/CandidatePasswordUpdatePage';
import TwoFactorSettingsPage from './pages/TwoFactorSettingsPage';
import AIAgentsPage from './pages/AIAgentsPage';
import AdminInterviewTestPage from './pages/AdminInterviewTestPage';
import InterviewReportPage from './pages/InterviewReportPage';
import InterviewManagementPage from './pages/InterviewManagementPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsAndConditionsPage from './pages/TermsAndConditionsPage';
import DisclaimerPage from './pages/DisclaimerPage';
import HelpSupportPage from './pages/HelpSupportPage';
import RegisterPage from './pages/RegisterPage';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
// Exam pages
import ExamDashboardPage from './pages/exam/ExamDashboardPage';
import ExamCreationPage from './pages/exam/ExamCreationPage';
import QuestionBankPage from './pages/exam/QuestionBankPage';
import QuestionAssignmentPage from './pages/exam/QuestionAssignmentPage';
import TopicManagementPage from './pages/exam/TopicManagementPage';
import ExamSessionsPage from './pages/exam/ExamSessionsPage';
import ExamResultsPage from './pages/exam/ExamResultsPage';
import ExamAnalyticsPage from './pages/exam/ExamAnalyticsPage';
import CandidateExamPage from './pages/CandidateExamPage';
import ExamCompletionPage from './pages/exam/ExamCompletionPage';
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
        <Route path="/candidate" element={<Navigate to="/candidate/login" replace />} />
        <Route path="/candidate/login" element={<CandidateLoginPage />} />
        <Route path="/candidate/dashboard" element={<CandidateDashboardPage />} />
        <Route path="/candidate/interview/:sessionToken" element={<CandidateInterviewPage />} />
        <Route path="/candidate/exam/:token" element={<CandidateExamPage />} />
        <Route path="/exam/completion/:sessionId" element={<ExamCompletionPage />} />
        <Route path="/candidate/update-password" element={<CandidatePasswordUpdatePage />} />
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
        <main className="flex-1 lg:ml-0">
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/interviews" element={<InterviewManagementPage />} />
            <Route path="/interview-management" element={<InterviewManagementPage />} />
            <Route path="/candidates" element={<CandidatesPage />} />
            <Route path="/candidates/:id" element={<CandidateProfilePage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/reports/:reportId" element={<InterviewReportPage />} />
            <Route path="/job-descriptions" element={<JobDescriptionsPage />} />
            <Route path="/job-descriptions/:id" element={<JobViewPage />} />
            <Route path="/job-descriptions/edit/:id" element={<JobDescriptionsPage />} />
            <Route path="/ai-agents" element={<AIAgentsPage />} />
            <Route path="/admin-interview-test" element={<AdminInterviewTestPage />} />
            {/* Exam Routes */}
            <Route path="/exams" element={<Navigate to="/exams/dashboard" replace />} />
            <Route path="/exams/dashboard" element={<ExamDashboardPage />} />
            <Route path="/exams/create" element={<ExamCreationPage />} />
            <Route path="/exams/questions" element={<QuestionBankPage />} />
            <Route path="/exams/assignments" element={<QuestionAssignmentPage />} />
            <Route path="/exams/topics" element={<TopicManagementPage />} />
            <Route path="/exams/sessions" element={<ExamSessionsPage />} />
            <Route path="/exams/results" element={<ExamResultsPage />} />
            <Route path="/exams/analytics" element={<ExamAnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/two-factor" element={<TwoFactorSettingsPage />} />
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
      <LayoutProvider>
        <NotificationProvider>
          <Router>
            <AppContent />
          </Router>
        </NotificationProvider>
      </LayoutProvider>
    </AuthProvider>
  );
}

export default App;
