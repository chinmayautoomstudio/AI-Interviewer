import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { 
  Mic, 
  MicOff, 
  Headphones, 
  HeadphoneOff, 
  Phone, 
  X, 
  Calendar, 
  Plus, 
  Clock, 
  User, 
  Bot, 
  Briefcase,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { getCandidates } from '../services/candidates';
import { getJobDescriptions } from '../services/jobDescriptions';
import { getAIAgents, getRecommendedAIAgents } from '../services/aiAgents';
import { createInterview, getInterviews, updateInterviewStatus } from '../services/interviews';
import { Candidate, JobDescription, AIAgent, Interview, InterviewForm } from '../types';

const InterviewPage: React.FC = () => {
  // Data states
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [aiAgents, setAIAgents] = useState<AIAgent[]>([]);
  const [recommendedAgents, setRecommendedAgents] = useState<AIAgent[]>([]);
  
  // Loading states
  const [interviewsLoading, setInterviewsLoading] = useState(true);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [jobDescriptionsLoading, setJobDescriptionsLoading] = useState(false);
  const [aiAgentsLoading, setAIAgentsLoading] = useState(false);
  const [schedulingLoading, setSchedulingLoading] = useState(false);
  
  // Error states
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  
  // Modal states
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState<InterviewForm>({
    candidateId: '',
    jobDescriptionId: '',
    aiAgentId: '',
    interviewType: 'general',
    duration: 30,
    scheduledAt: '',
    interviewNotes: '',
  });

  useEffect(() => {
    loadInterviews();
  }, []);


  const loadInterviews = async () => {
    try {
      setInterviewsLoading(true);
      setError(null);
      const interviewsData = await getInterviews();
      setInterviews(interviewsData);
    } catch (err) {
      console.error('Error loading interviews:', err);
      setError(err instanceof Error ? err.message : 'Failed to load interviews');
    } finally {
      setInterviewsLoading(false);
    }
  };

  const loadScheduleData = async () => {
    try {
      setCandidatesLoading(true);
      setJobDescriptionsLoading(true);
      setAIAgentsLoading(true);
      
      const [candidatesData, jobDescriptionsData, aiAgentsData] = await Promise.all([
        getCandidates(),
        getJobDescriptions(),
        getAIAgents(),
      ]);
      
      setCandidates(candidatesData);
      setJobDescriptions(jobDescriptionsData);
      setAIAgents(aiAgentsData);
    } catch (err) {
      console.error('Error loading schedule data:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setCandidatesLoading(false);
      setJobDescriptionsLoading(false);
      setAIAgentsLoading(false);
    }
  };

  const handleScheduleInterview = () => {
    setIsScheduleModalOpen(true);
    setFormData({
      candidateId: '',
      jobDescriptionId: '',
      aiAgentId: '',
      interviewType: 'general',
      duration: 30,
      scheduledAt: '',
      interviewNotes: '',
    });
    setRecommendedAgents([]);
    setFormError(null);
    setFormSuccess(null);
    loadScheduleData();
  };

  const handleJobDescriptionChange = async (jobDescriptionId: string) => {
    setFormData(prev => ({ ...prev, jobDescriptionId, aiAgentId: '' }));
    
    if (jobDescriptionId) {
      try {
        const recommended = await getRecommendedAIAgents(jobDescriptionId);
        setRecommendedAgents(recommended);
      } catch (err) {
        console.error('Error loading recommended agents:', err);
      }
    } else {
      setRecommendedAgents([]);
    }
  };

  const handleSubmit = async () => {
    if (!formData.candidateId || !formData.jobDescriptionId || !formData.aiAgentId || !formData.scheduledAt) {
      setFormError('Please fill in all required fields');
      return;
    }

    try {
      setSchedulingLoading(true);
      setFormError(null);

      await createInterview(formData);
      
      setFormSuccess('Interview scheduled successfully!');
      await loadInterviews(); // Refresh interviews list
      
      setTimeout(() => {
        setIsScheduleModalOpen(false);
        setFormSuccess(null);
      }, 2000);
    } catch (err) {
      console.error('Error scheduling interview:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to schedule interview');
    } finally {
      setSchedulingLoading(false);
    }
  };

  const closeModal = () => {
    setIsScheduleModalOpen(false);
    setFormData({
      candidateId: '',
      jobDescriptionId: '',
      aiAgentId: '',
      interviewType: 'general',
      duration: 30,
      scheduledAt: '',
      interviewNotes: '',
    });
    setRecommendedAgents([]);
    setFormError(null);
    setFormSuccess(null);
  };

  const handleInterviewAction = async (interviewId: string, action: 'start' | 'pause' | 'complete' | 'cancel') => {
    try {
      let newStatus: Interview['status'];
      switch (action) {
        case 'start': newStatus = 'in_progress'; break;
        case 'pause': newStatus = 'scheduled'; break;
        case 'complete': newStatus = 'completed'; break;
        case 'cancel': newStatus = 'cancelled'; break;
        default: return;
      }
      
      await updateInterviewStatus(interviewId, newStatus);
      await loadInterviews(); // Refresh the list
    } catch (err) {
      console.error('Error updating interview status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update interview');
    }
  };

  const getAgentTypeIcon = (type: AIAgent['agentType']) => {
    switch (type) {
      case 'technical': return '🔧';
      case 'behavioral': return '💬';
      case 'hr': return '👥';
      case 'domain_specific': return '🎯';
      case 'general': return '🌐';
      default: return '🤖';
    }
  };

  const getAgentTypeColor = (type: AIAgent['agentType']) => {
    switch (type) {
      case 'technical': return 'bg-blue-100 text-blue-800';
      case 'behavioral': return 'bg-green-100 text-green-800';
      case 'hr': return 'bg-purple-100 text-purple-800';
      case 'domain_specific': return 'bg-orange-100 text-orange-800';
      case 'general': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: Interview['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (interviewsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Interviews</h1>
          <p className="text-gray-600">Schedule and manage AI-powered interviews</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={loadInterviews} disabled={interviewsLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="primary" onClick={handleScheduleInterview}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Interview
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Interviews List */}
      {interviews.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <Calendar className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No interviews scheduled</h3>
            <p className="text-gray-600 mb-4">Get started by scheduling your first AI interview</p>
            <Button variant="primary" onClick={handleScheduleInterview}>
              <Plus className="h-4 w-4 mr-2" />
              Schedule First Interview
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {interviews.map((interview) => (
            <Card key={interview.id}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {interview.candidate?.name || 'Unknown Candidate'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {interview.jobDescription?.title || 'Unknown Job'} - {interview.jobDescription?.companyName || 'Unknown Company'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(interview.status)}`}>
                      {interview.status.replace('_', ' ').toUpperCase()}
                    </span>
                    {interview.aiAgent && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAgentTypeColor(interview.aiAgent.agentType)}`}>
                        {getAgentTypeIcon(interview.aiAgent.agentType)} {interview.aiAgent.name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {formatDate(interview.scheduledAt)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {interview.duration} minutes
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {interview.interviewType.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>

                {interview.interviewNotes && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Notes:</span> {interview.interviewNotes}
                    </p>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  {interview.status === 'scheduled' && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleInterviewAction(interview.id, 'start')}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Start Interview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleInterviewAction(interview.id, 'cancel')}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </>
                  )}
                  {interview.status === 'in_progress' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleInterviewAction(interview.id, 'pause')}
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleInterviewAction(interview.id, 'complete')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                    </>
                  )}
                  {interview.status === 'completed' && (
                    <span className="text-sm text-green-600 font-medium">
                      ✅ Interview Completed
                    </span>
                  )}
                  {interview.status === 'cancelled' && (
                    <span className="text-sm text-red-600 font-medium">
                      ❌ Interview Cancelled
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Schedule Interview Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={closeModal}
            />
            
            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Schedule AI Interview
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              {/* Content */}
              <div className="p-6">
                <div className="space-y-6">
                  {/* Error/Success Messages */}
                  {formError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-800 text-sm">{formError}</p>
                    </div>
                  )}
                  {formSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-800 text-sm">{formSuccess}</p>
                    </div>
                  )}

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Candidate *
                      </label>
                      <select
                        value={formData.candidateId}
                        onChange={(e) => setFormData(prev => ({ ...prev, candidateId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={candidatesLoading}
                      >
                        <option value="">Select a candidate...</option>
                        {candidates.map((candidate) => (
                          <option key={candidate.id} value={candidate.id}>
                            {candidate.name} - {candidate.email}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Job Description *
                      </label>
                      <select
                        value={formData.jobDescriptionId}
                        onChange={(e) => handleJobDescriptionChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={jobDescriptionsLoading}
                      >
                        <option value="">Select a job description...</option>
                        {jobDescriptions.map((job) => (
                          <option key={job.id} value={job.id}>
                            {job.title} - {job.companyName || job.department}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Interview Type *
                      </label>
                      <select
                        value={formData.interviewType}
                        onChange={(e) => setFormData(prev => ({ ...prev, interviewType: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="general">General</option>
                        <option value="technical">Technical</option>
                        <option value="behavioral">Behavioral</option>
                        <option value="hr">HR</option>
                        <option value="domain_specific">Domain Specific</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duration (minutes) *
                      </label>
                      <select
                        value={formData.duration}
                        onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={45}>45 minutes</option>
                        <option value={60}>60 minutes</option>
                        <option value={90}>90 minutes</option>
                        <option value={120}>120 minutes</option>
                      </select>
                    </div>
                  </div>

                  {/* AI Agent Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      AI Agent *
                    </label>
                    {recommendedAgents.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-2">Recommended for this job:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {recommendedAgents.map((agent) => (
                            <button
                              key={agent.id}
                              onClick={() => setFormData(prev => ({ ...prev, aiAgentId: agent.id }))}
                              className={`p-3 border rounded-lg text-left transition-colors ${
                                formData.aiAgentId === agent.id
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">{getAgentTypeIcon(agent.agentType)}</span>
                                <div>
                                  <p className="font-medium text-gray-900">{agent.name}</p>
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAgentTypeColor(agent.agentType)}`}>
                                    {agent.agentType.replace('_', ' ').toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <select
                      value={formData.aiAgentId}
                      onChange={(e) => setFormData(prev => ({ ...prev, aiAgentId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={aiAgentsLoading}
                    >
                      <option value="">Select an AI agent...</option>
                      {aiAgents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {getAgentTypeIcon(agent.agentType)} {agent.name} ({agent.agentType.replace('_', ' ')})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Scheduled Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.scheduledAt}
                      onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Interview Notes
                    </label>
                    <textarea
                      value={formData.interviewNotes || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, interviewNotes: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add any special notes or requirements for this interview..."
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button variant="outline" onClick={closeModal} disabled={schedulingLoading}>
                      Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSubmit} disabled={schedulingLoading}>
                      {schedulingLoading ? 'Scheduling...' : 'Schedule Interview'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewPage;
