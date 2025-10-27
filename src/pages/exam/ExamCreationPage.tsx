// Exam Creation Page
// Dedicated page for creating and managing exam sessions

import React, { useState, useEffect, useCallback } from 'react';
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
  AlertCircle,
  Mail
} from 'lucide-react';
import { Candidate, JobDescription } from '../../types';
import { getCandidates } from '../../services/candidates';
import { JobDescriptionsService } from '../../services/jobDescriptions';
import { examService } from '../../services/examService';
import { ExamEmailService, ExamEmailData } from '../../services/examEmailService';

interface ExamConfig {
  candidateId: string;
  jobDescriptionId: string;
  durationMinutes: number;
  totalQuestions: number;
  expiresInHours: number;
  examTitle?: string;
  instructions?: string;
  sendEmailNotification?: boolean;
  customEmailMessage?: string;
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
    instructions: '',
    sendEmailNotification: true,
    customEmailMessage: ''
  });
  const [availableQuestionsCount, setAvailableQuestionsCount] = useState<number>(0);

  // Load candidates and job descriptions
  useEffect(() => {
    loadData();
  }, []);

  const checkAvailableQuestions = useCallback(async (jobDescriptionId: string) => {
    try {
      const { count } = await examService.getAvailableQuestions(jobDescriptionId);
      setAvailableQuestionsCount(count);
      
      // If requested questions exceed available, adjust the count
      if (config.totalQuestions > count && count > 0) {
        setConfig(prev => ({ ...prev, totalQuestions: count }));
      }
    } catch (err) {
      console.error('Error checking available questions:', err);
      setAvailableQuestionsCount(0);
    }
  }, [config.totalQuestions]);

  // Check available questions when job description changes
  useEffect(() => {
    if (config.jobDescriptionId) {
      checkAvailableQuestions(config.jobDescriptionId);
    } else {
      setAvailableQuestionsCount(0);
    }
  }, [config.jobDescriptionId, checkAvailableQuestions]);

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

    // Validate question count
    if (config.totalQuestions > availableQuestionsCount) {
      setError(`Cannot create exam with ${config.totalQuestions} questions. Only ${availableQuestionsCount} questions are available for this job description.`);
      return;
    }

    if (availableQuestionsCount === 0) {
      setError('No approved questions available for this job description. Please add questions first.');
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

      // Send email notification if enabled
      if (config.sendEmailNotification) {
        try {
          const selectedCandidate = candidates.find(c => c.id === config.candidateId);
          const selectedJob = jobDescriptions.find(j => j.id === config.jobDescriptionId);
          
          if (selectedCandidate && selectedJob) {
            const emailData: ExamEmailData = {
              candidateName: selectedCandidate.name,
              candidateEmail: selectedCandidate.email,
              jobTitle: selectedJob.title,
              examDuration: config.durationMinutes,
              examToken: examSession.exam_token,
              expiresAt: examSession.expires_at,
              examLink: `${window.location.origin}/candidate/exam/${examSession.exam_token}`,
              customMessage: config.customEmailMessage || '',
              companyName: 'AI Interviewer'
            };

            console.log('📧 Sending exam invitation email...');
            const emailResult = await ExamEmailService.sendExamInvitation(emailData);
            
            if (emailResult.success) {
              console.log('✅ Exam invitation email sent successfully');
              setSuccess('Exam created successfully and invitation email sent to candidate!');
            } else {
              console.warn('⚠️ Exam created but email sending failed:', emailResult.error);
              setSuccess('Exam created successfully, but failed to send email notification.');
            }
          } else {
            console.warn('⚠️ Could not find candidate or job description for email');
            setSuccess('Exam created successfully, but could not send email notification.');
          }
        } catch (emailError) {
          console.error('❌ Error sending exam invitation email:', emailError);
          setSuccess('Exam created successfully, but failed to send email notification.');
        }
      } else {
        setSuccess('Exam created successfully!');
      }

      setCreatedExamToken(examSession.exam_token);
      
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
      instructions: '',
      sendEmailNotification: true,
      customEmailMessage: ''
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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => navigate('/exams')}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Create New Exam</h1>
                <p className="text-xs sm:text-sm text-gray-600">Set up an exam session for a candidate</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Success Message */}
        {success && createdExamToken && (
          <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="p-2 sm:p-3 bg-green-100 rounded-lg flex-shrink-0">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-green-900">Exam Created Successfully!</h3>
                  <p className="text-xs sm:text-sm text-green-700">Share this link with the candidate to start the exam</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={copyExamLink}
                  className="flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Copy Link</span>
                </button>
                <button
                  onClick={openExamLink}
                  className="flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Open Exam</span>
                </button>
              </div>
            </div>
            <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-white rounded-lg border">
              <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Exam Link:</p>
              <code className="text-xs sm:text-sm text-gray-800 break-all">
                {`${window.location.origin}/candidate/exam/${createdExamToken}`}
              </code>
            </div>
            <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={resetForm}
                className="px-3 sm:px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Create Another Exam
              </button>
              <button
                onClick={() => navigate('/exams')}
                className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Main Form */}
        <div className="bg-white rounded-xl shadow-sm border">
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 sm:space-x-3 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
                <span className="text-red-800 text-xs sm:text-sm">{error}</span>
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Basic Information</h2>
              </div>

              {/* Candidate Selection */}
              <div className="space-y-1 sm:space-y-2">
                <label className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm font-medium text-gray-700">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Select Candidate</span>
                </label>
                <select
                  value={config.candidateId}
                  onChange={(e) => setConfig(prev => ({ ...prev, candidateId: e.target.value }))}
                  className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
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
              <div className="space-y-1 sm:space-y-2">
                <label className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm font-medium text-gray-700">
                  <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Select Job Description</span>
                </label>
                <select
                  value={config.jobDescriptionId}
                  onChange={(e) => setConfig(prev => ({ ...prev, jobDescriptionId: e.target.value }))}
                  className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
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
              <div className={`border rounded-lg p-3 sm:p-4 ${
                availableQuestionsCount > 0 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <CheckCircle className={`w-4 h-4 sm:w-5 sm:h-5 ${
                    availableQuestionsCount > 0 ? 'text-green-600' : 'text-yellow-600'
                  }`} />
                  <span className={`font-medium text-sm sm:text-base ${
                    availableQuestionsCount > 0 ? 'text-green-900' : 'text-yellow-900'
                  }`}>
                    {availableQuestionsCount > 0 ? 'Ready to Create Exam' : 'Limited Questions Available'}
                  </span>
                </div>
                <div className={`mt-1 sm:mt-2 text-xs sm:text-sm ${
                  availableQuestionsCount > 0 ? 'text-green-800' : 'text-yellow-800'
                }`}>
                  {availableQuestionsCount > 0 ? (
                    <>
                      <p>This job description has <strong>{availableQuestionsCount}</strong> approved questions available.</p>
                      <p>You can create exams with confidence knowing questions are ready.</p>
                    </>
                  ) : (
                    <>
                      <p>No approved questions available for this job description.</p>
                      <p>Please add questions to the question bank first.</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Exam Configuration */}
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Exam Configuration</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Duration */}
                <div className="space-y-1 sm:space-y-2">
                  <label className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm font-medium text-gray-700">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Duration (minutes)</span>
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={config.durationMinutes}
                    onChange={(e) => setConfig(prev => ({ ...prev, durationMinutes: parseInt(e.target.value) || 30 }))}
                    className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    required
                  />
                </div>

                {/* Total Questions */}
                <div className="space-y-1 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-gray-700">
                    Total Questions
                    {availableQuestionsCount > 0 && (
                      <span className="text-gray-500 ml-1">(Max: {availableQuestionsCount})</span>
                    )}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={availableQuestionsCount > 0 ? availableQuestionsCount : 50}
                    value={config.totalQuestions}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      const maxValue = availableQuestionsCount > 0 ? availableQuestionsCount : 50;
                      setConfig(prev => ({ 
                        ...prev, 
                        totalQuestions: Math.min(value, maxValue)
                      }));
                    }}
                    className={`w-full p-3 sm:p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${
                      config.totalQuestions > availableQuestionsCount && availableQuestionsCount > 0
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300'
                    }`}
                    required
                    disabled={availableQuestionsCount === 0}
                  />
                  {config.totalQuestions > availableQuestionsCount && availableQuestionsCount > 0 && (
                    <p className="text-xs text-red-600">
                      Cannot exceed {availableQuestionsCount} available questions
                    </p>
                  )}
                </div>
              </div>

              {/* Expiry Time */}
              <div className="space-y-1 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700">Exam Expires In</label>
                <select
                  value={config.expiresInHours}
                  onChange={(e) => setConfig(prev => ({ ...prev, expiresInHours: parseInt(e.target.value) }))}
                  className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                >
                  <option value={24}>24 hours</option>
                  <option value={48}>48 hours</option>
                  <option value={72}>72 hours</option>
                  <option value={168}>1 week</option>
                </select>
              </div>
            </div>

            {/* Email Notification */}
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Email Notification</h2>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {/* Send Email Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Mail className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Send Email Invitation</h3>
                      <p className="text-xs text-gray-600">Automatically send exam invitation to candidate</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.sendEmailNotification}
                      onChange={(e) => setConfig(prev => ({ ...prev, sendEmailNotification: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Custom Email Message */}
                {config.sendEmailNotification && (
                  <div className="space-y-1 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-gray-700">Custom Message (Optional)</label>
                    <textarea
                      value={config.customEmailMessage}
                      onChange={(e) => setConfig(prev => ({ ...prev, customEmailMessage: e.target.value }))}
                      placeholder="Add a custom message to include in the email invitation..."
                      rows={3}
                      className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base resize-none"
                    />
                    <p className="text-xs text-gray-500">This message will be included in the email invitation sent to the candidate.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Exam Preview */}
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Exam Preview</h2>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div className="text-center">
                    <div className="text-lg sm:text-2xl font-bold text-blue-600">{config.durationMinutes}</div>
                    <div className="text-gray-600">Minutes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-2xl font-bold text-green-600">{config.totalQuestions}</div>
                    <div className="text-gray-600">Questions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-2xl font-bold text-purple-600">{config.expiresInHours}h</div>
                    <div className="text-gray-600">Expires</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-2xl font-bold text-orange-600">Ready</div>
                    <div className="text-gray-600">Status</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/exams')}
                className="px-4 sm:px-6 py-2 sm:py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !config.candidateId || !config.jobDescriptionId}
                className="px-6 sm:px-8 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-1 sm:space-x-2 text-sm sm:text-base"
              >
                {submitting ? (
                  <>
                    <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Exam...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
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
