import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  Users,
  Clock,
  Target,
  BarChart3,
  Activity
} from 'lucide-react';

interface AnalyticsData {
  totalExams: number;
  totalCandidates: number;
  averageScore: number;
  passRate: number;
  averageTimeTaken: number;
  topPerformingTopics: Array<{
    topic: string;
    averageScore: number;
    questionCount: number;
  }>;
  scoreDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  dailyStats: Array<{
    date: string;
    examsCompleted: number;
    averageScore: number;
  }>;
  difficultyBreakdown: Array<{
    difficulty: string;
    count: number;
    averageScore: number;
  }>;
}

const ExamAnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('30days');

  useEffect(() => {
    // TODO: Fetch analytics data from backend
    setTimeout(() => {
      setAnalytics({
        totalExams: 45,
        totalCandidates: 42,
        averageScore: 78.5,
        passRate: 73.3,
        averageTimeTaken: 24.5,
        topPerformingTopics: [
          { topic: 'JavaScript', averageScore: 85.2, questionCount: 15 },
          { topic: 'Data Structures', averageScore: 82.1, questionCount: 12 },
          { topic: 'React', averageScore: 79.8, questionCount: 10 },
          { topic: 'Logical Reasoning', averageScore: 76.5, questionCount: 8 },
          { topic: 'Python', averageScore: 74.3, questionCount: 9 }
        ],
        scoreDistribution: [
          { range: '90-100%', count: 8, percentage: 17.8 },
          { range: '80-89%', count: 12, percentage: 26.7 },
          { range: '70-79%', count: 13, percentage: 28.9 },
          { range: '60-69%', count: 7, percentage: 15.6 },
          { range: '50-59%', count: 3, percentage: 6.7 },
          { range: 'Below 50%', count: 2, percentage: 4.4 }
        ],
        dailyStats: [
          { date: '2024-01-10', examsCompleted: 3, averageScore: 82.1 },
          { date: '2024-01-11', examsCompleted: 5, averageScore: 79.3 },
          { date: '2024-01-12', examsCompleted: 2, averageScore: 85.7 },
          { date: '2024-01-13', examsCompleted: 4, averageScore: 76.8 },
          { date: '2024-01-14', examsCompleted: 6, averageScore: 81.2 },
          { date: '2024-01-15', examsCompleted: 3, averageScore: 78.9 }
        ],
        difficultyBreakdown: [
          { difficulty: 'Easy', count: 15, averageScore: 89.2 },
          { difficulty: 'Medium', count: 20, averageScore: 76.8 },
          { difficulty: 'Hard', count: 10, averageScore: 65.4 }
        ]
      });
      setLoading(false);
    }, 1000);
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exam Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive analysis of exam performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent"
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
            <option value="1year">Last year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Exams</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalExams}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.averageScore.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Target className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pass Rate</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.passRate.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Time</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.averageTimeTaken.toFixed(1)}m</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Score Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Distribution</h3>
          <div className="space-y-3">
            {analytics.scoreDistribution.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-ai-teal"></div>
                  <span className="text-sm font-medium text-gray-700">{item.range}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-ai-teal h-2 rounded-full" 
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Topics */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Topics</h3>
          <div className="space-y-4">
            {analytics.topPerformingTopics.map((topic, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{topic.topic}</p>
                  <p className="text-xs text-gray-500">{topic.questionCount} questions</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${getScoreColor(topic.averageScore)}`}>
                    {topic.averageScore.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Performance */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Performance Trend</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Exams Completed</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Average Score</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Performance</th>
              </tr>
            </thead>
            <tbody>
              {analytics.dailyStats.map((day, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {new Date(day.date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">{day.examsCompleted}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{day.averageScore.toFixed(1)}%</td>
                  <td className="py-3 px-4">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getScoreBgColor(day.averageScore)} ${getScoreColor(day.averageScore)}`}>
                      {day.averageScore >= 80 ? (
                        <>
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Excellent
                        </>
                      ) : day.averageScore >= 60 ? (
                        <>
                          <Activity className="h-3 w-3 mr-1" />
                          Good
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-3 w-3 mr-1" />
                          Needs Improvement
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Difficulty Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {analytics.difficultyBreakdown.map((difficulty, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 capitalize">{difficulty.difficulty}</h4>
              <div className={`p-2 rounded-full ${getScoreBgColor(difficulty.averageScore)}`}>
                <BarChart3 className={`h-5 w-5 ${getScoreColor(difficulty.averageScore)}`} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Questions</span>
                <span className="text-sm font-medium text-gray-900">{difficulty.count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Average Score</span>
                <span className={`text-sm font-bold ${getScoreColor(difficulty.averageScore)}`}>
                  {difficulty.averageScore.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExamAnalyticsPage;
