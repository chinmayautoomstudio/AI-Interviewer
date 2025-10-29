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
  Globe
} from 'lucide-react';
import { examResultsService, ExamResultWithDetails, ExamResultsFilter, ExamResultsStats } from '../../services/examResultsService';
import ExamResultDetailsModal from '../../components/exam/ExamResultDetailsModal';
import { ExamReportWorkflowService } from '../../services/examReportWorkflowService';

const ExamResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<ExamResultWithDetails[]>([]);
  const [stats, setStats] = useState<ExamResultsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedScoreRange, setSelectedScoreRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [evaluatingSessions, setEvaluatingSessions] = useState<Set<string>>(new Set());
  const [generatingReports, setGeneratingReports] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      const filter: ExamResultsFilter = {
        search: searchTerm || undefined,
        status: selectedStatus === 'all' ? undefined : selectedStatus as any,
        scoreRange: selectedScoreRange === 'all' ? undefined : selectedScoreRange as any,
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
  }, [searchTerm, selectedStatus, selectedScoreRange, sortBy]);

  useEffect(() => {
    loadData();
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
      const filter: ExamResultsFilter = {
        search: searchTerm || undefined,
        status: selectedStatus === 'all' ? undefined : selectedStatus as any,
        scoreRange: selectedScoreRange === 'all' ? undefined : selectedScoreRange as any,
        sortBy: sortBy as any,
        sortOrder: 'desc'
      };

      const response = await examResultsService.exportExamResults(filter);
      if (response.success && response.data) {
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `exam-results-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting results:', error);
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

  // Use real statistics from the service
  const totalResults = stats?.totalResults || 0;
  const passedResults = stats?.passedResults || 0;
  const failedResults = stats?.failedResults || 0;
  const averageScore = stats?.averageScore || 0;

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
              onClick={handleExportResults}
              className="bg-ai-teal text-white px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg hover:bg-ai-teal/90 transition-colors flex items-center justify-center space-x-1 sm:space-x-2 text-sm min-h-[44px] sm:min-h-0"
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Export Results</span>
              <span className="sm:hidden">Export</span>
            </button>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
              onChange={(e) => setSelectedStatus(e.target.value)}
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
              onChange={(e) => setSelectedScoreRange(e.target.value)}
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
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent text-sm"
            >
              <option value="date">Date</option>
              <option value="score">Score</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Exam Results</h2>
        </div>
        
        <div className="overflow-x-auto -mx-3 sm:-mx-4 lg:-mx-8">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
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
              {results.map((result) => (
                <tr key={result.id} className="hover:bg-gray-50">
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
