import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Clock, 
  TrendingUp, 
  Brain,
  Calendar,
  BarChart3,
  Plus,
  Eye,
  Copy,
  ExternalLink,
  CheckCircle,
  RefreshCw
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
      console.log('🔄 Loading dashboard data...');
      
      // Load exam statistics
      const [questionsResult, sessionsResult, topicsResult, resultsResult] = await Promise.all([
        supabase.from('exam_questions').select('id', { count: 'exact', head: true }),
        supabase.from('exam_sessions').select('id, status', { count: 'exact' }),
        supabase.from('question_topics').select('id', { count: 'exact', head: true }),
        supabase.from('exam_results').select('percentage', { count: 'exact' })
      ]);

      console.log('📊 Database results:', {
        questions: questionsResult,
        sessions: sessionsResult,
        topics: topicsResult,
        results: resultsResult
      });

      // Check for errors
      if (questionsResult.error) {
        console.error('❌ Error fetching questions:', questionsResult.error);
      }
      if (sessionsResult.error) {
        console.error('❌ Error fetching sessions:', sessionsResult.error);
      }
      if (topicsResult.error) {
        console.error('❌ Error fetching topics:', topicsResult.error);
      }
      if (resultsResult.error) {
        console.error('❌ Error fetching results:', resultsResult.error);
      }

      const totalQuestions = questionsResult.count || 0;
      const totalSessions = sessionsResult.count || 0;
      const totalTopics = topicsResult.count || 0;

      // Calculate active sessions
      const activeSessions = sessionsResult.data?.filter(s => s.status === 'in_progress').length || 0;
      
      // Calculate completed sessions
      const completedSessions = sessionsResult.data?.filter(s => s.status === 'completed').length || 0;
      
      // Calculate average score from exam_results table
      const completedWithScores = resultsResult.data?.filter(r => r.percentage) || [];
      const averageScore = completedWithScores.length > 0 
        ? completedWithScores.reduce((sum, r) => sum + (r.percentage || 0), 0) / completedWithScores.length
        : 0;

      console.log('📈 Calculated stats:', {
        totalQuestions,
        totalSessions,
        activeSessions,
        completedSessions,
        averageScore,
        totalTopics
      });

      setStats({
        totalQuestions,
        totalSessions,
        activeSessions,
        completedSessions,
        averageScore: Math.round(averageScore * 10) / 10,
        totalTopics
      });

      // Load recent sessions with results
      const { data: recentSessionsData, error: sessionsError } = await supabase
        .from('exam_sessions')
        .select(`
          id,
          status,
          started_at,
          candidate:candidates(name),
          job_description:job_descriptions(title),
          exam_results(percentage)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      console.log('📋 Recent sessions data:', { recentSessionsData, sessionsError });

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
          score: session.exam_results?.[0]?.percentage || null,
          startedAt: session.started_at || ''
        }));
        
        console.log('✅ Processed recent sessions:', recentSessions);
        setRecentSessions(recentSessions);
      } else {
        console.log('⚠️ No recent sessions data or error:', sessionsError);
        setRecentSessions([]);
      }

    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      // Set default values on error
      setStats({
        totalQuestions: 0,
        totalSessions: 0,
        activeSessions: 0,
        completedSessions: 0,
        averageScore: 0,
        totalTopics: 0
      });
      setRecentSessions([]);
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
      <div className="p-3 sm:p-4 lg:p-6">
        <div className="animate-pulse">
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/3 sm:w-1/4 mb-4 sm:mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-6 sm:h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      {/* Success Message for Created Exam */}
      {createdExamToken && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg flex-shrink-0">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-green-900 text-sm sm:text-base">Exam Created Successfully!</h3>
                <p className="text-xs sm:text-sm text-green-700">Share this link with the candidate to start the exam</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <button
                onClick={copyExamLink}
                className="flex items-center justify-center space-x-1 sm:space-x-2 px-3 py-2 text-xs sm:text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Copy Link</span>
              </button>
              <button
                onClick={openExamLink}
                className="flex items-center justify-center space-x-1 sm:space-x-2 px-3 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Open Exam</span>
              </button>
            </div>
          </div>
          <div className="mt-3 p-2 sm:p-3 bg-white rounded-lg border">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Exam Link:</p>
            <code className="text-xs sm:text-sm text-gray-800 break-all">
              {`${window.location.origin}/candidate/exam/${createdExamToken}`}
            </code>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Exam Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Overview of your exam system</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 sm:space-x-3">
          <button 
            onClick={loadDashboardData}
            className="bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-1 sm:space-x-2 text-sm"
          >
            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Refresh</span>
          </button>
          <button 
            onClick={() => navigate('/exams/create')}
            className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1 sm:space-x-2 text-sm"
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Create Exam</span>
          </button>
          <button 
            onClick={() => setIsCreateExamModalOpen(true)}
            className="bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-1 sm:space-x-2 text-sm"
          >
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Quick Create</span>
            <span className="sm:hidden">Quick</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Questions</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalQuestions}</p>
              {stats.totalQuestions === 0 && (
                <p className="text-xs text-gray-500 mt-1">No questions yet</p>
              )}
            </div>
            <div className="p-2 sm:p-3 bg-blue-100 rounded-full flex-shrink-0">
              <Brain className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
              {stats.totalSessions === 0 && (
                <p className="text-xs text-gray-500 mt-1">No sessions yet</p>
              )}
            </div>
            <div className="p-2 sm:p-3 bg-green-100 rounded-full flex-shrink-0">
              <Users className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Active Sessions</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.activeSessions}</p>
              {stats.activeSessions === 0 && (
                <p className="text-xs text-gray-500 mt-1">No active sessions</p>
              )}
            </div>
            <div className="p-2 sm:p-3 bg-yellow-100 rounded-full flex-shrink-0">
              <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
              {stats.averageScore === 0 && (
                <p className="text-xs text-gray-500 mt-1">No completed exams</p>
              )}
            </div>
            <div className="p-2 sm:p-3 bg-purple-100 rounded-full flex-shrink-0">
              <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started Message */}
      {stats.totalQuestions === 0 && stats.totalSessions === 0 && (
        <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2 sm:space-x-3">
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">Welcome to the Exam System!</h3>
              <p className="text-blue-800 text-xs sm:text-sm mb-3">
                Get started by creating questions and setting up your first exam session. Here's what you can do:
              </p>
              <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-blue-700">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full flex-shrink-0"></span>
                  <span>Create questions in the Question Bank</span>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full flex-shrink-0"></span>
                  <span>Assign questions to job descriptions</span>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full flex-shrink-0"></span>
                  <span>Create exam sessions for candidates</span>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full flex-shrink-0"></span>
                  <span>Monitor results and analytics</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Recent Exam Sessions</h2>
            <button 
              onClick={() => navigate('/exams/sessions')}
              className="text-ai-teal hover:text-ai-teal/80 text-xs sm:text-sm font-medium self-start sm:self-auto"
            >
              View All
            </button>
          </div>
        </div>
        
        {recentSessions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Candidate
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job Title
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Started
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                        {session.candidateName}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm text-gray-900 truncate">{session.jobTitle}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${getStatusColor(session.status)}`}>
                        {getStatusText(session.status)}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {session.score ? `${session.score}%` : '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                      {session.startedAt ? new Date(session.startedAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <button
                          onClick={() => navigate(`/exams/sessions/${session.id}`)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="View Details"
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                        {session.status === 'completed' && (
                          <button
                            onClick={() => navigate(`/exams/results/${session.id}`)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="View Results"
                          >
                            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 sm:p-8 text-center">
            <div className="text-gray-500 mb-4">
              <Users className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2" />
              <p className="text-sm sm:text-base">No exam sessions yet</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">Create your first exam session to get started</p>
            </div>
            <button
              onClick={() => navigate('/exams/create')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Create Exam Session
            </button>
          </div>
        )}
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
          <button 
            onClick={() => navigate('/exams/questions')}
            className="text-ai-teal hover:text-ai-teal/80 font-medium"
          >
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
          <button 
            onClick={() => navigate('/exams/sessions')}
            className="text-ai-teal hover:text-ai-teal/80 font-medium"
          >
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
          <button 
            onClick={() => navigate('/exams/results')}
            className="text-ai-teal hover:text-ai-teal/80 font-medium"
          >
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
