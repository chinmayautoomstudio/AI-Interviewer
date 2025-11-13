import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Eye, 
  Download, 
  CheckCircle,
  XCircle,
  Clock,
  Users,
  BarChart3,
  Search,
  RefreshCw,
  Brain,
  Loader2,
  FileText,
  Shield,
  Globe,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { examResultsService, ExamResultWithDetails, ExamResultsFilter, ExamResultsStats } from '../../services/examResultsService';
import ExamResultDetailsModal from '../../components/exam/ExamResultDetailsModal';
import { ExamReportWorkflowService } from '../../services/examReportWorkflowService';
import * as XLSX from 'xlsx';

const ExamResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<ExamResultWithDetails[]>([]);
  const [stats, setStats] = useState<ExamResultsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedScoreRange, setSelectedScoreRange] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [evaluatingSessions, setEvaluatingSessions] = useState<Set<string>>(new Set());
  const [generatingReports, setGeneratingReports] = useState<Set<string>>(new Set());
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Calculate date range filter inline to avoid dependency warning
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      let dateFrom: string | undefined;
      let dateTo: string | undefined;
      
      switch (dateRange) {
        case 'today': {
          const startOfToday = new Date(today);
          const endOfToday = new Date(today);
          endOfToday.setHours(23, 59, 59, 999);
          dateFrom = startOfToday.toISOString();
          dateTo = endOfToday.toISOString();
          break;
        }
        case 'thisWeek': {
          const dayOfWeek = now.getDay();
          const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
          const startOfWeek = new Date(now);
          startOfWeek.setDate(diff);
          startOfWeek.setHours(0, 0, 0, 0);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          endOfWeek.setHours(23, 59, 59, 999);
          dateFrom = startOfWeek.toISOString();
          dateTo = endOfWeek.toISOString();
          break;
        }
        case 'thisMonth': {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          startOfMonth.setHours(0, 0, 0, 0);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          endOfMonth.setHours(23, 59, 59, 999);
          dateFrom = startOfMonth.toISOString();
          dateTo = endOfMonth.toISOString();
          break;
        }
        case 'last7Days': {
          const sevenDaysAgo = new Date(now);
          sevenDaysAgo.setDate(now.getDate() - 7);
          sevenDaysAgo.setHours(0, 0, 0, 0);
          const endOfToday = new Date(now);
          endOfToday.setHours(23, 59, 59, 999);
          dateFrom = sevenDaysAgo.toISOString();
          dateTo = endOfToday.toISOString();
          break;
        }
        case 'last30Days': {
          const thirtyDaysAgo = new Date(now);
          thirtyDaysAgo.setDate(now.getDate() - 30);
          thirtyDaysAgo.setHours(0, 0, 0, 0);
          const endOfToday = new Date(now);
          endOfToday.setHours(23, 59, 59, 999);
          dateFrom = thirtyDaysAgo.toISOString();
          dateTo = endOfToday.toISOString();
          break;
        }
        case 'last90Days': {
          const ninetyDaysAgo = new Date(now);
          ninetyDaysAgo.setDate(now.getDate() - 90);
          ninetyDaysAgo.setHours(0, 0, 0, 0);
          const endOfToday = new Date(now);
          endOfToday.setHours(23, 59, 59, 999);
          dateFrom = ninetyDaysAgo.toISOString();
          dateTo = endOfToday.toISOString();
          break;
        }
        case 'all':
        default:
          // No date filter
          break;
      }
      
      const filter: ExamResultsFilter = {
        search: searchTerm || undefined,
        status: selectedStatus === 'all' ? undefined : selectedStatus as any,
        scoreRange: selectedScoreRange === 'all' ? undefined : selectedScoreRange as any,
        dateFrom,
        dateTo,
        sortBy: sortBy as any,
        sortOrder: 'desc'
      };

      // Load results and stats in parallel
      const [resultsResponse, statsResponse] = await Promise.all([
        examResultsService.getExamResults(filter),
        examResultsService.getExamResultsStats(filter)
      ]);

      if (resultsResponse.success && resultsResponse.data) {
        setResults(resultsResponse.data);
      }

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }
    } catch (error) {
      console.error('Error loading exam results:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedStatus, selectedScoreRange, dateRange, sortBy]);

  useEffect(() => {
    loadData();
    // Clear selection and reset page when filters change
    setSelectedCandidates(new Set());
    setCurrentPage(1);
  }, [loadData]);

  const handleViewDetails = (resultId: string) => {
    setSelectedResultId(resultId);
    setShowDetailsModal(true);
  };

  const handleTriggerTextEvaluation = async (sessionId: string) => {
    try {
      setEvaluatingSessions(prev => new Set(prev).add(sessionId));
      
      const { ExamService } = await import('../../services/examService');
      const examService = new ExamService();
      const result = await examService.triggerTextEvaluation(sessionId);
      
      if (result.success) {
        // Reload data to show updated results
        await loadData();
        alert(`Text evaluation completed successfully! ${result.evaluatedCount || 0} questions evaluated.`);
      } else {
        alert(`Text evaluation failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Error triggering text evaluation:', error);
      alert('Failed to trigger text evaluation');
    } finally {
      setEvaluatingSessions(prev => {
        const newSet = new Set(prev);
        newSet.delete(sessionId);
        return newSet;
      });
    }
  };

  const handleGenerateReport = (sessionId: string) => {
    navigate(`/exams/report/${sessionId}`);
  };

  const handleGenerateComprehensiveReport = async (sessionId: string) => {
    try {
      setGeneratingReports(prev => new Set(prev).add(sessionId));
      
      console.log('🚀 Generating comprehensive report for session:', sessionId);
      
      const result = await ExamReportWorkflowService.generateExamReport({
        session_id: sessionId,
        include_detailed_analysis: true,
        include_hiring_recommendation: true,
        include_skill_gaps: true,
        report_format: 'comprehensive'
      });
      
      if (result.success) {
        // Reload data to show updated results
        await loadData();
        alert(`Comprehensive report generated successfully! Hiring recommendation: ${result.hiring_recommendation} (${Math.round((result.confidence_level || 0) * 100)}% confidence)`);
      } else {
        alert(`Report generation failed: ${result.message || result.error}`);
      }
    } catch (error) {
      console.error('Error generating comprehensive report:', error);
      alert('Failed to generate comprehensive report');
    } finally {
      setGeneratingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(sessionId);
        return newSet;
      });
    }
  };

  const handleExportResults = async () => {
    try {
      // Filter results based on selection
      const resultsToExport = selectedCandidates.size > 0
        ? results.filter(result => selectedCandidates.has(result.id))
        : results;

      if (resultsToExport.length === 0) {
        alert('No results selected for export');
        return;
      }

      // Create CSV headers
      const headers = [
        'Candidate Name',
        'Candidate Email',
        'Job Title',
        'Total Score',
        'Max Score',
        'Percentage',
        'Correct Answers',
        'Wrong Answers',
        'Skipped Questions',
        'Time Taken (minutes)',
        'Evaluation Status',
        'Completed At'
      ];

      // Create CSV rows
      const rows = resultsToExport.map(result => [
        result.candidate?.name || '',
        result.candidate?.email || '',
        result.jobDescription?.title || '',
        result.totalScore.toString(),
        result.maxScore.toString(),
        result.percentage.toFixed(2),
        result.correctAnswers.toString(),
        result.wrongAnswers.toString(),
        result.skippedQuestions.toString(),
        (result.timeTakenMinutes || 0).toString(),
        getStatusText(result.evaluationStatus),
        formatDate(result.createdAt)
      ]);

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `exam-results-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting results:', error);
      alert('Failed to export to CSV. Please try again.');
    }
  };

  const exportToExcel = () => {
    try {
      // Filter results based on selection
      const resultsToExport = selectedCandidates.size > 0
        ? results.filter(result => selectedCandidates.has(result.id))
        : results;

      // Prepare data for Excel export using filtered results
      const excelData = resultsToExport.map((result) => ({
        'Candidate Name': result.candidate?.name || 'N/A',
        'Email': result.candidate?.email || 'N/A',
        'Phone': result.candidate?.phone || 'N/A',
        'Position': result.jobDescription?.title || 'N/A',
        'Department': result.jobDescription?.department || 'N/A',
        'Overall Score (%)': result.percentage.toFixed(2),
        'Points': `${result.totalScore}/${result.maxScore}`,
        'Correct Answers': result.correctAnswers,
        'Wrong Answers': result.wrongAnswers,
        'Skipped Questions': result.skippedQuestions,
        'Time Taken (minutes)': result.timeTakenMinutes || 0,
        'Status': getStatusText(result.evaluationStatus),
        'Completed At': formatDate(result.createdAt),
        'Session ID': result.examSessionId || 'N/A'
      }));

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Exam Results');

      // Set column widths for better readability
      const columnWidths = [
        { wch: 20 }, // Candidate Name
        { wch: 30 }, // Email
        { wch: 15 }, // Phone
        { wch: 25 }, // Position
        { wch: 15 }, // Department
        { wch: 15 }, // Overall Score (%)
        { wch: 12 }, // Points
        { wch: 15 }, // Correct Answers
        { wch: 15 }, // Wrong Answers
        { wch: 18 }, // Skipped Questions
        { wch: 18 }, // Time Taken
        { wch: 12 }, // Status
        { wch: 20 }, // Completed At
        { wch: 40 }  // Session ID
      ];
      worksheet['!cols'] = columnWidths;

      // Generate Excel file and download
      const fileName = `exam-results-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export to Excel. Please try again.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'passed': return 'Passed';
      case 'failed': return 'Failed';
      case 'pending': return 'Pending';
      default: return status;
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Selection handlers
  const handleSelectCandidate = (resultId: string) => {
    setSelectedCandidates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(resultId)) {
        newSet.delete(resultId);
      } else {
        newSet.add(resultId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    // Select all visible paginated results, not all filtered results
    if (isAllSelected()) {
      setSelectedCandidates(new Set());
    } else {
      const newSelection = new Set(selectedCandidates);
      paginatedResults.forEach(r => newSelection.add(r.id));
      setSelectedCandidates(newSelection);
    }
  };

  const isAllSelected = () => {
    return paginatedResults.length > 0 && paginatedResults.every(r => selectedCandidates.has(r.id));
  };

  const isIndeterminate = () => {
    const selectedInPage = paginatedResults.filter(r => selectedCandidates.has(r.id)).length;
    return selectedInPage > 0 && selectedInPage < paginatedResults.length;
  };

  // Use real statistics from the service
  const totalResults = stats?.totalResults || 0;
  const passedResults = stats?.passedResults || 0;
  const failedResults = stats?.failedResults || 0;
  const averageScore = stats?.averageScore || 0;

  // Calculate pagination values
  const totalPages = Math.ceil(results.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedResults = results.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="p-3 sm:p-4 lg:p-6">
        <div className="animate-pulse">
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/3 sm:w-1/4 mb-4 sm:mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border">
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-6 sm:h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
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
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-full md:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 md:mb-6 space-y-3 md:space-y-0">
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Exam Results</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">View and analyze candidate exam performance</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            {selectedCandidates.size > 0 && (
              <div className="text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                {selectedCandidates.size} candidate{selectedCandidates.size !== 1 ? 's' : ''} selected
              </div>
            )}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={loadData}
                className="flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2.5 sm:py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm min-h-[44px] sm:min-h-0"
              >
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Refresh</span>
                <span className="sm:hidden">Refresh</span>
              </button>
              <button
                onClick={exportToExcel}
                className="bg-green-600 text-white px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-1 sm:space-x-2 text-sm min-h-[44px] sm:min-h-0"
              >
                <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Export to Excel</span>
                <span className="sm:hidden">Excel</span>
              </button>
              <button
                onClick={handleExportResults}
                className="bg-ai-teal text-white px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg hover:bg-ai-teal/90 transition-colors flex items-center justify-center space-x-1 sm:space-x-2 text-sm min-h-[44px] sm:min-h-0"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Export to CSV</span>
                <span className="sm:hidden">CSV</span>
              </button>
            </div>
          </div>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Results</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalResults}</p>
            </div>
            <div className="p-2 sm:p-3 bg-blue-100 rounded-full">
              <Users className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Passed</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">{passedResults}</p>
            </div>
            <div className="p-2 sm:p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Failed</p>
              <p className="text-xl sm:text-2xl font-bold text-red-600">{failedResults}</p>
            </div>
            <div className="p-2 sm:p-3 bg-red-100 rounded-full">
              <XCircle className="h-4 w-4 sm:h-6 sm:w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{averageScore.toFixed(1)}%</p>
            </div>
            <div className="p-2 sm:p-3 bg-purple-100 rounded-full">
              <BarChart3 className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Search</label>
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
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent text-sm"
            >
              <option value="all">All Status</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Score Range</label>
            <select
              value={selectedScoreRange}
              onChange={(e) => {
                setSelectedScoreRange(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent text-sm"
            >
              <option value="all">All Scores</option>
              <option value="excellent">Excellent (90%+)</option>
              <option value="good">Good (70-89%)</option>
              <option value="average">Average (50-69%)</option>
              <option value="poor">Poor (&lt;50%)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent text-sm"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="thisWeek">This Week</option>
              <option value="thisMonth">This Month</option>
              <option value="last7Days">Last 7 Days</option>
              <option value="last30Days">Last 30 Days</option>
              <option value="last90Days">Last 90 Days</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent text-sm"
            >
              <option value="date">Date (Newest First)</option>
              <option value="score">Score (High to Low)</option>
              <option value="name">Name (A-Z)</option>
              <option value="time">Time Taken</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto -mx-3 sm:-mx-4 lg:-mx-8">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  <input
                    type="checkbox"
                    checked={isAllSelected()}
                    ref={(input) => {
                      if (input) input.indeterminate = isIndeterminate();
                    }}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-ai-teal focus:ring-ai-teal border-gray-300 rounded cursor-pointer"
                    title="Select all"
                  />
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Candidate
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Title
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Breakdown
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time Taken
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                  Security & IP
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-10 min-w-[140px] border-l border-gray-200">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedResults.map((result) => (
                <tr key={result.id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedCandidates.has(result.id)}
                      onChange={() => handleSelectCandidate(result.id)}
                      className="h-4 w-4 text-ai-teal focus:ring-ai-teal border-gray-300 rounded cursor-pointer"
                    />
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div>
                      <div className="text-xs sm:text-sm font-medium text-gray-900">
                        {result.candidate?.name || 'N/A'}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">
                        {result.candidate?.email || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="text-xs sm:text-sm text-gray-900">{result.jobDescription?.title || 'N/A'}</div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="text-xs sm:text-sm">
                      <div className={`font-bold ${getScoreColor(result.percentage)}`}>
                        {result.percentage.toFixed(1)}%
                      </div>
                      <div className="text-gray-500">
                        {result.totalScore}/{result.maxScore}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="text-xs sm:text-sm text-gray-900">
                      <div>✓ {result.correctAnswers} correct</div>
                      <div>✗ {result.wrongAnswers} wrong</div>
                      <div>⏭ {result.skippedQuestions} skipped</div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                    {result.timeTakenMinutes || 0} min
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      {getStatusIcon(result.evaluationStatus)}
                      <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${getStatusColor(result.evaluationStatus)}`}>
                        {getStatusText(result.evaluationStatus)}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                    {formatDate(result.createdAt)}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <div className="space-y-1 text-xs sm:text-sm">
                      {/* IP Address */}
                      {result.examSession?.ip_address && (
                        <div className="flex items-center space-x-1 text-gray-700">
                          <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                          <span className="font-mono truncate max-w-[120px] sm:max-w-none" title={result.examSession.ip_address}>
                            {result.examSession.ip_address}
                          </span>
                        </div>
                      )}
                      
                      {/* User Agent */}
                      {result.examSession?.user_agent && (
                        <div className="text-gray-600 truncate max-w-[150px] sm:max-w-[200px]" title={result.examSession.user_agent}>
                          {result.examSession.user_agent.length > 40 
                            ? result.examSession.user_agent.substring(0, 40) + '...'
                            : result.examSession.user_agent}
                        </div>
                      )}
                      
                      {/* Security Violations */}
                      {result.securityViolations && result.securityViolations.length > 0 && (
                        <div className="flex items-center space-x-2 flex-wrap gap-1">
                          <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600 flex-shrink-0" />
                          <span className="text-gray-700 font-medium">
                            {result.securityViolations.length} violation{result.securityViolations.length > 1 ? 's' : ''}
                          </span>
                          <div className="flex items-center space-x-1">
                            {result.securityViolations.filter((v: any) => v.severity === 'high').length > 0 && (
                              <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${getSeverityColor('high')}`}>
                                {result.securityViolations.filter((v: any) => v.severity === 'high').length} High
                              </span>
                            )}
                            {result.securityViolations.filter((v: any) => v.severity === 'medium').length > 0 && (
                              <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${getSeverityColor('medium')}`}>
                                {result.securityViolations.filter((v: any) => v.severity === 'medium').length} Med
                              </span>
                            )}
                            {result.securityViolations.filter((v: any) => v.severity === 'low').length > 0 && (
                              <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${getSeverityColor('low')}`}>
                                {result.securityViolations.filter((v: any) => v.severity === 'low').length} Low
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* No violations */}
                      {(!result.securityViolations || result.securityViolations.length === 0) && (
                        <div className="flex items-center space-x-1 text-green-600">
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>No violations</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium sticky right-0 bg-white z-10 hover:bg-gray-50 border-l border-gray-200">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <button 
                        onClick={() => handleViewDetails(result.id)}
                        className="text-ai-teal hover:text-ai-teal/80 p-1 rounded hover:bg-gray-100 transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                      <button 
                        onClick={() => handleGenerateReport(result.examSessionId)}
                        className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-gray-100 transition-colors"
                        title="Generate Report"
                      >
                        <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                      <button 
                        onClick={() => handleGenerateComprehensiveReport(result.examSessionId)}
                        className="text-purple-600 hover:text-purple-800 p-1 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Generate Comprehensive Report"
                        disabled={generatingReports.has(result.examSessionId)}
                      >
                        {generatingReports.has(result.examSessionId) ? (
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                        ) : (
                          <Brain className="h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                      </button>
                      <button 
                        onClick={() => handleTriggerTextEvaluation(result.examSessionId)}
                        disabled={evaluatingSessions.has(result.examSessionId)}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Trigger Text Evaluation"
                      >
                        {evaluatingSessions.has(result.examSessionId) ? (
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                        ) : (
                          <Brain className="h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        {/* Pagination Controls */}
        {results.length > 0 && (
          <div className="bg-white px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 gap-4 sm:gap-6">
              {/* Results Info */}
              <div className="text-xs sm:text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(endIndex, results.length)} of {results.length} result{results.length !== 1 ? 's' : ''}
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

      {results.length === 0 && !loading && (
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No exam results found</h3>
          <p className="text-gray-600">Try adjusting your filters or wait for exam sessions to complete</p>
        </div>
      )}

      {/* Exam Result Details Modal */}
      <ExamResultDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedResultId(null);
        }}
        resultId={selectedResultId}
      />

      </div>
    </div>
  );
};

export default ExamResultsPage;
