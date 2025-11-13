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
  Mail,
  Search,
  Download,
  X,
  Loader2
} from 'lucide-react';
import { Candidate, JobDescription } from '../../types';
import { getCandidates } from '../../services/candidates';
import { JobDescriptionsService } from '../../services/jobDescriptions';
import { examService } from '../../services/examService';
import { ExamEmailService, ExamEmailData } from '../../services/examEmailService';
import * as XLSX from 'xlsx';

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

interface BulkExamResult {
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  success: boolean;
  examToken?: string;
  examLink?: string;
  error?: string;
  emailSent?: boolean;
  emailError?: string;
}

const ExamCreationPage: React.FC = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createdExamToken, setCreatedExamToken] = useState<string | null>(null);

  // Bulk creation state
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [candidateSearchTerm, setCandidateSearchTerm] = useState<string>('');
  const [bulkCreating, setBulkCreating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number; currentCandidate?: string } | null>(null);
  const [bulkResults, setBulkResults] = useState<BulkExamResult[]>([]);
  const [showBulkResults, setShowBulkResults] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

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
    setSelectedCandidates(new Set());
    setBulkResults([]);
    setShowBulkResults(false);
    setBulkProgress(null);
    setShowBulkModal(false);
  };

  // Filter candidates based on search term
  const filteredCandidates = candidates.filter(candidate => {
    const searchLower = candidateSearchTerm.toLowerCase();
    return candidate.name.toLowerCase().includes(searchLower) ||
           candidate.email.toLowerCase().includes(searchLower);
  });

  // Handle candidate selection
  const handleCandidateToggle = (candidateId: string) => {
    setSelectedCandidates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(candidateId)) {
        newSet.delete(candidateId);
      } else {
        newSet.add(candidateId);
      }
      return newSet;
    });
  };

  // Handle select all/deselect all
  const handleSelectAll = (select: boolean) => {
    if (select) {
      setSelectedCandidates(new Set(filteredCandidates.map(c => c.id)));
    } else {
      setSelectedCandidates(new Set());
    }
  };

  // Bulk exam creation
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedCandidates.size === 0) {
      setError('Please select at least one candidate');
      return;
    }

    if (!config.jobDescriptionId) {
      setError('Please select a job description');
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

    const selectedJob = jobDescriptions.find(j => j.id === config.jobDescriptionId);
    if (!selectedJob) {
      setError('Selected job description not found');
      return;
    }

    const candidatesToProcess = Array.from(selectedCandidates).map(id => 
      candidates.find(c => c.id === id)
    ).filter((c): c is Candidate => c !== undefined);

    setBulkCreating(true);
    setError(null);
    setSuccess(null);
    setBulkResults([]);
    setShowBulkResults(false);
    setBulkProgress({ current: 0, total: candidatesToProcess.length });
    setShowBulkModal(true); // Open modal when bulk creation starts

    const results: BulkExamResult[] = [];

    try {
      // Process candidates sequentially
      for (let i = 0; i < candidatesToProcess.length; i++) {
        const candidate = candidatesToProcess[i];
        setBulkProgress({ 
          current: i + 1, 
          total: candidatesToProcess.length,
          currentCandidate: candidate.name
        });

        const result: BulkExamResult = {
          candidateId: candidate.id,
          candidateName: candidate.name,
          candidateEmail: candidate.email,
          success: false
        };

        try {
          // Create exam session
          const examSession = await examService.createExamSession({
            candidate_id: candidate.id,
            job_description_id: config.jobDescriptionId,
            duration_minutes: config.durationMinutes,
            total_questions: config.totalQuestions,
            expires_in_hours: config.expiresInHours
          });

          result.success = true;
          result.examToken = examSession.exam_token;
          result.examLink = `${window.location.origin}/candidate/exam/${examSession.exam_token}`;

          // Send email if enabled
          if (config.sendEmailNotification) {
            try {
              const emailData: ExamEmailData = {
                candidateName: candidate.name,
                candidateEmail: candidate.email,
                jobTitle: selectedJob.title,
                examDuration: config.durationMinutes,
                examToken: examSession.exam_token,
                expiresAt: examSession.expires_at,
                examLink: result.examLink,
                customMessage: config.customEmailMessage || '',
                companyName: 'AI HR Saathi'
              };

              const emailResult = await ExamEmailService.sendExamInvitation(emailData);
              result.emailSent = emailResult.success;
              if (!emailResult.success) {
                result.emailError = emailResult.error || 'Failed to send email';
              }
            } catch (emailError) {
              result.emailSent = false;
              result.emailError = emailError instanceof Error ? emailError.message : 'Failed to send email';
            }
          }

        } catch (err) {
          result.success = false;
          result.error = err instanceof Error ? err.message : 'Failed to create exam';
        }

        results.push(result);
        setBulkResults([...results]);
      }

      // Show results
      setShowBulkResults(true);
      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;
      
      if (successCount === results.length) {
        setSuccess(`Successfully created ${successCount} exam${successCount !== 1 ? 's' : ''} and sent invitation emails!`);
      } else if (successCount > 0) {
        setSuccess(`Created ${successCount} exam${successCount !== 1 ? 's' : ''} successfully. ${failCount} failed.`);
      } else {
        setError(`Failed to create exams for all candidates. Please check the results below.`);
      }
      
      // Modal remains open to show results

    } catch (err) {
      console.error('Error in bulk exam creation:', err);
      setError(err instanceof Error ? err.message : 'Failed to create exams');
    } finally {
      setBulkCreating(false);
      setBulkProgress(null);
    }
  };

  // Export results to CSV
  const exportToCSV = () => {
    if (bulkResults.length === 0) return;

    const csvData = bulkResults.map(result => ({
      'Candidate Name': result.candidateName,
      'Email': result.candidateEmail,
      'Status': result.success ? 'Success' : 'Failed',
      'Exam Link': result.examLink || '',
      'Error': result.error || '',
      'Email Sent': result.emailSent ? 'Yes' : (result.emailSent === false ? 'No' : 'N/A'),
      'Email Error': result.emailError || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(csvData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Exam Results');
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 20 }, // Candidate Name
      { wch: 30 }, // Email
      { wch: 10 }, // Status
      { wch: 50 }, // Exam Link
      { wch: 30 }, // Error
      { wch: 12 }, // Email Sent
      { wch: 30 }  // Email Error
    ];

    XLSX.writeFile(workbook, `exam-results-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Copy all exam links to clipboard
  const copyAllLinks = () => {
    const links = bulkResults
      .filter(r => r.success && r.examLink)
      .map(r => `${r.candidateName} - ${r.examLink}`)
      .join('\n');
    
    if (links) {
      navigator.clipboard.writeText(links);
      setSuccess('All exam links copied to clipboard!');
    }
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
                <p className="text-xs sm:text-sm text-gray-600">Set up exam sessions for one or multiple candidates</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
        {/* Success/Error Messages */}
        {success && !showBulkResults && (
          <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
              <span className="text-green-800 text-sm sm:text-base">{success}</span>
            </div>
          </div>
        )}
        {error && !bulkCreating && (
          <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 flex-shrink-0" />
              <span className="text-red-800 text-sm sm:text-base">{error}</span>
            </div>
          </div>
        )}

        {/* Legacy Single Candidate Success Message */}
        {success && createdExamToken && !showBulkResults && (
          <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
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
        <div className="bg-white rounded-lg shadow-sm border">
          <form onSubmit={handleBulkSubmit} className="p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8">
            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span className="text-red-800 text-xs sm:text-sm">{error}</span>
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              {/* Section Header */}
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <Settings className="w-4 h-4 text-blue-600" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">Basic Information</h2>
              </div>

              {/* Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                {/* Left Column - Candidate Selection */}
                <div className="lg:col-span-2 space-y-3">
                  {/* Candidate Selection - Multi-select */}
                  <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      <span className="flex items-center space-x-1.5">
                        <Users className="w-4 h-4" />
                        <span>Select Candidates</span>
                      </span>
                    </label>
                    {selectedCandidates.size > 0 && (
                      <span className="text-sm text-blue-600 font-medium">
                        {selectedCandidates.size} selected
                      </span>
                    )}
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search candidates by name or email..."
                      value={candidateSearchTerm}
                      onChange={(e) => setCandidateSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                  </div>

                  {/* Select All / Deselect All */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-2.5">
                      <input
                        type="checkbox"
                        checked={filteredCandidates.length > 0 && filteredCandidates.every(c => selectedCandidates.has(c.id))}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {filteredCandidates.length > 0 && filteredCandidates.every(c => selectedCandidates.has(c.id))
                          ? 'Deselect All'
                          : 'Select All'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {filteredCandidates.length} candidate{filteredCandidates.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Candidate List */}
                  <div className="border border-gray-300 rounded-lg max-h-48 sm:max-h-60 md:max-h-72 overflow-y-auto bg-white">
                    {filteredCandidates.length > 0 ? (
                      <div className="divide-y divide-gray-200">
                        {filteredCandidates.map((candidate) => (
                          <div
                            key={candidate.id}
                            className="flex items-center space-x-3 p-2.5 hover:bg-gray-50 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selectedCandidates.has(candidate.id)}
                              onChange={() => handleCandidateToggle(candidate.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {candidate.name}
                              </div>
                              <div className="text-xs text-gray-500 truncate mt-0.5">
                                {candidate.email}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-sm text-gray-500">
                        {candidateSearchTerm ? 'No candidates found matching your search' : 'No candidates available'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

                {/* Right Column - Job Description and Info */}
                <div className="space-y-4">
                  {/* Job Description Selection */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <span className="flex items-center space-x-1.5">
                        <BookOpen className="w-4 h-4" />
                        <span>Job Description</span>
                      </span>
                    </label>
                    <select
                      value={config.jobDescriptionId}
                      onChange={(e) => setConfig(prev => ({ ...prev, jobDescriptionId: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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
                  <div className={`border rounded-lg p-3 ${
                    availableQuestionsCount > 0 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 ${
                        availableQuestionsCount > 0 ? 'text-green-600' : 'text-yellow-600'
                      }`} />
                      <span className={`font-medium text-sm ${
                        availableQuestionsCount > 0 ? 'text-green-900' : 'text-yellow-900'
                      }`}>
                        {availableQuestionsCount > 0 ? 'Ready to Create' : 'Limited Questions'}
                      </span>
                    </div>
                    <div className={`text-sm ${
                      availableQuestionsCount > 0 ? 'text-green-800' : 'text-yellow-800'
                    }`}>
                      {availableQuestionsCount > 0 ? (
                        <p><strong>{availableQuestionsCount}</strong> approved questions available</p>
                      ) : (
                        <p>No approved questions available</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>


            {/* Exam Configuration */}
            <div className="space-y-4">
              {/* Section Header */}
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                  <Calendar className="w-4 h-4 text-green-600" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">Exam Configuration</h2>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Duration */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="flex items-center space-x-1.5">
                      <Clock className="w-4 h-4" />
                      <span>Duration (minutes)</span>
                    </span>
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={config.durationMinutes}
                    onChange={(e) => setConfig(prev => ({ ...prev, durationMinutes: parseInt(e.target.value) || 30 }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    required
                  />
                </div>

                {/* Total Questions */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Questions
                    {availableQuestionsCount > 0 && (
                      <span className="text-gray-500 font-normal ml-1">(Max: {availableQuestionsCount})</span>
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
                    className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${
                      config.totalQuestions > availableQuestionsCount && availableQuestionsCount > 0
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300'
                    }`}
                    required
                    disabled={availableQuestionsCount === 0}
                  />
                  {config.totalQuestions > availableQuestionsCount && availableQuestionsCount > 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      Cannot exceed {availableQuestionsCount} available questions
                    </p>
                  )}
                </div>

                {/* Expiry Time */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Expires In</label>
                  <select
                    value={config.expiresInHours}
                    onChange={(e) => setConfig(prev => ({ ...prev, expiresInHours: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value={24}>24 hours</option>
                    <option value={48}>48 hours</option>
                    <option value={72}>72 hours</option>
                    <option value={168}>1 week</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Email Notification */}
            <div className="space-y-4">
              {/* Section Header */}
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                  <Mail className="w-4 h-4 text-purple-600" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">Email Notification</h2>
              </div>

              <div className="space-y-4">
                {/* Send Email Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Mail className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Send Email Invitation</h3>
                      <p className="text-xs text-gray-600 mt-0.5">Automatically send exam invitation to candidates</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.sendEmailNotification}
                      onChange={(e) => setConfig(prev => ({ ...prev, sendEmailNotification: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Custom Email Message */}
                {config.sendEmailNotification && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Custom Message (Optional)</label>
                    <textarea
                      value={config.customEmailMessage}
                      onChange={(e) => setConfig(prev => ({ ...prev, customEmailMessage: e.target.value }))}
                      placeholder="Add a custom message to include in the email invitation..."
                      rows={3}
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white"
                    />
                    <p className="text-xs text-gray-500">This message will be included in the email invitation sent to the candidate.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Exam Preview */}
            <div className="space-y-4">
              {/* Section Header */}
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                  <Eye className="w-4 h-4 text-indigo-600" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">Exam Preview</h2>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">{config.durationMinutes}</div>
                    <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Minutes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">{config.totalQuestions}</div>
                    <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Questions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-1">{config.expiresInHours}h</div>
                    <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Expires</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600 mb-1">Ready</div>
                    <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Status</div>
                  </div>
                </div>
              </div>
            </div>


            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/exams')}
                className="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                disabled={bulkCreating}
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleBulkSubmit}
                disabled={bulkCreating || selectedCandidates.size === 0 || !config.jobDescriptionId}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 text-sm font-medium shadow-sm"
              >
                {bulkCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Exams...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Create Exams ({selectedCandidates.size})</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Bulk Results Summary */}
        {showBulkResults && bulkResults.length > 0 && (
          <div className="mt-4 sm:mt-6 bg-white rounded-lg shadow-sm border">
            <div className="p-3 sm:p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">Bulk Exam Creation Results</h2>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    {bulkResults.filter(r => r.success).length} succeeded, {bulkResults.filter(r => !r.success).length} failed
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={copyAllLinks}
                    className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    title="Copy all exam links"
                  >
                    <Copy className="w-4 h-4" />
                    <span className="hidden sm:inline">Copy Links</span>
                  </button>
                  <button
                    onClick={exportToCSV}
                    className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    title="Export to Excel"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Export</span>
                  </button>
                  <button
                    onClick={() => setShowBulkResults(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Close results"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Exam Link
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Error
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bulkResults.map((result, index) => (
                    <tr key={result.candidateId} className={result.success ? 'bg-green-50' : 'bg-red-50'}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{result.candidateName}</div>
                        <div className="text-xs text-gray-500">{result.candidateEmail}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {result.success ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {result.examLink ? (
                          <div className="flex items-center space-x-2">
                            <code className="text-xs text-gray-800 break-all">{result.examLink}</code>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(result.examLink!);
                                setSuccess('Link copied to clipboard!');
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="Copy link"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {result.emailSent !== undefined ? (
                          result.emailSent ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Sent
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Failed
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {result.error || result.emailError ? (
                          <div className="text-xs text-red-600">
                            {result.error || result.emailError}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bulk Exam Creation Modal */}
        {showBulkModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
            onClick={() => {
              if (!bulkCreating) {
                setShowBulkModal(false);
              }
            }}
          >
            <div 
              className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-3 sm:p-4 md:p-5 border-b border-gray-200">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  {bulkCreating ? (
                    <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 animate-spin" />
                  ) : bulkResults.length > 0 ? (
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                  )}
                  <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">
                    {bulkCreating ? 'Creating Exams...' : 'Exam Creation Results'}
                  </h2>
                </div>
                {!bulkCreating && (
                  <button
                    onClick={() => setShowBulkModal(false)}
                    className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Close"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-5">
                {/* Progress Section */}
                {bulkCreating && bulkProgress && (
                  <div className="mb-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs sm:text-sm font-semibold text-blue-900">
                          Creating Exam {bulkProgress.current} of {bulkProgress.total}
                        </h3>
                        <span className="text-xs sm:text-sm text-blue-700">
                          {Math.round((bulkProgress.current / bulkProgress.total) * 100)}%
                        </span>
                      </div>
                      {bulkProgress.currentCandidate && (
                        <p className="text-xs text-blue-700 mb-2">
                          Processing: <strong>{bulkProgress.currentCandidate}</strong>
                        </p>
                      )}
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Success Section */}
                {!bulkCreating && bulkResults.length > 0 && (
                  <div className="space-y-3 sm:space-y-4">
                    {/* Success Message */}
                    <div className={`p-3 rounded-lg border ${
                      bulkResults.every(r => r.success)
                        ? 'bg-green-50 border-green-200'
                        : 'bg-yellow-50 border-yellow-200'
                    }`}>
                      <div className="flex items-center space-x-2 mb-1.5">
                        {bulkResults.every(r => r.success) ? (
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                        )}
                        <h3 className={`text-sm sm:text-base font-semibold ${
                          bulkResults.every(r => r.success) ? 'text-green-900' : 'text-yellow-900'
                        }`}>
                          {bulkResults.every(r => r.success)
                            ? 'All Exams Created Successfully!'
                            : 'Exams Created with Some Issues'}
                        </h3>
                      </div>
                      <p className={`text-xs sm:text-sm ${
                        bulkResults.every(r => r.success) ? 'text-green-800' : 'text-yellow-800'
                      }`}>
                        {bulkResults.filter(r => r.success).length} of {bulkResults.length} exams created successfully.
                        {bulkResults.filter(r => !r.success).length > 0 && (
                          <span className="ml-1">
                            {bulkResults.filter(r => !r.success).length} failed.
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Exam Details and Statistics - Side by side on larger screens */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {/* Exam Details */}
                      {config.jobDescriptionId && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Exam Configuration</h3>
                          <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs">
                            <div>
                              <div className="text-gray-600 text-xs mb-0.5">Job Description</div>
                              <div className="font-medium text-gray-900 text-xs truncate">
                                {jobDescriptions.find(j => j.id === config.jobDescriptionId)?.title || 'N/A'}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-600 text-xs mb-0.5">Duration</div>
                              <div className="font-medium text-gray-900 text-xs">{config.durationMinutes} min</div>
                            </div>
                            <div>
                              <div className="text-gray-600 text-xs mb-0.5">Questions</div>
                              <div className="font-medium text-gray-900 text-xs">{config.totalQuestions}</div>
                            </div>
                            <div>
                              <div className="text-gray-600 text-xs mb-0.5">Expires In</div>
                              <div className="font-medium text-gray-900 text-xs">{config.expiresInHours}h</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Statistics */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        <div className="bg-white border border-gray-200 rounded-lg p-2 sm:p-3 text-center">
                          <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{bulkResults.length}</div>
                          <div className="text-xs text-gray-600 mt-0.5">Total</div>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-3 text-center">
                          <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">
                            {bulkResults.filter(r => r.success).length}
                          </div>
                          <div className="text-xs text-green-700 mt-0.5">Success</div>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3 text-center">
                          <div className="text-lg sm:text-xl md:text-2xl font-bold text-red-600">
                            {bulkResults.filter(r => !r.success).length}
                          </div>
                          <div className="text-xs text-red-700 mt-0.5">Failed</div>
                        </div>
                      </div>
                    </div>

                    {/* Candidate Results List */}
                    <div>
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                        Candidate Results ({bulkResults.length})
                      </h3>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="max-h-64 sm:max-h-80 md:max-h-96 overflow-y-auto">
                          {/* Desktop Table View */}
                          <div className="hidden md:block">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Candidate
                                  </th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                  </th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Exam Link
                                  </th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {bulkResults.map((result) => (
                                  <tr key={result.candidateId} className={result.success ? 'bg-green-50' : 'bg-red-50'}>
                                    <td className="px-3 py-2 whitespace-nowrap">
                                      <div className="text-xs sm:text-sm font-medium text-gray-900">{result.candidateName}</div>
                                      <div className="text-xs text-gray-500">{result.candidateEmail}</div>
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap">
                                      {result.success ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                          <CheckCircle className="w-3 h-3 mr-1" />
                                          Success
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                          <AlertCircle className="w-3 h-3 mr-1" />
                                          Failed
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-3 py-2">
                                      {result.examLink ? (
                                        <div className="flex items-center space-x-1.5">
                                          <code className="text-xs text-gray-800 break-all max-w-xs">
                                            {result.examLink}
                                          </code>
                                          <button
                                            onClick={() => {
                                              navigator.clipboard.writeText(result.examLink!);
                                              setSuccess('Link copied!');
                                              setTimeout(() => setSuccess(null), 2000);
                                            }}
                                            className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
                                            title="Copy link"
                                          >
                                            <Copy className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ) : (
                                        <span className="text-xs text-gray-400">-</span>
                                      )}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap">
                                      {result.emailSent !== undefined ? (
                                        result.emailSent ? (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Sent
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                            Failed
                                          </span>
                                        )
                                      ) : (
                                        <span className="text-xs text-gray-400">N/A</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Mobile/Tablet Card View */}
                          <div className="md:hidden divide-y divide-gray-200">
                            {bulkResults.map((result) => (
                              <div key={result.candidateId} className={`p-3 ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900">{result.candidateName}</div>
                                    <div className="text-xs text-gray-500 truncate">{result.candidateEmail}</div>
                                  </div>
                                  <div className="ml-2">
                                    {result.success ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Success
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        Failed
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {result.examLink && (
                                  <div className="flex items-center space-x-1.5 mb-2">
                                    <code className="text-xs text-gray-800 break-all flex-1">
                                      {result.examLink}
                                    </code>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(result.examLink!);
                                        setSuccess('Link copied!');
                                        setTimeout(() => setSuccess(null), 2000);
                                      }}
                                      className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
                                      title="Copy link"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                                <div>
                                  {result.emailSent !== undefined ? (
                                    result.emailSent ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Email: Sent
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        Email: Failed
                                      </span>
                                    )
                                  ) : (
                                    <span className="text-xs text-gray-400">Email: N/A</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              {!bulkCreating && bulkResults.length > 0 && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 border-t border-gray-200 bg-gray-50">
                  <div className="text-xs text-gray-600">
                    {bulkResults.filter(r => r.success && r.examLink).length} exam link{bulkResults.filter(r => r.success && r.examLink).length !== 1 ? 's' : ''} available
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyAllLinks}
                      className="flex items-center space-x-1.5 px-3 py-1.5 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Copy Links</span>
                      <span className="sm:hidden">Copy</span>
                    </button>
                    <button
                      onClick={exportToCSV}
                      className="flex items-center space-x-1.5 px-3 py-1.5 text-xs sm:text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Export Excel</span>
                      <span className="sm:hidden">Export</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowBulkModal(false);
                        resetForm();
                      }}
                      className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamCreationPage;
