import React, { useState, useEffect } from 'react';
import { X, Clock, User, Briefcase, CheckCircle, XCircle, AlertCircle, Calendar, BarChart3, ExternalLink, Copy } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { ExamSession, ExamResponse } from '../../types';

interface ExamSessionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
}

interface SessionDetails extends ExamSession {
  responses?: ExamResponse[];
  totalResponses?: number;
  correctAnswers?: number;
  timeSpent?: number;
}

const ExamSessionDetailsModal: React.FC<ExamSessionDetailsModalProps> = ({
  isOpen,
  onClose,
  sessionId
}) => {
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && sessionId) {
      loadSessionDetails();
    }
  }, [isOpen, sessionId]);

  const loadSessionDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load session with joined data
      const { data: sessionData, error: sessionError } = await supabase
        .from('exam_sessions')
        .select(`
          *,
          candidate:candidates(*),
          job_description:job_descriptions(*)
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError) {
        console.error('Error loading session:', sessionError);
        setError('Failed to load session details');
        return;
      }

      // Load exam responses
      const { data: responsesData, error: responsesError } = await supabase
        .from('exam_responses')
        .select(`
          *,
          question:exam_questions(*)
        `)
        .eq('exam_session_id', sessionId)
        .order('answered_at', { ascending: true });

      if (responsesError) {
        console.error('Error loading responses:', responsesError);
      }

      // Transform session data
      const transformedSession: SessionDetails = {
        id: sessionData.id,
        candidate_id: sessionData.candidate_id,
        job_description_id: sessionData.job_description_id,
        exam_token: sessionData.exam_token,
        total_questions: sessionData.total_questions,
        duration_minutes: sessionData.duration_minutes,
        initial_question_count: sessionData.initial_question_count || sessionData.total_questions,
        adaptive_questions_added: sessionData.adaptive_questions_added || 0,
        max_adaptive_questions: sessionData.max_adaptive_questions || 0,
        status: sessionData.status,
        started_at: sessionData.started_at,
        completed_at: sessionData.completed_at,
        expires_at: sessionData.expires_at,
        score: sessionData.score,
        percentage: sessionData.percentage,
        ip_address: sessionData.ip_address,
        user_agent: sessionData.user_agent,
        performance_metadata: sessionData.performance_metadata || {},
        created_at: sessionData.created_at,
        updated_at: sessionData.updated_at,
        candidate: Array.isArray(sessionData.candidate) ? sessionData.candidate[0] : sessionData.candidate,
        job_description: Array.isArray(sessionData.job_description) ? sessionData.job_description[0] : sessionData.job_description,
        responses: responsesData || [],
        totalResponses: responsesData?.length || 0,
        correctAnswers: responsesData?.filter(r => r.is_correct).length || 0,
        timeSpent: sessionData.started_at && sessionData.completed_at 
          ? Math.round((new Date(sessionData.completed_at).getTime() - new Date(sessionData.started_at).getTime()) / 1000 / 60)
          : undefined
      };

      setSession(transformedSession);
    } catch (error) {
      console.error('Error loading session details:', error);
      setError('Failed to load session details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in_progress': return <Clock className="h-5 w-5 text-blue-600" />;
      case 'pending': return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'expired': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'terminated': return <XCircle className="h-5 w-5 text-gray-600" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-600" />;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const generateExamLink = () => {
    if (!session) return '';
    return `${window.location.origin}/candidate/exam/${session.exam_token}`;
  };

  const copyExamLink = async () => {
    const examLink = generateExamLink();
    try {
      await navigator.clipboard.writeText(examLink);
      // You could add a toast notification here
      console.log('Exam link copied to clipboard:', examLink);
    } catch (error) {
      console.error('Failed to copy exam link:', error);
    }
  };

  const openExamLink = () => {
    const examLink = generateExamLink();
    window.open(examLink, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Exam Session Details</h2>
              <p className="text-sm text-gray-600">Detailed view of exam session performance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading session details...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Session</h3>
              <p className="text-gray-600">{error}</p>
            </div>
          ) : session ? (
            <div className="space-y-6">
              {/* Session Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-600">Candidate</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {session.candidate?.name || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {session.candidate?.email || ''}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Briefcase className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-600">Job Position</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {session.job_description?.title || 'Unknown'}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    {getStatusIcon(session.status)}
                    <span className="text-sm font-medium text-gray-600">Status</span>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(session.status)}`}>
                    {getStatusText(session.status)}
                  </span>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Questions</p>
                      <p className="text-2xl font-bold text-gray-900">{session.total_questions}</p>
                    </div>
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Answered</p>
                      <p className="text-2xl font-bold text-gray-900">{session.totalResponses}</p>
                    </div>
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Correct</p>
                      <p className="text-2xl font-bold text-gray-900">{session.correctAnswers}</p>
                    </div>
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Score</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {session.percentage ? `${session.percentage}%` : '-'}
                      </p>
                    </div>
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-yellow-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Session Timeline */}
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Timeline</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Created</p>
                      <p className="text-sm text-gray-900">{formatDate(session.created_at)}</p>
                    </div>
                  </div>

                  {session.started_at && (
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Clock className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Started</p>
                        <p className="text-sm text-gray-900">{formatDate(session.started_at)}</p>
                      </div>
                    </div>
                  )}

                  {session.completed_at && (
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Completed</p>
                        <p className="text-sm text-gray-900">{formatDate(session.completed_at)}</p>
                      </div>
                    </div>
                  )}

                  {session.timeSpent && (
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Clock className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Time Spent</p>
                        <p className="text-sm text-gray-900">{formatDuration(session.timeSpent)}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Clock className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Duration Limit</p>
                      <p className="text-sm text-gray-900">{formatDuration(session.duration_minutes)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Responses */}
              {session.responses && session.responses.length > 0 && (
                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Responses</h3>
                  <div className="space-y-4">
                    {session.responses.map((response, index) => (
                      <div key={response.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-600">Q{index + 1}</span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              response.is_correct ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                            }`}>
                              {response.is_correct ? 'Correct' : 'Incorrect'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(response.answered_at)}
                          </span>
                        </div>
                        <div className="mb-2">
                          <p className="text-sm font-medium text-gray-900 mb-1">Question:</p>
                          <p className="text-sm text-gray-700">
                            {response.question?.question_text || 'Question not available'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 mb-1">Answer:</p>
                          <p className="text-sm text-gray-700">{response.answer_text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Details */}
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Exam Token</p>
                    <p className="text-sm text-gray-900 font-mono">{session.exam_token}</p>
                  </div>
                  {session.ip_address && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">IP Address</p>
                      <p className="text-sm text-gray-900">{session.ip_address}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-600">Initial Questions</p>
                    <p className="text-sm text-gray-900">{session.initial_question_count}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Adaptive Questions</p>
                    <p className="text-sm text-gray-900">{session.adaptive_questions_added}</p>
                  </div>
                </div>
              </div>

              {/* Exam Link */}
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Exam Link</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-600 mb-2">Candidate Exam URL</p>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 text-sm text-gray-800 break-all bg-white p-2 rounded border">
                        {generateExamLink()}
                      </code>
                      <button
                        onClick={copyExamLink}
                        className="flex items-center space-x-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        title="Copy Exam Link"
                      >
                        <Copy className="h-4 w-4" />
                        <span>Copy</span>
                      </button>
                      <button
                        onClick={openExamLink}
                        className="flex items-center space-x-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        title="Open Exam in New Tab"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>Open</span>
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p className="mb-1">• Share this link with the candidate to access their exam</p>
                    <p className="mb-1">• The link is unique to this exam session</p>
                    <p>• Candidates can only access the exam if it's still active</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamSessionDetailsModal;
