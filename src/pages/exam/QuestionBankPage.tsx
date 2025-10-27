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
  RefreshCw
} from 'lucide-react';
import { ExamQuestion, QuestionFilter } from '../../types';
import { questionService } from '../../services/questionService';
import { JobDescriptionsService } from '../../services/jobDescriptions';
import { JobDescription } from '../../types';
import CreateQuestionModal from '../../components/exam/CreateQuestionModal';
import GenerateQuestionModal from '../../components/exam/GenerateQuestionModal';

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

  // Filters
  const [filters, setFilters] = useState<QuestionFilter>({
    search: '',
    category: '',
    difficulty: '',
    status: '',
    job_description_id: '',
    limit: 50,
    offset: 0
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load questions with filters
      const questionFilter = {
        ...filters,
        offset: (currentPage - 1) * (filters.limit || 50)
      };
      
      const questionsResult = await questionService.getQuestions(questionFilter);
      if (questionsResult.success && questionsResult.data) {
        setQuestions(questionsResult.data);
        setTotalPages(Math.ceil(questionsResult.data.length / (filters.limit || 50)));
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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between h-auto sm:h-16 py-4 sm:py-0 space-y-3 sm:space-y-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Question Bank</h1>
              <p className="text-xs sm:text-sm text-gray-600">Manage and organize exam questions</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setShowGenerateModal(true)}
                className="flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Generate with AI</span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Add Question</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
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
                    className="flex items-center space-x-1 px-2 sm:px-3 py-1 bg-green-600 text-white rounded text-xs sm:text-sm hover:bg-green-700"
                  >
                    <CheckCircle className="w-3 h-3" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleBulkAction('reject')}
                    className="flex items-center space-x-1 px-2 sm:px-3 py-1 bg-red-600 text-white rounded text-xs sm:text-sm hover:bg-red-700"
                  >
                    <XCircle className="w-3 h-3" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="flex items-center space-x-1 px-2 sm:px-3 py-1 bg-gray-600 text-white rounded text-xs sm:text-sm hover:bg-gray-700"
                  >
                    <Trash2 className="w-3 h-3" />
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedQuestions.size === questions.length && questions.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Question
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creator
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {questions.map((question) => (
                  <tr key={question.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <input
                        type="checkbox"
                        checked={selectedQuestions.has(question.id)}
                        onChange={(e) => handleQuestionSelect(question.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="max-w-xs">
                        <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                          {question.question_text}
                        </div>
                        <div className="text-xs text-gray-500">
                          {question.question_type.toUpperCase()} • {question.time_limit_seconds}s
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${getCategoryColor(question.question_category)}`}>
                        {question.question_category}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${getDifficultyColor(question.difficulty_level)}`}>
                        {question.difficulty_level}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${getStatusColor(question.status)}`}>
                        {question.status}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <span className="text-xs sm:text-sm text-gray-900">
                        {question.created_by === 'ai' ? 'AI' : 'HR'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <span className="text-xs sm:text-sm font-medium text-gray-900">
                        {question.points}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center space-x-1 sm:space-x-2">
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-3 sm:px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div className="text-xs sm:text-sm text-gray-700">
                  Showing page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
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
    </div>
  );
};

export default QuestionBankPage;