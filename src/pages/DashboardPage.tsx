import React from 'react';
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Mic,
  Headphones
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const DashboardPage: React.FC = () => {
  const stats = [
    {
      title: 'Total Candidates',
      value: '1,234',
      change: '+12%',
      changeType: 'positive' as const,
      icon: Users,
    },
    {
      title: 'Interviews Today',
      value: '24',
      change: '+8%',
      changeType: 'positive' as const,
      icon: Calendar,
    },
    {
      title: 'Completed Interviews',
      value: '156',
      change: '+23%',
      changeType: 'positive' as const,
      icon: CheckCircle,
    },
    {
      title: 'Pending Reviews',
      value: '12',
      change: '-5%',
      changeType: 'negative' as const,
      icon: Clock,
    },
  ];

  const recentInterviews = [
    {
      id: 1,
      candidate: 'John Smith',
      position: 'Senior Developer',
      status: 'completed',
      score: 85,
      time: '2 hours ago',
    },
    {
      id: 2,
      candidate: 'Sarah Johnson',
      position: 'Product Manager',
      status: 'in_progress',
      score: null,
      time: '30 minutes ago',
    },
    {
      id: 3,
      candidate: 'Mike Chen',
      position: 'UX Designer',
      status: 'scheduled',
      score: null,
      time: 'Tomorrow 2:00 PM',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ai-teal">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your interviews.</p>
        </div>
        <Button variant="primary">
          <Mic className="h-4 w-4 mr-2" />
          Start New Interview
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
                    stat.changeType === 'positive' ? 'text-ai-teal' : 'text-ai-coral'
                  }`}>
                    <TrendingUp className="inline h-3 w-3 mr-1" />
                    {stat.change} from last month
                  </p>
                </div>
                <div className="p-3 bg-ai-teal/10 rounded-lg">
                  <Icon className="h-6 w-6 text-ai-teal" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Interviews */}
        <div className="lg:col-span-2">
          <Card title="Recent Interviews">
            <div className="space-y-4">
              {recentInterviews.map((interview) => (
                <div key={interview.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {interview.candidate.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{interview.candidate}</p>
                      <p className="text-sm text-gray-600">{interview.position}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      interview.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : interview.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {interview.status.replace('_', ' ')}
                    </div>
                    {interview.score && (
                      <p className="text-sm text-gray-600 mt-1">Score: {interview.score}%</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">{interview.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card title="Quick Actions">
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Add New Candidate
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Interview
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <CheckCircle className="h-4 w-4 mr-2" />
                Review Results
              </Button>
            </div>
          </Card>

          {/* Audio Status */}
          <Card title="Audio Status">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mic className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Microphone</span>
                </div>
                <span className="text-sm text-green-600 font-medium">Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Headphones className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Speaker</span>
                </div>
                <span className="text-sm text-green-600 font-medium">Connected</span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <Button variant="ghost" size="sm" className="w-full">
                  Test Audio
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
