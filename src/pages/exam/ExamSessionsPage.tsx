import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Search,
  Trash2,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { ExamSession } from '../../types';
import ExamSessionDetailsModal from '../../components/exam/ExamSessionDetailsModal';
import { examService } from '../../services/examService';

const ExamSessionsPage: React.FC = () => {
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [deleteConfirmSessionId, setDeleteConfirmSessionId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  
  // Bulk selection state
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkDeleteCriteria, setBulkDeleteCriteria] = useState<{
    type: 'selected' | 'filter';
    olderThanDays?: number;
    status?: 'completed' | 'expired' | 'terminated';
    dateRange?: { start: string; end: string };
  } | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState<{ current: number; total: number } | null>(null);
  const [bulkDeleteResult, setBulkDeleteResult] = useState<{ deleted: number; failed: number; errors: string[] } | null>(null);
  const [bulkDeleteDays, setBulkDeleteDays] = useState<string>('');
  const [bulkDeleteStatus, setBulkDeleteStatus] = useState<string>('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);

  useEffect(() => {
    loadExamSessions();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus, selectedDateRange]);

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

  // Pagination calculations
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSessions = filteredSessions.slice(startIndex, endIndex);

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

  const handleDeleteClick = (sessionId: string) => {
    setDeleteConfirmSessionId(sessionId);
    setDeleteError(null);
    setDeleteSuccess(false);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmSessionId(null);
    setDeleteError(null);
    setDeleteSuccess(false);
  };

  const handleDeleteSession = async () => {
    if (!deleteConfirmSessionId) return;

    try {
      setIsDeleting(true);
      setDeleteError(null);
      setDeleteSuccess(false);

      const result = await examService.deleteExamSession(deleteConfirmSessionId);

      if (result.success) {
        setDeleteSuccess(true);
        // Close modal and reload sessions after a brief delay
        setTimeout(() => {
          setDeleteConfirmSessionId(null);
          setDeleteSuccess(false);
          loadExamSessions();
        }, 1000);
      } else {
        setDeleteError(result.error || 'Failed to delete exam session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      setDeleteError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  // Check if session can be deleted (not in_progress or pending)
  const canDeleteSession = (session: ExamSession): boolean => {
    return session.status === 'completed' || 
           session.status === 'expired' || 
           session.status === 'terminated';
  };

  // Selection handlers
  const handleSelectSession = (sessionId: string, selected: boolean) => {
    setSelectedSessions(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(sessionId);
      } else {
        newSet.delete(sessionId);
      }
      setShowBulkActions(newSet.size > 0);
      return newSet;
    });
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const deletableSessions = filteredSessions
        .filter(s => canDeleteSession(s))
        .map(s => s.id);
      setSelectedSessions(new Set(deletableSessions));
      setShowBulkActions(deletableSessions.length > 0);
    } else {
      setSelectedSessions(new Set());
      setShowBulkActions(false);
    }
  };

  const handleBulkDeleteClick = () => {
    setBulkDeleteCriteria({
      type: 'selected',
    });
    setBulkDeleteResult(null);
  };

  const handleBulkDeleteByFilter = (criteria: {
    olderThanDays?: number;
    status?: 'completed' | 'expired' | 'terminated';
    dateRange?: { start: string; end: string };
  }) => {
    setBulkDeleteCriteria({
      type: 'filter',
      ...criteria
    });
    setBulkDeleteResult(null);
  };

  const handleBulkDeleteCancel = () => {
    setBulkDeleteCriteria(null);
    setBulkDeleteResult(null);
    setBulkDeleteProgress(null);
  };

  const handleBulkDeleteConfirm = async () => {
    if (!bulkDeleteCriteria) return;

    try {
      setIsBulkDeleting(true);
      setBulkDeleteProgress({ current: 0, total: 0 });
      setBulkDeleteResult(null);

      let criteria: {
        sessionIds?: string[];
        status?: 'completed' | 'expired' | 'terminated';
        olderThanDays?: number;
        dateRange?: { start: string; end: string };
      } = {};

      if (bulkDeleteCriteria.type === 'selected') {
        criteria.sessionIds = Array.from(selectedSessions);
      } else {
        if (bulkDeleteCriteria.olderThanDays) {
          criteria.olderThanDays = bulkDeleteCriteria.olderThanDays;
        }
        if (bulkDeleteCriteria.status) {
          criteria.status = bulkDeleteCriteria.status;
        }
        if (bulkDeleteCriteria.dateRange) {
          criteria.dateRange = bulkDeleteCriteria.dateRange;
        }
      }

      const result = await examService.bulkDeleteExamSessions(criteria);

      setBulkDeleteResult({
        deleted: result.deletedCount,
        failed: result.failedCount,
        errors: result.errors
      });

      if (result.success || result.deletedCount > 0) {
        // Clear selection and reload sessions
        setSelectedSessions(new Set());
        setShowBulkActions(false);
        setTimeout(() => {
          loadExamSessions();
          handleBulkDeleteCancel();
        }, 2000);
      }
    } catch (error) {
      console.error('Error in bulk delete:', error);
      setBulkDeleteResult({
        deleted: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : 'An unexpected error occurred']
      });
    } finally {
      setIsBulkDeleting(false);
      setBulkDeleteProgress(null);
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
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 sm:pl-10 w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
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
              onChange={(e) => {
                setSelectedDateRange(e.target.value);
                setCurrentPage(1);
              }}
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

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedSessions.size} session{selectedSessions.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={handleBulkDeleteClick}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Selected</span>
              </button>
            </div>
            <button
              onClick={() => {
                setSelectedSessions(new Set());
                setShowBulkActions(false);
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Bulk Delete by Filter Section */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border mb-4">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-sm sm:text-base font-semibold text-gray-900">Bulk Delete by Filter</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Delete older than (days)</label>
            <div className="flex space-x-2">
              <input
                type="number"
                min="1"
                placeholder="30"
                value={bulkDeleteDays}
                onChange={(e) => setBulkDeleteDays(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <button
                onClick={() => {
                  const days = bulkDeleteDays ? parseInt(bulkDeleteDays) : undefined;
                  if (days && days > 0) {
                    handleBulkDeleteByFilter({ olderThanDays: days });
                    setBulkDeleteDays('');
                  }
                }}
                disabled={!bulkDeleteDays || parseInt(bulkDeleteDays) <= 0}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Delete by status</label>
            <div className="flex space-x-2">
              <select
                value={bulkDeleteStatus}
                onChange={(e) => setBulkDeleteStatus(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Select status</option>
                <option value="completed">Completed</option>
                <option value="expired">Expired</option>
                <option value="terminated">Terminated</option>
              </select>
              <button
                onClick={() => {
                  if (bulkDeleteStatus) {
                    handleBulkDeleteByFilter({ status: bulkDeleteStatus as 'completed' | 'expired' | 'terminated' });
                    setBulkDeleteStatus('');
                  }
                }}
                disabled={!bulkDeleteStatus}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Delete
              </button>
            </div>
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
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-12">
                  <input
                    type="checkbox"
                    checked={selectedSessions.size > 0 && selectedSessions.size === filteredSessions.filter(s => canDeleteSession(s)).length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    title="Select all deletable sessions"
                  />
                </th>
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
              {paginatedSessions.length > 0 ? (
                paginatedSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      {canDeleteSession(session) && (
                        <input
                          type="checkbox"
                          checked={selectedSessions.has(session.id)}
                          onChange={(e) => handleSelectSession(session.id, e.target.checked)}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                      )}
                    </td>
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
                        {canDeleteSession(session) && (
                          <button 
                            onClick={() => handleDeleteClick(session.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete Session"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No sessions found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3 p-3 sm:p-4">
          {paginatedSessions.length > 0 ? (
            paginatedSessions.map((session) => (
              <div key={session.id} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm max-w-full overflow-hidden">
                {/* Header with Candidate Info and Status */}
                <div className="flex items-start justify-between mb-3 gap-2">
                  {canDeleteSession(session) && (
                    <input
                      type="checkbox"
                      checked={selectedSessions.has(session.id)}
                      onChange={(e) => handleSelectSession(session.id, e.target.checked)}
                      className="mt-1 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                  )}
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
                  {canDeleteSession(session) && (
                    <button 
                      onClick={() => handleDeleteClick(session.id)}
                      className="text-red-600 hover:text-red-800 text-xs font-medium whitespace-nowrap flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No sessions found</p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {filteredSessions.length > 0 && (
          <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 gap-4 sm:gap-6">
              {/* Results Info */}
              <div className="text-xs sm:text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredSessions.length)} of {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}
              </div>
              
              {/* Page Size Selector */}
              <div className="flex items-center gap-2">
                <label className="text-xs sm:text-sm text-gray-700">Show:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="text-xs sm:text-sm border border-gray-300 rounded px-2 py-1 min-w-[70px] focus:ring-2 focus:ring-ai-teal focus:border-transparent"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-xs sm:text-sm text-gray-700">per page</span>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1 sm:gap-2 ml-2 sm:ml-4">
                  {/* Previous Page */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg flex items-center justify-center ${
                      currentPage === 1
                        ? 'opacity-50 cursor-not-allowed bg-gray-100'
                        : 'hover:bg-gray-50 bg-white'
                    } transition-colors`}
                    title="Previous page"
                  >
                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg min-w-[32px] sm:min-w-[40px] flex items-center justify-center ${
                            currentPage === pageNum
                              ? 'bg-ai-teal text-white border-ai-teal'
                              : 'hover:bg-gray-50 bg-white'
                          } transition-colors`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next Page */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg flex items-center justify-center ${
                      currentPage === totalPages
                        ? 'opacity-50 cursor-not-allowed bg-gray-100'
                        : 'hover:bg-gray-50 bg-white'
                    } transition-colors`}
                    title="Next page"
                  >
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {filteredSessions.length === 0 && !loading && (
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
        onDelete={(deletedSessionId) => {
          // Close modal and reload sessions
          handleCloseDetailsModal();
          loadExamSessions();
        }}
      />

      {/* Bulk Delete Confirmation Modal */}
      {bulkDeleteCriteria && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Bulk Delete Exam Sessions
              </h3>
              
              <p className="text-sm text-gray-600 text-center mb-4">
                {bulkDeleteCriteria.type === 'selected' 
                  ? `Are you sure you want to delete ${selectedSessions.size} selected exam session${selectedSessions.size !== 1 ? 's' : ''}?`
                  : 'Are you sure you want to delete exam sessions matching the selected criteria?'
                }
              </p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-yellow-800 font-medium mb-1">This will permanently delete:</p>
                <ul className="text-xs text-yellow-700 list-disc list-inside space-y-1">
                  <li>Exam session records</li>
                  <li>All exam responses</li>
                  <li>Exam results</li>
                  <li>Session questions</li>
                  <li>Security violation logs</li>
                </ul>
              </div>

              {bulkDeleteCriteria.type === 'filter' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-blue-800 font-medium mb-1">Delete Criteria:</p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    {bulkDeleteCriteria.olderThanDays && (
                      <li>• Sessions older than {bulkDeleteCriteria.olderThanDays} days</li>
                    )}
                    {bulkDeleteCriteria.status && (
                      <li>• Status: {bulkDeleteCriteria.status}</li>
                    )}
                    {bulkDeleteCriteria.dateRange && (
                      <li>• Date range: {new Date(bulkDeleteCriteria.dateRange.start).toLocaleDateString()} - {new Date(bulkDeleteCriteria.dateRange.end).toLocaleDateString()}</li>
                    )}
                  </ul>
                </div>
              )}

              {bulkDeleteProgress && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-blue-800 font-medium">Deleting sessions...</span>
                    <span className="text-sm text-blue-600">
                      {bulkDeleteProgress.current} / {bulkDeleteProgress.total}
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(bulkDeleteProgress.current / Math.max(bulkDeleteProgress.total, 1)) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {bulkDeleteResult && (
                <div className={`border rounded-lg p-3 mb-4 ${
                  bulkDeleteResult.failed === 0 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <p className={`text-sm font-medium mb-1 ${
                    bulkDeleteResult.failed === 0 ? 'text-green-800' : 'text-yellow-800'
                  }`}>
                    {bulkDeleteResult.failed === 0 
                      ? `✅ Successfully deleted ${bulkDeleteResult.deleted} session${bulkDeleteResult.deleted !== 1 ? 's' : ''}`
                      : `⚠️ Deleted ${bulkDeleteResult.deleted} session${bulkDeleteResult.deleted !== 1 ? 's' : ''}, ${bulkDeleteResult.failed} failed`
                    }
                  </p>
                  {bulkDeleteResult.errors.length > 0 && (
                    <ul className="text-xs text-yellow-700 list-disc list-inside mt-1">
                      {bulkDeleteResult.errors.slice(0, 3).map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                      {bulkDeleteResult.errors.length > 3 && (
                        <li>...and {bulkDeleteResult.errors.length - 3} more errors</li>
                      )}
                    </ul>
                  )}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={handleBulkDeleteCancel}
                  disabled={isBulkDeleting}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDeleteConfirm}
                  disabled={isBulkDeleting || (bulkDeleteResult !== null && bulkDeleteResult.failed === 0)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isBulkDeleting ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Deleting...
                    </>
                  ) : bulkDeleteResult && bulkDeleteResult.failed === 0 ? (
                    'Done'
                  ) : (
                    'Delete Sessions'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmSessionId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Delete Exam Session
              </h3>
              
              <p className="text-sm text-gray-600 text-center mb-4">
                Are you sure you want to delete this exam session? This action cannot be undone.
              </p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-yellow-800 font-medium mb-1">This will permanently delete:</p>
                <ul className="text-xs text-yellow-700 list-disc list-inside space-y-1">
                  <li>Exam session record</li>
                  <li>All exam responses</li>
                  <li>Exam results</li>
                  <li>Session questions</li>
                  <li>Security violation logs</li>
                </ul>
              </div>

              {deleteError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-800">{deleteError}</p>
                </div>
              )}

              {deleteSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-green-800">Exam session deleted successfully!</p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSession}
                  disabled={isDeleting || deleteSuccess}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isDeleting ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Deleting...
                    </>
                  ) : deleteSuccess ? (
                    'Deleted!'
                  ) : (
                    'Delete Session'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ExamSessionsPage;
