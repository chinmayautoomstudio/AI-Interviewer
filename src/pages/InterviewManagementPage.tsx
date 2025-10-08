import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  List, 
  Plus, 
  Filter, 
  Search, 
  Clock, 
  User, 
  Building, 
  MapPin, 
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  Pause
} from 'lucide-react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Interview, Candidate, JobDescription, AIAgent } from '../types';
import { InterviewsService } from '../services/interviews';
import { CandidatesService } from '../services/candidates';
import { JobDescriptionsService } from '../services/jobDescriptions';
import { AIAgentsService } from '../services/aiAgents';
import ScheduleInterviewModal from '../components/modals/ScheduleInterviewModal';
import EditInterviewModal from '../components/modals/EditInterviewModal';
import InterviewCalendar from '../components/calendar/InterviewCalendar';

type ViewMode = 'list' | 'calendar';
type InterviewStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

interface InterviewWithDetails extends Interview {
  candidate?: Candidate;
  jobDescription?: JobDescription;
  aiAgent?: AIAgent;
}

const InterviewManagementPage: React.FC = () => {
  // State management
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [interviews, setInterviews] = useState<InterviewWithDetails[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [aiAgents, setAiAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InterviewStatus | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [selectedInterview, setSelectedInterview] = useState<InterviewWithDetails | null>(null);

  // Modal states
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel
      const [interviewsData, candidatesResponse, jobsResponse, agentsData] = await Promise.all([
        InterviewsService.getAllInterviews(),
        CandidatesService.getCandidates(),
        JobDescriptionsService.getJobDescriptions(),
        AIAgentsService.getAllAIAgents()
      ]);

      setInterviews(interviewsData);
      setCandidates(candidatesResponse.data || []);
      setJobDescriptions(jobsResponse.data || []);
      setAiAgents(agentsData);

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load interview data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter interviews based on search and filters
  const filteredInterviews = interviews.filter(interview => {
    const matchesSearch = !searchTerm || 
      interview.candidate?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.jobDescription?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.aiAgent?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || interview.status === statusFilter;
    
    const matchesDate = !dateFilter || 
      new Date(interview.scheduledAt).toDateString() === new Date(dateFilter).toDateString();

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Get status color and icon
  const getStatusDisplay = (status: InterviewStatus) => {
    const statusConfig = {
      scheduled: { color: 'text-blue-600 bg-blue-100', icon: Clock, label: 'Scheduled' },
      in_progress: { color: 'text-yellow-600 bg-yellow-100', icon: Play, label: 'In Progress' },
      completed: { color: 'text-green-600 bg-green-100', icon: CheckCircle, label: 'Completed' },
      cancelled: { color: 'text-red-600 bg-red-100', icon: XCircle, label: 'Cancelled' }
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  // Format date and time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  // Handle interview actions
  const handleStartInterview = async (interviewId: string) => {
    try {
      await InterviewsService.updateInterviewStatus(interviewId, 'in_progress');
      await loadData();
    } catch (err) {
      console.error('Error starting interview:', err);
      setError('Failed to start interview. Please try again.');
    }
  };

  const handleCompleteInterview = async (interviewId: string) => {
    try {
      await InterviewsService.updateInterviewStatus(interviewId, 'completed');
      await loadData();
    } catch (err) {
      console.error('Error completing interview:', err);
      setError('Failed to complete interview. Please try again.');
    }
  };

  const handleCancelInterview = async (interviewId: string) => {
    try {
      await InterviewsService.updateInterviewStatus(interviewId, 'cancelled');
      await loadData();
    } catch (err) {
      console.error('Error cancelling interview:', err);
      setError('Failed to cancel interview. Please try again.');
    }
  };

  const handleDeleteInterview = async (interviewId: string) => {
    try {
      await InterviewsService.deleteInterview(interviewId);
      await loadData();
      setIsDeleteModalOpen(false);
      setSelectedInterview(null);
    } catch (err) {
      console.error('Error deleting interview:', err);
      setError('Failed to delete interview. Please try again.');
    }
  };

  const handleEditSuccess = () => {
    loadData();
    setIsEditModalOpen(false);
    setSelectedInterview(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 sm:py-0 sm:h-16 gap-4 sm:gap-0">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Interview Management</h1>
              <span className="text-sm text-gray-500 sm:ml-3">
                {filteredInterviews.length} interview{filteredInterviews.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              {/* View Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors flex-1 sm:flex-none ${
                    viewMode === 'list' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">List</span>
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors flex-1 sm:flex-none ${
                    viewMode === 'calendar' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">Calendar</span>
                </button>
              </div>

              {/* Schedule Interview Button */}
              <Button
                onClick={() => setIsScheduleModalOpen(true)}
                className="flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Schedule Interview</span>
                <span className="sm:hidden">Schedule</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search interviews, candidates, or jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as InterviewStatus | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base w-full sm:w-auto"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Date Filter */}
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base w-full sm:w-auto"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {viewMode === 'list' ? (
          /* List View */
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {filteredInterviews.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No interviews found</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || statusFilter !== 'all' || dateFilter
                    ? 'Try adjusting your filters to see more results.'
                    : 'Get started by scheduling your first interview.'}
                </p>
                {!searchTerm && statusFilter === 'all' && !dateFilter && (
                  <Button onClick={() => setIsScheduleModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule Interview
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredInterviews.map((interview) => {
                  const { date, time } = formatDateTime(interview.scheduledAt);
                  
                  return (
                    <div key={interview.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-900">
                                {interview.candidate?.name || 'Unknown Candidate'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">
                                {interview.jobDescription?.title || 'Unknown Position'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">
                                {interview.jobDescription?.location || 'Remote'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {date}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {time}
                            </div>
                            <div className="flex items-center gap-1">
                              <span>Duration: {interview.duration} min</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>Type: {interview.interviewType || 'General'}</span>
                            </div>
                          </div>

                          {interview.interviewNotes && (
                            <div className="mt-3 text-sm text-gray-600">
                              <span className="font-medium">Notes: </span>
                              {interview.interviewNotes}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          {getStatusDisplay(interview.status)}
                          
                          <div className="flex items-center gap-2">
                            {interview.status === 'scheduled' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStartInterview(interview.id)}
                              >
                                <Play className="w-4 h-4 mr-1" />
                                Start
                              </Button>
                            )}
                            
                            {interview.status === 'in_progress' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCompleteInterview(interview.id)}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Complete
                              </Button>
                            )}

                            <button
                              onClick={() => {
                                setSelectedInterview(interview);
                                setIsEditModalOpen(true);
                              }}
                              className={`p-2 transition-colors ${
                                interview.status === 'scheduled' 
                                  ? 'text-gray-400 hover:text-blue-600' 
                                  : 'text-gray-300 cursor-not-allowed'
                              }`}
                              disabled={interview.status !== 'scheduled'}
                              title={
                                interview.status === 'scheduled' 
                                  ? 'Edit interview' 
                                  : 'Only scheduled interviews can be edited'
                              }
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                setSelectedInterview(interview);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Calendar View */
          <InterviewCalendar
            interviews={filteredInterviews}
            candidates={candidates}
            jobDescriptions={jobDescriptions}
            aiAgents={aiAgents}
            onInterviewClick={(interview) => {
              setSelectedInterview(interview);
              setIsEditModalOpen(true);
            }}
            onScheduleInterview={() => setIsScheduleModalOpen(true)}
            onEditInterview={(interview) => {
              setSelectedInterview(interview);
              setIsEditModalOpen(true);
            }}
            onDeleteInterview={(interview) => {
              setSelectedInterview(interview);
              setIsDeleteModalOpen(true);
            }}
            onStatusChange={async (interviewId, status) => {
              try {
                await InterviewsService.updateInterviewStatus(interviewId, status);
                await loadData();
              } catch (err) {
                console.error('Error updating interview status:', err);
                setError('Failed to update interview status. Please try again.');
              }
            }}
          />
        )}
      </div>

      {/* Schedule Interview Modal */}
      <ScheduleInterviewModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSuccess={loadData}
        candidates={candidates}
        jobDescriptions={jobDescriptions}
        aiAgents={aiAgents}
      />

      {/* Edit Interview Modal */}
      <EditInterviewModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
        interview={selectedInterview}
        candidates={candidates}
        jobDescriptions={jobDescriptions}
        aiAgents={aiAgents}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Interview"
        size="md"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Are you sure you want to delete this interview? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => selectedInterview && handleDeleteInterview(selectedInterview.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default InterviewManagementPage;
