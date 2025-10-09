import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Building, Bot, FileText } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { InterviewForm, Candidate, JobDescription, AIAgent } from '../../types';
import { InterviewsService } from '../../services/interviews';

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  candidates: Candidate[];
  jobDescriptions: JobDescription[];
  aiAgents: AIAgent[];
  selectedCandidateId?: string;
  selectedJobId?: string;
  selectedDate?: string; // ISO date string (YYYY-MM-DD)
}

const ScheduleInterviewModal: React.FC<ScheduleInterviewModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  candidates,
  jobDescriptions,
  aiAgents,
  selectedCandidateId,
  selectedJobId,
  selectedDate
}) => {
  const [formData, setFormData] = useState<InterviewForm>({
    candidateId: selectedCandidateId || '',
    jobDescriptionId: selectedJobId || '',
    aiAgentId: '',
    interviewType: 'general',
    duration: 60,
    scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16), // 1 hour from now
    interviewNotes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // If a date is selected from calendar, set it with default time
      let initialScheduledAt = '';
      if (selectedDate) {
        // Set default time to 9:00 AM
        initialScheduledAt = `${selectedDate}T09:00`;
      } else {
        // Set to current time + 1 hour if no date selected
        const now = new Date();
        now.setHours(now.getHours() + 1);
        initialScheduledAt = now.toISOString().slice(0, 16);
      }
      
      setFormData({
        candidateId: selectedCandidateId || '',
        jobDescriptionId: selectedJobId || '',
        aiAgentId: '',
        interviewType: 'general',
        duration: 60,
        scheduledAt: initialScheduledAt,
        interviewNotes: ''
      });
      setError(null);
    }
  }, [isOpen, selectedCandidateId, selectedJobId, selectedDate]);

  const handleInputChange = (field: keyof InterviewForm, value: string | number) => {
    console.log('handleInputChange called:', field, value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.candidateId || !formData.jobDescriptionId || !formData.aiAgentId || !formData.scheduledAt) {
      setError('Please fill in all required fields');
      return;
    }
    
    // Validate UUIDs
    if (!formData.candidateId.trim()) {
      setError('Please select a candidate');
      return;
    }
    
    if (!formData.jobDescriptionId.trim()) {
      setError('Please select a job position');
      return;
    }
    
    if (!formData.aiAgentId.trim()) {
      setError('Please select an AI interviewer');
      return;
    }
    
    console.log('Submitting interview data:', formData);

    try {
      setLoading(true);
      setError(null);

      await InterviewsService.createInterview(formData);
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error scheduling interview:', err);
      setError('Failed to schedule interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Schedule New Interview"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="p-6">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Candidate Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Candidate *
            </label>
            <select
              value={formData.candidateId}
              onChange={(e) => handleInputChange('candidateId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select a candidate</option>
              {candidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name} ({candidate.email})
                </option>
              ))}
            </select>
          </div>

          {/* Job Description Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building className="w-4 h-4 inline mr-1" />
              Job Position *
            </label>
            <select
              value={formData.jobDescriptionId}
              onChange={(e) => handleInputChange('jobDescriptionId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select a job position</option>
              {jobDescriptions.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} - {job.department}
                </option>
              ))}
            </select>
          </div>

          {/* AI Agent Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Bot className="w-4 h-4 inline mr-1" />
              AI Interviewer *
            </label>
            <select
              value={formData.aiAgentId}
              onChange={(e) => handleInputChange('aiAgentId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select an AI interviewer</option>
              {aiAgents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} - {agent.agentType}
                </option>
              ))}
            </select>
          </div>

          {/* Interview Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Interview Type
            </label>
            <select
              value={formData.interviewType}
              onChange={(e) => handleInputChange('interviewType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="general">General</option>
              <option value="technical">Technical</option>
              <option value="behavioral">Behavioral</option>
              <option value="hr">HR</option>
              <option value="domain_specific">Domain Specific</option>
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Duration (minutes)
            </label>
            <select
              value={formData.duration}
              onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
              <option value={120}>120 minutes</option>
            </select>
          </div>

          {/* Scheduled Date & Time */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date & Time *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Date Input */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.scheduledAt ? formData.scheduledAt.split('T')[0] : ''}
                    onChange={(e) => {
                      const date = e.target.value;
                      const time = formData.scheduledAt ? formData.scheduledAt.split('T')[1] : '09:00';
                      const newDateTime = `${date}T${time}`;
                      console.log('Date input changed:', newDateTime);
                      handleInputChange('scheduledAt', newDateTime);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    min={new Date().toISOString().slice(0, 10)}
                  />
                </div>
                
                {/* Time Input */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Time</label>
                  <input
                    type="time"
                    value={formData.scheduledAt ? formData.scheduledAt.split('T')[1] : '09:00'}
                    onChange={(e) => {
                      const time = e.target.value;
                      const date = formData.scheduledAt ? formData.scheduledAt.split('T')[0] : new Date().toISOString().slice(0, 10);
                      const newDateTime = `${date}T${time}`;
                      console.log('Time input changed:', newDateTime);
                      handleInputChange('scheduledAt', newDateTime);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Past dates and times are not allowed.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Current value: {formData.scheduledAt}
              </p>
            </div>
          </div>

          {/* Interview Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Notes
            </label>
            <textarea
              value={formData.interviewNotes}
              onChange={(e) => handleInputChange('interviewNotes', e.target.value)}
              placeholder="Add any special notes or instructions for this interview..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Scheduling...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4" />
                Schedule Interview
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ScheduleInterviewModal;
