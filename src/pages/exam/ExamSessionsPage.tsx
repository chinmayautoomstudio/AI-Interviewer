import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Search
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { ExamSession } from '../../types';
import ExamSessionDetailsModal from '../../components/exam/ExamSessionDetailsModal';

const ExamSessionsPage: React.FC = () => {
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    loadExamSessions();
  }, []);

  const loadExamSessions = async () => {
    try {
      setLoading(true);
      
      const { data: examSessions, error } = await supabase
        .from('exam_sessions')
        .select(`
          *,
          candidate:candidates(*),
          job_description:job_descriptions(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading exam sessions:', error);
        return;
      }

      // Transform the data to match our interface
      const transformedSessions: ExamSession[] = examSessions?.map(session => ({
        id: session.id,
        candidate_id: session.candidate_id,
        job_description_id: session.job_description_id,
        exam_token: session.exam_token,
        total_questions: session.total_questions,
        duration_minutes: session.duration_minutes,
        initial_question_count: session.initial_question_count || session.total_questions,
        adaptive_questions_added: session.adaptive_questions_added || 0,
        max_adaptive_questions: session.max_adaptive_questions || 0,
        status: session.status,
        started_at: session.started_at,
        completed_at: session.completed_at,
        expires_at: session.expires_at,
        score: session.score,
        percentage: session.percentage,
        ip_address: session.ip_address,
        user_agent: session.user_agent,
        performance_metadata: session.performance_metadata || {},
        created_at: session.created_at,
        updated_at: session.updated_at,
        candidate: Array.isArray(session.candidate) ? session.candidate[0] : session.candidate,
        job_description: Array.isArray(session.job_description) ? session.job_description[0] : session.job_description
      })) || [];

      setSessions(transformedSessions);
    } catch (error) {
      console.error('Error loading exam sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter(session => {
    const candidateName = session.candidate?.name || 'Unknown';
    const candidateEmail = session.candidate?.email || '';
    const jobTitle = session.job_description?.title || 'Unknown';
    
    const matchesSearch = 
      candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidateEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || session.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'pending': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'expired': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'terminated': return <XCircle className="h-4 w-4 text-gray-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'expired': return 'text-red-600 bg-red-100';
      case 'terminated': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'pending': return 'Pending';
      case 'expired': return 'Expired';
      case 'terminated': return 'Terminated';
      default: return status;
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const handleViewSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedSessionId(null);
  };

  const handleTerminateSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('exam_sessions')
        .update({ status: 'terminated' })
        .eq('id', sessionId);

      if (error) {
        console.error('Error terminating session:', error);
        return;
      }

      // Reload sessions
      loadExamSessions();
    } catch (error) {
      console.error('Error terminating session:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-3 sm:p-4 lg:p-6">
        <div className="animate-pulse">
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/3 sm:w-1/4 mb-4 sm:mb-6"></div>
          <div className="space-y-3 sm:space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-2 sm:h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="w-full max-w-full md:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 md:mb-6 space-y-3 md:space-y-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Exam Sessions</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Monitor and manage exam sessions</p>
          </div>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{sessions.length}</p>
            </div>
            <div className="p-2 sm:p-3 bg-blue-100 rounded-full flex-shrink-0">
              <Users className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Active Sessions</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {sessions.filter(s => s.status === 'in_progress').length}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-green-100 rounded-full flex-shrink-0">
              <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Completed</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {sessions.filter(s => s.status === 'completed').length}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-purple-100 rounded-full flex-shrink-0">
              <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Pending</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {sessions.filter(s => s.status === 'pending').length}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-yellow-100 rounded-full flex-shrink-0">
              <AlertCircle className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 sm:pl-10 w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="expired">Expired</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Exam Sessions</h2>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Candidate
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Job Title
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Progress
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Time Remaining
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Score
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {session.candidate?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {session.candidate?.email || ''}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{session.job_description?.title || 'Unknown'}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(session.status)}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(session.status)}`}>
                          {getStatusText(session.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {session.total_questions} questions
                      </div>
                      <div className="text-sm text-gray-500">
                        {session.duration_minutes} minutes
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                      {session.status === 'in_progress' ? getTimeRemaining(session.expires_at) : '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                      {session.score ? `${session.score}/${session.total_questions} (${session.percentage}%)` : '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleViewSession(session.id)}
                          className="text-ai-teal hover:text-ai-teal/80"
                          title="View Session"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {session.status === 'in_progress' && (
                          <button 
                            onClick={() => handleTerminateSession(session.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Terminate Session"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3 p-3 sm:p-4">
          {filteredSessions.map((session) => (
            <div key={session.id} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm max-w-full overflow-hidden">
              {/* Header with Candidate Info and Status */}
              <div className="flex items-start justify-between mb-3 gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-gray-900 break-words leading-tight">
                    {session.candidate?.name || 'Unknown'}
                  </h3>
                  <p className="text-xs text-gray-600 break-words leading-relaxed mt-1">
                    {session.candidate?.email || ''}
                  </p>
                  <p className="text-xs text-gray-500 break-words leading-relaxed mt-1">
                    {session.job_description?.title || 'Unknown'}
                  </p>
                </div>
                <div className="flex items-center space-x-1 flex-shrink-0">
                  {getStatusIcon(session.status)}
                  <span className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(session.status)} whitespace-nowrap`}>
                    {getStatusText(session.status)}
                  </span>
                </div>
              </div>
              
              {/* Session Details Grid */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs mb-3">
                <div className="min-w-0">
                  <span className="text-gray-500">Questions:</span>
                  <span className="ml-1 font-medium text-gray-900">{session.total_questions}</span>
                </div>
                <div className="min-w-0">
                  <span className="text-gray-500">Duration:</span>
                  <span className="ml-1 font-medium text-gray-900">{session.duration_minutes}m</span>
                </div>
                <div className="min-w-0">
                  <span className="text-gray-500">Time Left:</span>
                  <span className="ml-1 font-medium text-gray-900">
                    {session.status === 'in_progress' ? getTimeRemaining(session.expires_at) : '-'}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-gray-500">Score:</span>
                  <span className="ml-1 font-medium text-gray-900 break-words">
                    {session.score ? `${session.score}/${session.total_questions} (${session.percentage}%)` : '-'}
                  </span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center justify-end space-x-2 sm:space-x-3 pt-3 border-t border-gray-100">
                <button 
                  onClick={() => handleViewSession(session.id)}
                  className="text-ai-teal hover:text-ai-teal/80 text-xs font-medium whitespace-nowrap"
                >
                  View Details →
                </button>
                {session.status === 'in_progress' && (
                  <button 
                    onClick={() => handleTerminateSession(session.id)}
                    className="text-red-600 hover:text-red-800 text-xs font-medium whitespace-nowrap"
                  >
                    Terminate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {filteredSessions.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No exam sessions found</h3>
          <p className="text-gray-600">Try adjusting your filters or create new exam sessions</p>
        </div>
      )}

      {/* Exam Session Details Modal */}
      <ExamSessionDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        sessionId={selectedSessionId || ''}
      />
      </div>
    </div>
  );
};

export default ExamSessionsPage;
