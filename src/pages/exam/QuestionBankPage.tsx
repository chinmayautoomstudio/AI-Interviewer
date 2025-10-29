// Enhanced Question Bank Page
// Comprehensive question management with filtering, search, and bulk operations

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Zap,
  RefreshCw,
  Eye,
  X
} from 'lucide-react';
import { ExamQuestion, QuestionFilter } from '../../types';
import { questionService } from '../../services/questionService';
import { JobDescriptionsService } from '../../services/jobDescriptions';
import { JobDescription } from '../../types';
import CreateQuestionModal from '../../components/exam/CreateQuestionModal';
import GenerateQuestionModal from '../../components/exam/GenerateQuestionModal';
import { getButtonClass, getIconClass } from '../../styles/buttonStyles';

interface QuestionStats {
  total: number;
  by_category: {
    technical: number;
    aptitude: number;
  };
  by_difficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  by_status: {
    draft: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  by_creator: {
    hr: number;
    ai: number;
  };
}

const QuestionBankPage: React.FC = () => {
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<QuestionStats | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Filters and pagination
  const [filters, setFilters] = useState<QuestionFilter>({
    search: '',
    category: '',
    difficulty: '',
    status: '',
    job_description_id: '',
    limit: 20, // Reduced page size for better performance
    offset: 0
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showQuestionDetailsModal, setShowQuestionDetailsModal] = useState(false);
  const [selectedQuestionDetails, setSelectedQuestionDetails] = useState<ExamQuestion | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load questions with filters
      const questionFilter = {
        ...filters,
        offset: (currentPage - 1) * (filters.limit || 20)
      };
      
      const questionsResult = await questionService.getQuestions(questionFilter);
      if (questionsResult.success && questionsResult.data) {
        setQuestions(questionsResult.data.questions);
        setTotalCount(questionsResult.data.totalCount);
        setTotalPages(Math.ceil(questionsResult.data.totalCount / (filters.limit || 20)));
      }

      // Load job descriptions
      const jobDescriptionsResult = await JobDescriptionsService.getJobDescriptions();
      if (jobDescriptionsResult.data) {
        setJobDescriptions(jobDescriptionsResult.data);
      }

      // Load statistics
      const statsResult = await questionService.getQuestionStats();
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (key: keyof QuestionFilter, value: any) => {
    setFilters((prev: QuestionFilter) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSearch = (searchTerm: string) => {
    setFilters((prev: QuestionFilter) => ({ ...prev, search: searchTerm }));
    setCurrentPage(1);
  };

  const handleQuestionSelect = (questionId: string, selected: boolean) => {
    const newSelected = new Set(selectedQuestions);
    if (selected) {
      newSelected.add(questionId);
    } else {
      newSelected.delete(questionId);
    }
    setSelectedQuestions(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const allIds = new Set(questions.map(q => q.id));
      setSelectedQuestions(allIds);
    } else {
      setSelectedQuestions(new Set());
    }
    setShowBulkActions(selected);
  };

  const handleBulkAction = async (action: 'approve' | 'reject' | 'delete') => {
    const questionIds = Array.from(selectedQuestions);
    
    try {
      let result;
      switch (action) {
        case 'approve':
          result = await questionService.bulkUpdateStatus(questionIds, 'approved');
          break;
        case 'reject':
          result = await questionService.bulkUpdateStatus(questionIds, 'rejected');
          break;
        case 'delete':
          result = await questionService.bulkDelete(questionIds);
          break;
      }

      if (result?.success) {
        setSelectedQuestions(new Set());
        setShowBulkActions(false);
        await loadData();
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      const result = await questionService.deleteQuestion(questionId);
      if (result.success) {
        await loadData();
      }
    }
  };

  const handleViewQuestionDetails = (question: ExamQuestion) => {
    setSelectedQuestionDetails(question);
    setShowQuestionDetailsModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical': return 'bg-blue-100 text-blue-800';
      case 'aptitude': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading question bank...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="w-full max-w-full md:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between h-auto md:h-16 py-4 md:py-0 space-y-3 md:space-y-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Question Bank</h1>
              <p className="text-sm sm:text-base text-gray-600">Manage and organize exam questions</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button
                onClick={() => setShowGenerateModal(true)}
                className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold text-sm sm:text-base transition-all duration-200 shadow-md hover:shadow-lg min-w-[140px] sm:min-w-[160px]"
              >
                <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="whitespace-nowrap">Generate with AI</span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold text-sm sm:text-base transition-all duration-200 shadow-md hover:shadow-lg min-w-[140px] sm:min-w-[160px]"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="whitespace-nowrap">Add Question</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-full md:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 mb-6">
            <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4 lg:p-6">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs sm:text-sm text-gray-600">Total Questions</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4 lg:p-6">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">{stats.by_category.technical}</div>
              <div className="text-xs sm:text-sm text-gray-600">Technical</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4 lg:p-6">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">{stats.by_category.aptitude}</div>
              <div className="text-xs sm:text-sm text-gray-600">Aptitude</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4 lg:p-6">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">{stats.by_status.approved}</div>
              <div className="text-xs sm:text-sm text-gray-600">Approved</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4 lg:p-6">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-600">{stats.by_status.pending}</div>
              <div className="text-xs sm:text-sm text-gray-600">Pending</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 space-y-2 sm:space-y-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Filters</h3>
            <button
              onClick={loadData}
              className="flex items-center space-x-1 sm:space-x-2 text-gray-600 hover:text-gray-900 text-sm self-start sm:self-auto"
            >
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Refresh</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
            {/* Search */}
            <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
              <div className="relative">
                <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">All Categories</option>
                <option value="technical">Technical</option>
                <option value="aptitude">Aptitude</option>
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <select
                value={filters.difficulty}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Job Description Filter */}
            <div>
              <select
                value={filters.job_description_id}
                onChange={(e) => handleFilterChange('job_description_id', e.target.value)}
                className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">All Jobs</option>
                {jobDescriptions.map(job => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {showBulkActions && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <span className="text-xs sm:text-sm font-medium text-blue-900">
                  {selectedQuestions.size} question{selectedQuestions.size !== 1 ? 's' : ''} selected
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleBulkAction('approve')}
                    className={`${getButtonClass('small')} bg-green-600 text-white hover:bg-green-700`}
                  >
                    <CheckCircle className={getIconClass('small')} />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleBulkAction('reject')}
                    className={`${getButtonClass('small')} bg-red-600 text-white hover:bg-red-700`}
                  >
                    <XCircle className={getIconClass('small')} />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className={`${getButtonClass('small')} bg-gray-600 text-white hover:bg-gray-700`}
                  >
                    <Trash2 className={getIconClass('small')} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedQuestions(new Set());
                  setShowBulkActions(false);
                }}
                className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm self-start sm:self-auto"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Questions Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedQuestions.size === questions.length && questions.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Question
                  </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Category
                  </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Difficulty
                  </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Status
                  </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Creator
                  </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Points
                  </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {questions.map((question) => (
                  <tr key={question.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedQuestions.has(question.id)}
                        onChange={(e) => handleQuestionSelect(question.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="max-w-xs">
                        <button
                          onClick={() => handleViewQuestionDetails(question)}
                          className="text-left w-full hover:bg-gray-50 rounded p-1 -m-1"
                        >
                          <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                            {question.question_text}
                          </div>
                          <div className="text-xs text-gray-500">
                            {question.question_type.toUpperCase()} • {question.time_limit_seconds}s
                          </div>
                        </button>
                      </div>
                    </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${getCategoryColor(question.question_category)}`}>
                        {question.question_category}
                      </span>
                    </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${getDifficultyColor(question.difficulty_level)}`}>
                        {question.difficulty_level}
                      </span>
                    </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${getStatusColor(question.status)}`}>
                        {question.status}
                      </span>
                    </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className="text-xs sm:text-sm text-gray-900">
                        {question.created_by === 'ai' ? 'AI' : 'HR'}
                      </span>
                    </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className="text-xs sm:text-sm font-medium text-gray-900">
                        {question.points}
                      </span>
                    </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <button
                          onClick={() => handleViewQuestionDetails(question)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="View Details"
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(question.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
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
            {/* Mobile Select All */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedQuestions.size === questions.length && questions.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Select All ({questions.length})
                </span>
              </div>
              {showBulkActions && (
                <button
                  onClick={() => {
                    setSelectedQuestions(new Set());
                    setShowBulkActions(false);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Clear
                </button>
              )}
            </div>

            {questions.map((question) => (
              <div key={question.id} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm max-w-full overflow-hidden">
                {/* Header with Checkbox and Actions */}
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="flex items-start space-x-2 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedQuestions.has(question.id)}
                      onChange={(e) => handleQuestionSelect(question.id, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1 flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <button
                        onClick={() => handleViewQuestionDetails(question)}
                        className="text-left w-full hover:bg-gray-50 rounded p-1 -m-1"
                      >
                        <h3 className="text-sm font-medium text-gray-900 break-words leading-tight">
                          {question.question_text}
                        </h3>
                        <div className="text-xs text-gray-500 mt-1">
                          {question.question_type.toUpperCase()} • {question.time_limit_seconds}s
                        </div>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <button
                      onClick={() => handleViewQuestionDetails(question)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Question Details Grid */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs mb-3">
                  <div className="min-w-0">
                    <span className="text-gray-500">Category:</span>
                    <span className={`ml-1 inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${getCategoryColor(question.question_category)}`}>
                      {question.question_category}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-gray-500">Difficulty:</span>
                    <span className={`ml-1 inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${getDifficultyColor(question.difficulty_level)}`}>
                      {question.difficulty_level}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-gray-500">Status:</span>
                    <span className={`ml-1 inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(question.status)}`}>
                      {question.status}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-gray-500">Points:</span>
                    <span className="ml-1 font-medium text-gray-900">{question.points}</span>
                  </div>
                </div>
                
                {/* Creator and Additional Info */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    Created by: <span className="font-medium text-gray-900">{question.created_by === 'ai' ? 'AI' : 'HR'}</span>
                  </div>
                  <button 
                    onClick={() => handleViewQuestionDetails(question)}
                    className="text-blue-600 hover:text-blue-800 text-xs font-medium whitespace-nowrap"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {questions.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
              <p className="text-gray-500 mb-6">
                {Object.values(filters).some(v => v && v !== '') 
                  ? 'Try adjusting your filters or search terms.'
                  : 'Get started by creating your first question.'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Question
                </button>
                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Generate with AI
                </button>
              </div>
            </div>
          )}

          {/* Enhanced Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-3 sm:px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                {/* Results Info */}
                <div className="text-xs sm:text-sm text-gray-700">
                  Showing {((currentPage - 1) * (filters.limit || 20)) + 1} to {Math.min(currentPage * (filters.limit || 20), totalCount)} of {totalCount} questions
                </div>
                
                {/* Page Size Selector */}
                <div className="flex items-center space-x-2">
                  <label className="text-xs sm:text-sm text-gray-700">Show:</label>
                  <select
                    value={filters.limit || 20}
                    onChange={(e) => {
                      const newLimit = parseInt(e.target.value);
                      setFilters(prev => ({ ...prev, limit: newLimit }));
                      setCurrentPage(1);
                    }}
                    className="text-xs sm:text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-xs sm:text-sm text-gray-700">per page</span>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center space-x-1 sm:space-x-2">
                  {/* First Page */}
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className={`${getButtonClass('pagination')} ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                    title="First page"
                  >
                    ««
                  </button>
                  
                  {/* Previous Page */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`${getButtonClass('pagination')} ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                  >
                    Previous
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center space-x-1">
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
                          className={`${getButtonClass('pagination')} ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'hover:bg-gray-50'
                          }`}
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
                    className={`${getButtonClass('pagination')} ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                  >
                    Next
                  </button>

                  {/* Last Page */}
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`${getButtonClass('pagination')} ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                    title="Last page"
                  >
                    »»
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateQuestionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          loadData();
        }}
      />

      <GenerateQuestionModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onQuestionsGenerated={() => {
          setShowGenerateModal(false);
          loadData();
        }}
        jobDescriptions={jobDescriptions}
        loading={loading}
      />

      {/* Question Details Modal */}
      {showQuestionDetailsModal && selectedQuestionDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Question Details</h3>
              <button
                onClick={() => setShowQuestionDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Question Header */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">Type</div>
                  <div className="text-sm font-medium text-gray-900">
                    {selectedQuestionDetails.question_type.toUpperCase()}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">Category</div>
                  <div className="text-sm font-medium text-gray-900">
                    {selectedQuestionDetails.question_category}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">Difficulty</div>
                  <div className="text-sm font-medium text-gray-900">
                    {selectedQuestionDetails.difficulty_level}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">Points</div>
                  <div className="text-sm font-medium text-gray-900">
                    {selectedQuestionDetails.points}
                  </div>
                </div>
              </div>

              {/* Question Text */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Question</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                  <p className="text-sm sm:text-base text-gray-900">
                    {selectedQuestionDetails.question_text}
                  </p>
                </div>
              </div>

              {/* MCQ Options */}
              {selectedQuestionDetails.question_type === 'mcq' && selectedQuestionDetails.mcq_options && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Options</h4>
                  <div className="space-y-2">
                    {selectedQuestionDetails.mcq_options.map((option, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          option.option === selectedQuestionDetails.correct_answer
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            option.option === selectedQuestionDetails.correct_answer
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-300 text-gray-700'
                          }`}>
                            {option.option}
                          </span>
                          <span className="text-sm text-gray-900">{option.text}</span>
                          {option.option === selectedQuestionDetails.correct_answer && (
                            <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Correct Answer */}
              {selectedQuestionDetails.question_type === 'mcq' && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Correct Answer</h4>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {selectedQuestionDetails.correct_answer}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedQuestionDetails.mcq_options?.find(opt => opt.option === selectedQuestionDetails.correct_answer)?.text}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Answer Explanation */}
              {selectedQuestionDetails.answer_explanation && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Explanation</h4>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                    <p className="text-sm text-gray-900">
                      {selectedQuestionDetails.answer_explanation}
                    </p>
                  </div>
                </div>
              )}

              {/* Additional Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">Status</div>
                  <div className="text-sm font-medium text-gray-900">
                    {selectedQuestionDetails.status}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">Created By</div>
                  <div className="text-sm font-medium text-gray-900">
                    {selectedQuestionDetails.created_by === 'ai' ? 'AI' : 'HR'}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">Time Limit</div>
                  <div className="text-sm font-medium text-gray-900">
                    {selectedQuestionDetails.time_limit_seconds}s
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">Created</div>
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(selectedQuestionDetails.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end p-4 sm:p-6 border-t border-gray-200">
              <button
                onClick={() => setShowQuestionDetailsModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBankPage;