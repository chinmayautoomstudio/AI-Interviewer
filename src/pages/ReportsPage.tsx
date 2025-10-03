import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { BarChart3, TrendingUp, Users, Calendar, CheckCircle, Clock, Eye } from 'lucide-react';
import { InterviewSystemService } from '../services/interviewSystem';

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load statistics and reports in parallel
      const [statsResult, reportsResult] = await Promise.all([
        InterviewSystemService.getInterviewStatistics(),
        InterviewSystemService.getAllInterviewReports()
      ]);

      if (statsResult.error) {
        setError(statsResult.error);
      } else {
        setStatistics(statsResult.data);
      }

      if (reportsResult.error) {
        setError(reportsResult.error);
      } else {
        setReports(reportsResult.data);
      }
    } catch (error) {
      console.error('Error loading reports data:', error);
      setError('Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'suitable': return 'text-green-600 bg-green-100';
      case 'not_suitable': return 'text-red-600 bg-red-100';
      case 'conditional': return 'text-yellow-600 bg-yellow-100';
      case 'needs_review': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleViewReport = (reportId: string) => {
    navigate(`/reports/${reportId}`);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
          <Button 
            variant="primary" 
            onClick={loadReportsData}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Interviews',
      value: statistics?.totalInterviews?.toString() || '0',
      change: '+12%',
      changeType: 'positive' as const,
      icon: Calendar,
    },
    {
      title: 'Completed Interviews',
      value: statistics?.completedInterviews?.toString() || '0',
      change: '+8%',
      changeType: 'positive' as const,
      icon: CheckCircle,
    },
    {
      title: 'Pending Reviews',
      value: statistics?.pendingReviews?.toString() || '0',
      change: '-5%',
      changeType: 'negative' as const,
      icon: Clock,
    },
    {
      title: 'Average Score',
      value: `${statistics?.averageScore || 0}%`,
      change: '+3%',
      changeType: 'positive' as const,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive insights into your interview process</p>
        </div>
        <Button variant="primary">
          <BarChart3 className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className={`text-sm ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendingUp className="inline h-3 w-3 mr-1" />
                    {stat.change} from last month
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Interview Completion Rate">
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Chart visualization would go here</p>
            </div>
          </div>
        </Card>

        <Card title="Score Distribution">
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Score distribution chart would go here</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Reports */}
      <Card title="Recent Interview Reports">
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No interview reports found</p>
              <p className="text-sm text-gray-400">Reports will appear here after interviews are completed</p>
            </div>
          ) : (
            reports.map((report) => {
              const session = report.interview_sessions;
              const candidate = session?.candidates;
              const job = session?.job_descriptions;
              
              return (
                <div key={report.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {candidate ? candidate.name : 'Unknown Candidate'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {job?.title || 'Unknown Position'} • {formatDate(report.created_at)}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.suitability_status)}`}>
                          {report.suitability_status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-bold text-gray-900">{report.overall_score}%</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewReport(report.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Report
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
};

export default ReportsPage;
