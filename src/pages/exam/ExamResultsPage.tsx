import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  Download, 
  TrendingUp, 
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  BarChart3,
  Filter,
  Search
} from 'lucide-react';

interface ExamResult {
  id: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedQuestions: number;
  technicalScore?: number;
  aptitudeScore?: number;
  timeTakenMinutes: number;
  evaluationStatus: 'pending' | 'passed' | 'failed';
  completedAt: string;
  examSessionId: string;
}

const ExamResultsPage: React.FC = () => {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedScoreRange, setSelectedScoreRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');

  useEffect(() => {
    // TODO: Fetch exam results from backend
    setTimeout(() => {
      setResults([
        {
          id: '1',
          candidateName: 'John Doe',
          candidateEmail: 'john.doe@email.com',
          jobTitle: 'Frontend Developer',
          totalScore: 12,
          maxScore: 15,
          percentage: 80,
          correctAnswers: 12,
          wrongAnswers: 2,
          skippedQuestions: 1,
          technicalScore: 8,
          aptitudeScore: 4,
          timeTakenMinutes: 25,
          evaluationStatus: 'passed',
          completedAt: '2024-01-15T10:25:00Z',
          examSessionId: 'session-1'
        },
        {
          id: '2',
          candidateName: 'Jane Smith',
          candidateEmail: 'jane.smith@email.com',
          jobTitle: 'Backend Developer',
          totalScore: 9,
          maxScore: 15,
          percentage: 60,
          correctAnswers: 9,
          wrongAnswers: 5,
          skippedQuestions: 1,
          technicalScore: 6,
          aptitudeScore: 3,
          timeTakenMinutes: 28,
          evaluationStatus: 'failed',
          completedAt: '2024-01-15T11:28:00Z',
          examSessionId: 'session-2'
        },
        {
          id: '3',
          candidateName: 'Mike Johnson',
          candidateEmail: 'mike.johnson@email.com',
          jobTitle: 'Full Stack Developer',
          totalScore: 14,
          maxScore: 15,
          percentage: 93.3,
          correctAnswers: 14,
          wrongAnswers: 1,
          skippedQuestions: 0,
          technicalScore: 10,
          aptitudeScore: 4,
          timeTakenMinutes: 22,
          evaluationStatus: 'passed',
          completedAt: '2024-01-15T09:37:00Z',
          examSessionId: 'session-3'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredResults = results.filter(result => {
    const matchesSearch = 
      result.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.candidateEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || result.evaluationStatus === selectedStatus;
    
    let matchesScoreRange = true;
    if (selectedScoreRange !== 'all') {
      const percentage = result.percentage;
      switch (selectedScoreRange) {
        case 'excellent': matchesScoreRange = percentage >= 90; break;
        case 'good': matchesScoreRange = percentage >= 70 && percentage < 90; break;
        case 'average': matchesScoreRange = percentage >= 50 && percentage < 70; break;
        case 'poor': matchesScoreRange = percentage < 50; break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesScoreRange;
  });

  const sortedResults = [...filteredResults].sort((a, b) => {
    switch (sortBy) {
      case 'score': return b.percentage - a.percentage;
      case 'name': return a.candidateName.localeCompare(b.candidateName);
      case 'date': return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
      default: return 0;
    }
  });

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

  // Calculate statistics
  const totalResults = results.length;
  const passedResults = results.filter(r => r.evaluationStatus === 'passed').length;
  const failedResults = results.filter(r => r.evaluationStatus === 'failed').length;
  const averageScore = results.length > 0 ? results.reduce((sum, r) => sum + r.percentage, 0) / results.length : 0;

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
        <button className="bg-ai-teal text-white px-4 py-2 rounded-lg hover:bg-ai-teal/90 transition-colors flex items-center space-x-2">
          <Download className="h-4 w-4" />
          <span>Export Results</span>
        </button>
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
              {sortedResults.map((result) => (
                <tr key={result.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {result.candidateName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {result.candidateEmail}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{result.jobTitle}</div>
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
                    {result.timeTakenMinutes} min
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
                    {formatDate(result.completedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-ai-teal hover:text-ai-teal/80">
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {sortedResults.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No exam results found</h3>
          <p className="text-gray-600">Try adjusting your filters or wait for exam sessions to complete</p>
        </div>
      )}
    </div>
  );
};

export default ExamResultsPage;
