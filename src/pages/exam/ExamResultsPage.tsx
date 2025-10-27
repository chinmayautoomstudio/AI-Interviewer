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
  FileText
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
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exam Results</h1>
          <p className="text-gray-600 mt-1">View and analyze candidate exam performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleExportResults}
            className="bg-ai-teal text-white px-4 py-2 rounded-lg hover:bg-ai-teal/90 transition-colors flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export Results</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Results</p>
              <p className="text-2xl font-bold text-gray-900">{totalResults}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Passed</p>
              <p className="text-2xl font-bold text-green-600">{passedResults}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">{failedResults}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">{averageScore.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Score Range</label>
            <select
              value={selectedScoreRange}
              onChange={(e) => setSelectedScoreRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent"
            >
              <option value="all">All Scores</option>
              <option value="excellent">Excellent (90%+)</option>
              <option value="good">Good (70-89%)</option>
              <option value="average">Average (50-69%)</option>
              <option value="poor">Poor (&lt;50%)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent"
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
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Exam Results</h2>
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
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Breakdown
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time Taken
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((result) => (
                <tr key={result.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {result.candidate?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {result.candidate?.email || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{result.jobDescription?.title || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className={`font-bold ${getScoreColor(result.percentage)}`}>
                        {result.percentage.toFixed(1)}%
                      </div>
                      <div className="text-gray-500">
                        {result.totalScore}/{result.maxScore}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div>✓ {result.correctAnswers} correct</div>
                      <div>✗ {result.wrongAnswers} wrong</div>
                      <div>⏭ {result.skippedQuestions} skipped</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {result.timeTakenMinutes || 0} min
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(result.evaluationStatus)}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(result.evaluationStatus)}`}>
                        {getStatusText(result.evaluationStatus)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(result.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleViewDetails(result.id)}
                        className="text-ai-teal hover:text-ai-teal/80"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleGenerateReport(result.examSessionId)}
                        className="text-green-600 hover:text-green-800"
                        title="Generate Report"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleGenerateComprehensiveReport(result.examSessionId)}
                        className="text-purple-600 hover:text-purple-800"
                        title="Generate Comprehensive Report"
                        disabled={generatingReports.has(result.examSessionId)}
                      >
                        {generatingReports.has(result.examSessionId) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Brain className="h-4 w-4" />
                        )}
                      </button>
                      <button 
                        onClick={() => handleTriggerTextEvaluation(result.examSessionId)}
                        disabled={evaluatingSessions.has(result.examSessionId)}
                        className="text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                        title="Trigger Text Evaluation"
                      >
                        {evaluatingSessions.has(result.examSessionId) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Brain className="h-4 w-4" />
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
  );
};

export default ExamResultsPage;
