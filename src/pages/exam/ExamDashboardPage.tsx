import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Users, 
  Clock, 
  TrendingUp, 
  Brain,
  Calendar,
  BarChart3,
  Plus,
  Eye,
  Edit,
  Copy,
  ExternalLink,
  CheckCircle
} from 'lucide-react';
import { ExamSession } from '../../types';
import CreateExamModal from '../../components/exam/CreateExamModal';
import EmailInvitationModal from '../../components/exam/EmailInvitationModal';
import { supabase } from '../../services/supabase';

interface ExamStats {
  totalQuestions: number;
  totalSessions: number;
  activeSessions: number;
  completedSessions: number;
  averageScore: number;
  totalTopics: number;
}

interface RecentSession {
  id: string;
  candidateName: string;
  jobTitle: string;
  status: 'pending' | 'in_progress' | 'completed' | 'expired';
  score?: number;
  startedAt: string;
}

const ExamDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ExamStats>({
    totalQuestions: 0,
    totalSessions: 0,
    activeSessions: 0,
    completedSessions: 0,
    averageScore: 0,
    totalTopics: 0
  });

  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateExamModalOpen, setIsCreateExamModalOpen] = useState(false);
  const [isEmailInvitationModalOpen, setIsEmailInvitationModalOpen] = useState(false);
  const [createdExamToken, setCreatedExamToken] = useState<string | null>(null);
  const [selectedExamSessions, setSelectedExamSessions] = useState<ExamSession[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load exam statistics
      const [questionsResult, sessionsResult, topicsResult] = await Promise.all([
        supabase.from('exam_questions').select('id', { count: 'exact', head: true }),
        supabase.from('exam_sessions').select('id, status, score, percentage', { count: 'exact' }),
        supabase.from('question_topics').select('id', { count: 'exact', head: true })
      ]);

      const totalQuestions = questionsResult.count || 0;
      const totalSessions = sessionsResult.count || 0;
      const totalTopics = topicsResult.count || 0;

      // Calculate active sessions
      const activeSessions = sessionsResult.data?.filter(s => s.status === 'in_progress').length || 0;
      
      // Calculate completed sessions
      const completedSessions = sessionsResult.data?.filter(s => s.status === 'completed').length || 0;
      
      // Calculate average score
      const completedWithScores = sessionsResult.data?.filter(s => s.status === 'completed' && s.percentage) || [];
      const averageScore = completedWithScores.length > 0 
        ? completedWithScores.reduce((sum, s) => sum + (s.percentage || 0), 0) / completedWithScores.length
        : 0;

      setStats({
        totalQuestions,
        totalSessions,
        activeSessions,
        completedSessions,
        averageScore: Math.round(averageScore * 10) / 10,
        totalTopics
      });

      // Load recent sessions
      const { data: recentSessionsData, error: sessionsError } = await supabase
        .from('exam_sessions')
        .select(`
          id,
          status,
          score,
          percentage,
          started_at,
          candidate:candidates(name),
          job_description:job_descriptions(title)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!sessionsError && recentSessionsData) {
        const recentSessions = recentSessionsData.map((session: any) => ({
          id: session.id,
          candidateName: Array.isArray(session.candidate) 
            ? session.candidate[0]?.name || 'Unknown'
            : session.candidate?.name || 'Unknown',
          jobTitle: Array.isArray(session.job_description) 
            ? session.job_description[0]?.title || 'Unknown'
            : session.job_description?.title || 'Unknown',
          status: session.status,
          score: session.score,
          startedAt: session.started_at || ''
        }));
        
        setRecentSessions(recentSessions);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExamSuccess = (examToken: string) => {
    setCreatedExamToken(examToken);
    console.log('Exam created successfully with token:', examToken);
  };

  const handleEmailInvitationSuccess = () => {
    setIsEmailInvitationModalOpen(false);
    setSelectedExamSessions([]);
    // Refresh data after sending invitations
    loadDashboardData();
  };

  const handleSendInvitations = (sessions: ExamSession[]) => {
    setSelectedExamSessions(sessions);
    setIsEmailInvitationModalOpen(true);
  };

  const copyExamLink = () => {
    if (createdExamToken) {
      const examUrl = `${window.location.origin}/candidate/exam/${createdExamToken}`;
      navigator.clipboard.writeText(examUrl);
      // You could add a toast notification here
      console.log('Exam link copied to clipboard:', examUrl);
    }
  };

  const openExamLink = () => {
    if (createdExamToken) {
      const examUrl = `${window.location.origin}/candidate/exam/${createdExamToken}`;
      window.open(examUrl, '_blank');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'expired': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'pending': return 'Pending';
      case 'expired': return 'Expired';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Success Message for Created Exam */}
      {createdExamToken && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900">Exam Created Successfully!</h3>
                <p className="text-sm text-green-700">Share this link with the candidate to start the exam</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={copyExamLink}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span>Copy Link</span>
              </button>
              <button
                onClick={openExamLink}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Exam</span>
              </button>
            </div>
          </div>
          <div className="mt-3 p-3 bg-white rounded-lg border">
            <p className="text-sm text-gray-600 mb-1">Exam Link:</p>
            <code className="text-sm text-gray-800 break-all">
              {`${window.location.origin}/candidate/exam/${createdExamToken}`}
            </code>
          </div>
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exam Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your exam system</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => navigate('/exams/create')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Exam</span>
          </button>
          <button 
            onClick={() => setIsCreateExamModalOpen(true)}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <Calendar className="h-4 w-4" />
            <span>Quick Create</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Questions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalQuestions}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Brain className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeSessions}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Recent Exam Sessions</h2>
            <button className="text-ai-teal hover:text-ai-teal/80 text-sm font-medium">
              View All
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Candidate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Started
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentSessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {session.candidateName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{session.jobTitle}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(session.status)}`}>
                      {getStatusText(session.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {session.score ? `${session.score}%` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(session.startedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-ai-teal hover:text-ai-teal/80">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-800">
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Brain className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Question Bank</h3>
          </div>
          <p className="text-gray-600 mb-4">Manage your question database and create new questions</p>
          <button className="text-ai-teal hover:text-ai-teal/80 font-medium">
            Manage Questions →
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Exam Sessions</h3>
          </div>
          <p className="text-gray-600 mb-4">View and manage active and completed exam sessions</p>
          <button className="text-ai-teal hover:text-ai-teal/80 font-medium">
            View Sessions →
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Analytics</h3>
          </div>
          <p className="text-gray-600 mb-4">Analyze exam performance and candidate results</p>
          <button className="text-ai-teal hover:text-ai-teal/80 font-medium">
            View Analytics →
          </button>
        </div>
      </div>

      {/* Create Exam Modal */}
      <CreateExamModal
        isOpen={isCreateExamModalOpen}
        onClose={() => setIsCreateExamModalOpen(false)}
        onSuccess={handleCreateExamSuccess}
      />

      {/* Email Invitation Modal */}
      <EmailInvitationModal
        isOpen={isEmailInvitationModalOpen}
        onClose={() => setIsEmailInvitationModalOpen(false)}
        examSessions={selectedExamSessions}
        onSuccess={handleEmailInvitationSuccess}
      />
    </div>
  );
};

export default ExamDashboardPage;
