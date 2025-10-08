import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Building, Bot, FileText, Save, X } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Interview, InterviewForm, Candidate, JobDescription, AIAgent } from '../../types';
import { InterviewsService } from '../../services/interviews';

interface EditInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  interview: Interview | null;
  candidates: Candidate[];
  jobDescriptions: JobDescription[];
  aiAgents: AIAgent[];
}

const EditInterviewModal: React.FC<EditInterviewModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  interview,
  candidates,
  jobDescriptions,
  aiAgents
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

  // Populate form when interview changes
  useEffect(() => {
    if (interview && isOpen) {
      setFormData({
        candidateId: interview.candidateId || '',
        jobDescriptionId: interview.jobDescriptionId || '',
        aiAgentId: interview.aiAgentId || '',
        interviewType: interview.interviewType || 'general',
        duration: interview.duration || 60,
        scheduledAt: interview.scheduledAt ? new Date(interview.scheduledAt).toISOString().slice(0, 16) : '',
        interviewNotes: interview.interviewNotes || ''
      });
      setError(null);
    }
  }, [interview, isOpen]);

  const handleInputChange = (field: keyof InterviewForm, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!interview?.id) {
      setError('No interview selected for editing');
      return;
    }

    if (!formData.candidateId || !formData.jobDescriptionId || !formData.scheduledAt) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Convert datetime-local format to ISO string
      const scheduledAtISO = new Date(formData.scheduledAt).toISOString();

      await InterviewsService.updateInterview(interview.id, {
        ...formData,
        scheduledAt: scheduledAtISO
      });
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error updating interview:', err);
      setError('Failed to update interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  if (!interview) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Interview"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="p-6">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Interview Status Display */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Current Status</h3>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {interview.status.replace('_', ' ')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Interview ID</p>
                <p className="text-sm font-mono text-gray-700">{interview.id.slice(0, 8)}...</p>
              </div>
            </div>
          </div>

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
              AI Interviewer
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
            />
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

          {/* Interview History */}
          {(interview.startedAt || interview.completedAt) && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Interview Timeline</h4>
              <div className="space-y-1 text-sm text-blue-800">
                {interview.startedAt && (
                  <p>Started: {new Date(interview.startedAt).toLocaleString()}</p>
                )}
                {interview.completedAt && (
                  <p>Completed: {new Date(interview.completedAt).toLocaleString()}</p>
                )}
                <p>Created: {new Date(interview.createdAt).toLocaleString()}</p>
                <p>Last Updated: {new Date(interview.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
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
                Updating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Update Interview
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditInterviewModal;
