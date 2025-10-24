// Create Exam Modal Component
// Modal for creating new exam sessions with candidate and job description selection

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Users, BookOpen, AlertCircle, CheckCircle } from 'lucide-react';
import { Candidate, JobDescription } from '../../types';
import { getCandidates } from '../../services/candidates';
import { JobDescriptionsService } from '../../services/jobDescriptions';
import { examService } from '../../services/examService';

interface CreateExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (examToken: string) => void;
}

interface ExamConfig {
  candidateId: string;
  jobDescriptionId: string;
  durationMinutes: number;
  totalQuestions: number;
  expiresInHours: number;
}

const CreateExamModal: React.FC<CreateExamModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [config, setConfig] = useState<ExamConfig>({
    candidateId: '',
    jobDescriptionId: '',
    durationMinutes: 30,
    totalQuestions: 15,
    expiresInHours: 48
  });

  // Load candidates and job descriptions
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load candidates
      const candidatesData = await getCandidates();
      setCandidates(candidatesData);

      // Load job descriptions
      const jobDescriptionsData = await JobDescriptionsService.getJobDescriptionsWithQuestions();
      setJobDescriptions(jobDescriptionsData.data || []);

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load candidates or job descriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!config.candidateId || !config.jobDescriptionId) {
      setError('Please select both candidate and job description');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      console.log('Creating exam session with config:', config);

      const examSession = await examService.createExamSession({
        candidate_id: config.candidateId,
        job_description_id: config.jobDescriptionId,
        duration_minutes: config.durationMinutes,
        total_questions: config.totalQuestions,
        expires_in_hours: config.expiresInHours
      });

      console.log('Exam session created:', examSession);

      setSuccess('Exam created successfully!');
      
      // Close modal after a short delay and pass the exam token
      setTimeout(() => {
        onSuccess(examSession.exam_token);
        onClose();
        resetForm();
      }, 1500);

    } catch (err) {
      console.error('Error creating exam:', err);
      setError(err instanceof Error ? err.message : 'Failed to create exam');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setConfig({
      candidateId: '',
      jobDescriptionId: '',
      durationMinutes: 30,
      totalQuestions: 15,
      expiresInHours: 48
    });
    setError(null);
    setSuccess(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Create New Exam</h2>
              <p className="text-sm text-gray-600">Set up an exam session for a candidate</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error/Success Messages */}
          {error && (
            <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-green-800 text-sm">{success}</span>
            </div>
          )}

          {/* Candidate Selection */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <Users className="w-4 h-4" />
              <span>Select Candidate</span>
            </label>
            <select
              value={config.candidateId}
              onChange={(e) => setConfig(prev => ({ ...prev, candidateId: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Choose a candidate...</option>
              {candidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name} - {candidate.email}
                </option>
              ))}
            </select>
          </div>

          {/* Job Description Selection */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <BookOpen className="w-4 h-4" />
              <span>Select Job Description</span>
            </label>
            <select
              value={config.jobDescriptionId}
              onChange={(e) => setConfig(prev => ({ ...prev, jobDescriptionId: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Choose a job description...</option>
              {jobDescriptions.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} - {job.department}
                </option>
              ))}
            </select>
          </div>

          {/* Info Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">Ready to Create Exam</span>
            </div>
            <div className="mt-2 text-sm text-green-800">
              <p>All job descriptions shown have approved questions available.</p>
              <p>You can create exams with confidence knowing questions are ready.</p>
            </div>
          </div>

          {/* Exam Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Duration */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <Clock className="w-4 h-4" />
                <span>Duration (minutes)</span>
              </label>
              <input
                type="number"
                min="5"
                max="180"
                value={config.durationMinutes}
                onChange={(e) => setConfig(prev => ({ ...prev, durationMinutes: parseInt(e.target.value) || 30 }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Total Questions */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Total Questions</label>
              <input
                type="number"
                min="5"
                max="50"
                value={config.totalQuestions}
                onChange={(e) => setConfig(prev => ({ ...prev, totalQuestions: parseInt(e.target.value) || 15 }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Expiry Time */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Exam Expires In (hours)</label>
            <select
              value={config.expiresInHours}
              onChange={(e) => setConfig(prev => ({ ...prev, expiresInHours: parseInt(e.target.value) }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={24}>24 hours</option>
              <option value={48}>48 hours</option>
              <option value={72}>72 hours</option>
              <option value={168}>1 week</option>
            </select>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-medium text-gray-900">Exam Preview</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Duration:</span>
                <span className="ml-2 font-medium">{config.durationMinutes} minutes</span>
              </div>
              <div>
                <span className="text-gray-600">Questions:</span>
                <span className="ml-2 font-medium">{config.totalQuestions}</span>
              </div>
              <div>
                <span className="text-gray-600">Expires:</span>
                <span className="ml-2 font-medium">{config.expiresInHours} hours</span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="ml-2 font-medium text-green-600">Ready to Create</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || loading || !config.candidateId || !config.jobDescriptionId}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  <span>Create Exam</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateExamModal;
