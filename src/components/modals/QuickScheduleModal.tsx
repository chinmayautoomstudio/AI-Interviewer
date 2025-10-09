import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Building, Bot, X } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { InterviewForm, Candidate, JobDescription, AIAgent } from '../../types';
import { InterviewsService } from '../../services/interviews';

interface QuickScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  candidates: Candidate[];
  jobDescriptions: JobDescription[];
  aiAgents: AIAgent[];
  selectedDate?: Date;
  selectedTime?: string;
}

const QuickScheduleModal: React.FC<QuickScheduleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  candidates,
  jobDescriptions,
  aiAgents,
  selectedDate,
  selectedTime
}) => {
  const [formData, setFormData] = useState<InterviewForm>({
    candidateId: '',
    jobDescriptionId: '',
    aiAgentId: '',
    interviewType: 'general',
    duration: 60,
    scheduledAt: '',
    interviewNotes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with selected date/time
  useEffect(() => {
    if (isOpen) {
      let initialDateTime = '';
      
      if (selectedDate) {
        const date = selectedDate.toISOString().slice(0, 10);
        const time = selectedTime || '09:00';
        initialDateTime = `${date}T${time}`;
      } else {
        // Default to next hour
        const now = new Date();
        now.setHours(now.getHours() + 1, 0, 0, 0);
        initialDateTime = now.toISOString().slice(0, 16);
      }

      setFormData({
        candidateId: '',
        jobDescriptionId: '',
        aiAgentId: '',
        interviewType: 'general',
        duration: 60,
        scheduledAt: initialDateTime,
        interviewNotes: ''
      });
      setError(null);
    }
  }, [isOpen, selectedDate, selectedTime]);

  const handleInputChange = (field: keyof InterviewForm, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.candidateId || !formData.jobDescriptionId || !formData.scheduledAt) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Convert datetime-local format to ISO string
      const scheduledAtISO = new Date(formData.scheduledAt).toISOString();

      await InterviewsService.createInterview({
        ...formData,
        scheduledAt: scheduledAtISO
      });
      
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
      title="Quick Schedule Interview"
      size="md"
    >
      <form onSubmit={handleSubmit} className="p-6">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
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
              AI HR Saathi
            </label>
            <select
              value={formData.aiAgentId}
              onChange={(e) => handleInputChange('aiAgentId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select an AI interviewer (optional)</option>
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
              Duration
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date & Time *
            </label>
            <input
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={(e) => handleInputChange('scheduledAt', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
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
                Schedule
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default QuickScheduleModal;
