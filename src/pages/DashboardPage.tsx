import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  FileText
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import AdvancedAddJobDescriptionModal from '../components/modals/AdvancedAddJobDescriptionModal';
import AdvancedAddCandidateModal from '../components/modals/AdvancedAddCandidateModal';
import { InterviewSystemService } from '../services/interviewSystem';
import { getCandidates } from '../services/candidates';
import { getJobDescriptions } from '../services/jobDescriptions';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState({
    totalCandidates: 0,
    totalJobDescriptions: 0,
    totalInterviews: 0,
    completedInterviews: 0,
    pendingReviews: 0,
    interviewsToday: 0,
    averageScore: 0
  });
  const [recentInterviews, setRecentInterviews] = useState<any[]>([]);

  // Modal states
  const [isAddJobModalOpen, setIsAddJobModalOpen] = useState(false);
  const [isAddCandidateModalOpen, setIsAddCandidateModalOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel
      const [candidatesResult, jobDescriptionsResult, interviewStatsResult, reportsResult] = await Promise.all([
        getCandidates(),
        getJobDescriptions(),
        InterviewSystemService.getInterviewStatistics(),
        InterviewSystemService.getAllInterviewReports()
      ]);

      // Calculate interviews today (interviews created today)
      const today = new Date().toISOString().split('T')[0];
      const { supabase } = await import('../services/supabase');
      const { count: todayInterviews } = await supabase
        .from('interview_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lte('created_at', `${today}T23:59:59.999Z`);

      setDashboardData({
        totalCandidates: candidatesResult.length,
        totalJobDescriptions: jobDescriptionsResult.length,
        totalInterviews: interviewStatsResult.data?.totalInterviews || 0,
        completedInterviews: interviewStatsResult.data?.completedInterviews || 0,
        pendingReviews: interviewStatsResult.data?.pendingReviews || 0,
        interviewsToday: todayInterviews || 0,
        averageScore: interviewStatsResult.data?.averageScore || 0
      });

      // Get recent interview reports (last 5)
      if (reportsResult.data && reportsResult.data.length > 0) {
        const recent = reportsResult.data
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);
        
        
        setRecentInterviews(recent);
      }

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: 'Total Candidates',
      value: dashboardData.totalCandidates.toLocaleString(),
      change: '+12%',
      changeType: 'positive' as const,
      icon: Users,
    },
    {
      title: 'Interviews Today',
      value: dashboardData.interviewsToday.toString(),
      change: '+8%',
      changeType: 'positive' as const,
      icon: Calendar,
    },
    {
      title: 'Completed Interviews',
      value: dashboardData.completedInterviews.toString(),
      change: '+23%',
      changeType: 'positive' as const,
      icon: CheckCircle,
    },
    {
      title: 'Pending Reviews',
      value: dashboardData.pendingReviews.toString(),
      change: '-5%',
      changeType: 'negative' as const,
      icon: Clock,
    },
  ];

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-job':
        setIsAddJobModalOpen(true);
        break;
      case 'add-candidate':
        setIsAddCandidateModalOpen(true);
        break;
      case 'schedule-interview':
        navigate('/admin-interview-test');
        break;
      case 'review-results':
        navigate('/reports');
        break;
      default:
        break;
    }
  };

  const handleModalSuccess = () => {
    // Refresh dashboard data when modals complete successfully
    loadDashboardData();
  };


  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'suitable': return 'bg-green-100 text-green-800';
      case 'not_suitable': return 'bg-red-100 text-red-800';
      case 'conditional': return 'bg-yellow-100 text-yellow-800';
      case 'needs_review': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-ai-coral/10 border border-ai-coral/20 rounded-lg p-4">
          <p className="text-ai-coral-dark text-sm sm:text-base">Error: {error}</p>
          <Button 
            variant="primary" 
            onClick={loadDashboardData}
            className="mt-2 text-sm sm:text-base"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-ai-teal">Dashboard</h1>
        <p className="text-xs sm:text-sm lg:text-base text-gray-600">Welcome back! Here's what's happening with your interviews.</p>
      </div>

      {/* Middle Section - Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {/* Left Side - Quick Actions */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <Card title="Quick Actions">
            <div className="space-y-2 sm:space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start text-xs sm:text-sm lg:text-base py-2 sm:py-3"
                onClick={() => handleQuickAction('add-job')}
              >
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                <span className="truncate">Add New Job Description</span>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-xs sm:text-sm lg:text-base py-2 sm:py-3"
                onClick={() => handleQuickAction('add-candidate')}
              >
                <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                <span className="truncate">Add New Candidate</span>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-xs sm:text-sm lg:text-base py-2 sm:py-3"
                onClick={() => handleQuickAction('schedule-interview')}
              >
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                <span className="truncate">Schedule Interview</span>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-xs sm:text-sm lg:text-base py-2 sm:py-3"
                onClick={() => handleQuickAction('review-results')}
              >
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                <span className="truncate">Review Results</span>
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Side - Stats Grid */}
        <div className="lg:col-span-2 order-1 lg:order-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title} className="p-2 sm:p-3 lg:p-4">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-600 truncate">{stat.title}</p>
                      <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">{stat.value}</p>
                      <p className={`text-xs ${
                        stat.changeType === 'positive' ? 'text-ai-teal' : 'text-ai-coral'
                      }`}>
                        <TrendingUp className="inline h-3 w-3 mr-1" />
                        {stat.change}
                      </p>
                    </div>
                    <div className="p-1.5 sm:p-2 bg-ai-teal/10 rounded-lg flex-shrink-0 ml-2">
                      <Icon className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-ai-teal" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Interview Reports - Full width */}
      <div>
        <Card title="Recent Interview Reports">
          <div className="space-y-2 sm:space-y-3 lg:space-y-4">
            {recentInterviews.length > 0 ? (
              recentInterviews.map((report) => (
                <div key={report.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 lg:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-2 sm:gap-3 lg:gap-0">
                  <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 min-w-0 flex-1">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-ai-teal to-ai-teal-light rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-white">
                        {report.interview_sessions?.candidates?.name ? 
                          report.interview_sessions.candidates.name.split(' ').map((n: string) => n[0]).join('') : 
                          'N/A'
                        }
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-xs sm:text-sm lg:text-base truncate">{report.interview_sessions?.candidates?.name || 'Unknown Candidate'}</p>
                      <p className="text-xs text-gray-600 truncate">{report.interview_sessions?.job_descriptions?.title || 'Unknown Position'}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 mt-1">
                        <span className="text-xs text-gray-500">
                          <FileText className="h-3 w-3 inline mr-1" />
                          Report #{report.id.slice(-8)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(report.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <div className="text-left sm:text-right">
                      <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.suitability_status)}`}>
                        {report.suitability_status ? report.suitability_status.replace('_', ' ') : 'Unknown'}
                      </div>
                      {report.overall_score && (
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 mt-1">
                          {report.overall_score}/10
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/reports/${report.id}`)}
                      className="text-ai-teal border-ai-teal hover:bg-ai-teal hover:text-white text-xs w-full sm:w-auto py-1.5 sm:py-2"
                    >
                      View Report
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 sm:py-6 lg:py-8 text-gray-500">
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 lg:h-12 lg:w-12 mx-auto mb-2 sm:mb-3 lg:mb-4 text-gray-300" />
                <p className="text-xs sm:text-sm lg:text-base">No interview reports found</p>
                <p className="text-xs sm:text-sm">Complete some interviews to see reports here</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Advanced Add Job Description Modal */}
      <AdvancedAddJobDescriptionModal
        isOpen={isAddJobModalOpen}
        onClose={() => setIsAddJobModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      {/* Advanced Add Candidate Modal */}
      <AdvancedAddCandidateModal
        isOpen={isAddCandidateModalOpen}
        onClose={() => setIsAddCandidateModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default DashboardPage;
