import React from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { BarChart3, TrendingUp, Users, Calendar, CheckCircle, Clock } from 'lucide-react';

const ReportsPage: React.FC = () => {
  const stats = [
    {
      title: 'Total Interviews',
      value: '1,234',
      change: '+12%',
      changeType: 'positive' as const,
      icon: Calendar,
    },
    {
      title: 'Completed Interviews',
      value: '1,156',
      change: '+8%',
      changeType: 'positive' as const,
      icon: CheckCircle,
    },
    {
      title: 'Pending Reviews',
      value: '78',
      change: '-5%',
      changeType: 'negative' as const,
      icon: Clock,
    },
    {
      title: 'Average Score',
      value: '85%',
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
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">John Smith {item}</p>
                  <p className="text-sm text-gray-600">Senior Developer • Completed 2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-lg font-bold text-gray-900">85%</span>
                <Button variant="ghost" size="sm">
                  View Report
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ReportsPage;
