// Exam Creation Page
// Dedicated page for creating and managing exam sessions

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Users, 
  BookOpen, 
  Settings,
  Plus,
  Eye,
  Copy,
  ExternalLink,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Candidate, JobDescription } from '../../types';
import { getCandidates } from '../../services/candidates';
import { JobDescriptionsService } from '../../services/jobDescriptions';
import { examService } from '../../services/examService';

interface ExamConfig {
  candidateId: string;
  jobDescriptionId: string;
  durationMinutes: number;
  totalQuestions: number;
  expiresInHours: number;
  examTitle?: string;
  instructions?: string;
}

const ExamCreationPage: React.FC = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createdExamToken, setCreatedExamToken] = useState<string | null>(null);

  const [config, setConfig] = useState<ExamConfig>({
    candidateId: '',
    jobDescriptionId: '',
    durationMinutes: 30,
    totalQuestions: 15,
    expiresInHours: 48,
    examTitle: '',
    instructions: ''
  });

  // Load candidates and job descriptions
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load candidates
      const candidatesData = await getCandidates();
      setCandidates(candidatesData);

      // Load job descriptions
      const jobDescriptionsData = await JobDescriptionsService.getJobDescriptions();
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

      setCreatedExamToken(examSession.exam_token);
      setSuccess('Exam created successfully!');
      
    } catch (err) {
      console.error('Error creating exam:', err);
      setError(err instanceof Error ? err.message : 'Failed to create exam');
    } finally {
      setSubmitting(false);
    }
  };

  const copyExamLink = () => {
    if (createdExamToken) {
      const examUrl = `${window.location.origin}/candidate/exam/${createdExamToken}`;
      navigator.clipboard.writeText(examUrl);
      console.log('Exam link copied to clipboard:', examUrl);
    }
  };

  const openExamLink = () => {
    if (createdExamToken) {
      const examUrl = `${window.location.origin}/candidate/exam/${createdExamToken}`;
      window.open(examUrl, '_blank');
    }
  };

  const resetForm = () => {
    setConfig({
      candidateId: '',
      jobDescriptionId: '',
      durationMinutes: 30,
      totalQuestions: 15,
      expiresInHours: 48,
      examTitle: '',
      instructions: ''
    });
    setError(null);
    setSuccess(null);
    setCreatedExamToken(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exam creation form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/exams')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Create New Exam</h1>
                <p className="text-sm text-gray-600">Set up an exam session for a candidate</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {success && createdExamToken && (
          <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-900">Exam Created Successfully!</h3>
                  <p className="text-sm text-green-700">Share this link with the candidate to start the exam</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={copyExamLink}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Link</span>
                </button>
                <button
                  onClick={openExamLink}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Exam</span>
                </button>
              </div>
            </div>
            <div className="mt-4 p-4 bg-white rounded-lg border">
              <p className="text-sm text-gray-600 mb-2">Exam Link:</p>
              <code className="text-sm text-gray-800 break-all">
                {`${window.location.origin}/candidate/exam/${createdExamToken}`}
              </code>
            </div>
            <div className="mt-4 flex items-center space-x-3">
              <button
                onClick={resetForm}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Create Another Exam
              </button>
              <button
                onClick={() => navigate('/exams')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Main Form */}
        <div className="bg-white rounded-xl shadow-sm border">
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <span className="text-red-800 text-sm">{error}</span>
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Settings className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
              </div>

              {/* Candidate Selection */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <Users className="w-4 h-4" />
                  <span>Select Candidate</span>
                </label>
                <select
                  value={config.candidateId}
                  onChange={(e) => setConfig(prev => ({ ...prev, candidateId: e.target.value }))}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            </div>

            {/* Exam Configuration */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Exam Configuration</h2>
              </div>

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
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Expiry Time */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Exam Expires In</label>
                <select
                  value={config.expiresInHours}
                  onChange={(e) => setConfig(prev => ({ ...prev, expiresInHours: parseInt(e.target.value) }))}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={24}>24 hours</option>
                  <option value={48}>48 hours</option>
                  <option value={72}>72 hours</option>
                  <option value={168}>1 week</option>
                </select>
              </div>
            </div>

            {/* Exam Preview */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Eye className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Exam Preview</h2>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{config.durationMinutes}</div>
                    <div className="text-gray-600">Minutes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{config.totalQuestions}</div>
                    <div className="text-gray-600">Questions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{config.expiresInHours}h</div>
                    <div className="text-gray-600">Expires</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">Ready</div>
                    <div className="text-gray-600">Status</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/exams')}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !config.candidateId || !config.jobDescriptionId}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Exam...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Create Exam</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ExamCreationPage;
