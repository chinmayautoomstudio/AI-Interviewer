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
  Loader2,
  FileText,
  Upload,
  Sparkles,
  User,
  Briefcase,
  GraduationCap,
  Code,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Candidate, JobDescription, GeneratedQuestion, CVBasedExamConfig } from '../../types';
import { getCandidates } from '../../services/candidates';
import { JobDescriptionsService } from '../../services/jobDescriptions';
import { examService } from '../../services/examService';
import { ExamEmailService, ExamEmailData } from '../../services/examEmailService';
import { n8nExamWorkflows, buildCvQuestionGenerationRequest } from '../../services/n8nExamWorkflows';
import { pdfTextExtractionService } from '../../services/pdfTextExtractionService';
import * as XLSX from 'xlsx';

type ExamCreationTab = 'job-based' | 'cv-based';

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
  scheduledDate?: string; // YYYY-MM-DD format
  scheduledTime?: string; // HH:mm format
  isScheduled?: boolean; // Whether exam is scheduled or can be accessed immediately
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

  // Tab state
  const [activeTab, setActiveTab] = useState<ExamCreationTab>('job-based');

  // Bulk creation state
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [candidateSearchTerm, setCandidateSearchTerm] = useState<string>('');
  const [bulkCreating, setBulkCreating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number; currentCandidate?: string } | null>(null);
  const [bulkResults, setBulkResults] = useState<BulkExamResult[]>([]);
  const [showBulkResults, setShowBulkResults] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  // CV-based exam state
  const [cvSelectedCandidateId, setCvSelectedCandidateId] = useState<string>('');
  const [cvSource, setCvSource] = useState<'existing' | 'upload'>('existing');
  const [cvUploadedFile, setCvUploadedFile] = useState<File | null>(null);
  const [cvUploadedText, setCvUploadedText] = useState<string>('');
  const [cvConfig, setCvConfig] = useState({
    durationMinutes: 30,
    totalQuestions: 15,
    expiresInHours: 48,
    technicalPercentage: 70,
    aptitudePercentage: 30,
    difficultyDistribution: { easy: 20, medium: 50, hard: 30 },
    sendEmailNotification: true,
    customEmailMessage: ''
  });
  const [cvFocusAreas, setCvFocusAreas] = useState<string[]>([]);
  const [cvGenerating, setCvGenerating] = useState(false);
  const [cvGeneratedQuestions, setCvGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [cvShowQuestionReview, setCvShowQuestionReview] = useState(false);
  const [cvCreating, setCvCreating] = useState(false);
  const [cvCreatedExamToken, setCvCreatedExamToken] = useState<string | null>(null);
  const [cvShowCandidateDetails, setCvShowCandidateDetails] = useState(true);

  const [config, setConfig] = useState<ExamConfig>({
    candidateId: '',
    jobDescriptionId: '',
    durationMinutes: 30,
    totalQuestions: 15,
    expiresInHours: 48,
    examTitle: '',
    instructions: '',
    sendEmailNotification: true,
    customEmailMessage: '',
    scheduledDate: '',
    scheduledTime: '',
    isScheduled: false
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
      customEmailMessage: '',
      scheduledDate: '',
      scheduledTime: '',
      isScheduled: false
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

    // Validate scheduled date/time if exam is scheduled
    if (config.isScheduled) {
      if (!config.scheduledDate || !config.scheduledTime) {
        setError('Please provide both scheduled date and time for the exam.');
        return;
      }

      const scheduledDateTime = new Date(`${config.scheduledDate}T${config.scheduledTime}`);
      const now = new Date();
      
      if (scheduledDateTime <= now) {
        setError('Scheduled date and time must be in the future.');
        return;
      }
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
          // Prepare scheduled_start_at if exam is scheduled
          let scheduledStartAt: string | undefined;
          if (config.isScheduled && config.scheduledDate && config.scheduledTime) {
            // Combine date and time, convert to ISO string
            const scheduledDateTime = new Date(`${config.scheduledDate}T${config.scheduledTime}`);
            scheduledStartAt = scheduledDateTime.toISOString();
          }

          // Create exam session
          const examSession = await examService.createExamSession({
            candidate_id: candidate.id,
            job_description_id: config.jobDescriptionId,
            duration_minutes: config.durationMinutes,
            total_questions: config.totalQuestions,
            expires_in_hours: config.expiresInHours,
            scheduled_start_at: scheduledStartAt
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

  // ===== CV-BASED EXAM HANDLERS =====

  // Get selected candidate for CV-based exam
  const cvSelectedCandidate = candidates.find(c => c.id === cvSelectedCandidateId);

  // Get candidate skills as array
  const getCandidateSkills = (candidate: Candidate): string[] => {
    if (!candidate.skills) return [];
    if (Array.isArray(candidate.skills)) {
      return candidate.skills.map(s => typeof s === 'string' ? s : s.name || String(s));
    }
    if (typeof candidate.skills === 'object') {
      const skills: string[] = [];
      Object.values(candidate.skills).forEach((group: any) => {
        if (Array.isArray(group)) {
          skills.push(...group.map(s => typeof s === 'string' ? s : String(s)));
        }
      });
      return skills;
    }
    return [];
  };

  // Handle CV file upload
  const handleCvFileUpload = async (file: File) => {
    setCvUploadedFile(file);
    setError(null);
    
    try {
      // Extract text from PDF
      if (file.type === 'application/pdf') {
        const result = await pdfTextExtractionService.extractText({ file });
        if (result.success && result.extracted_text) {
          setCvUploadedText(result.extracted_text);
        } else {
          throw new Error(result.error || 'Failed to extract text from PDF');
        }
      } else {
        // For other file types, read as text
        const text = await file.text();
        setCvUploadedText(text);
      }
    } catch (err) {
      console.error('Error reading CV file:', err);
      setError(err instanceof Error ? err.message : 'Failed to read CV file');
      setCvUploadedFile(null);
      setCvUploadedText('');
    }
  };

  // Handle CV file drop
  const handleCvDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'application/pdf' || file.type.includes('document'))) {
      handleCvFileUpload(file);
    } else {
      setError('Please upload a PDF or DOC file');
    }
  };

  // Toggle focus area selection
  const toggleFocusArea = (skill: string) => {
    setCvFocusAreas(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  // Generate questions from CV
  const handleGenerateQuestionsFromCV = async () => {
    if (!cvSelectedCandidate) {
      setError('Please select a candidate');
      return;
    }

    // Get CV data based on source
    let candidateData = cvSelectedCandidate;
    if (cvSource === 'upload' && cvUploadedText) {
      // Use uploaded CV text
      candidateData = {
        ...cvSelectedCandidate,
        resume_text: cvUploadedText
      };
    }

    setCvGenerating(true);
    setError(null);
    setCvGeneratedQuestions([]);

    try {
      const request = buildCvQuestionGenerationRequest(
        {
          name: candidateData.name,
          skills: candidateData.skills,
          experience: candidateData.experience,
          education: candidateData.education,
          projects: candidateData.projects,
          resume_summary: candidateData.resume_summary,
          resume_text: candidateData.resume_text
        },
        {
          total_questions: cvConfig.totalQuestions,
          technical_percentage: cvConfig.technicalPercentage,
          aptitude_percentage: cvConfig.aptitudePercentage,
          difficulty_distribution: cvConfig.difficultyDistribution,
          question_types: { mcq: 100, text: 0 }, // MCQ only for now
          focus_areas: cvFocusAreas.length > 0 ? cvFocusAreas : undefined
        }
      );

      const response = await n8nExamWorkflows.generateQuestionsFromCV(request);
      
      if (response.generated_questions && response.generated_questions.length > 0) {
        setCvGeneratedQuestions(response.generated_questions);
        setCvShowQuestionReview(true);
        setSuccess(`Successfully generated ${response.generated_questions.length} questions based on candidate's CV!`);
      } else {
        throw new Error('No questions were generated');
      }
    } catch (err) {
      console.error('Error generating questions from CV:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate questions from CV');
    } finally {
      setCvGenerating(false);
    }
  };

  // Create CV-based exam
  const handleCreateCVBasedExam = async () => {
    if (!cvSelectedCandidate) {
      setError('Please select a candidate');
      return;
    }

    if (cvGeneratedQuestions.length === 0) {
      setError('Please generate questions first');
      return;
    }

    setCvCreating(true);
    setError(null);

    try {
      const examSession = await examService.createCVBasedExamSession({
        candidate_id: cvSelectedCandidateId,
        duration_minutes: cvConfig.durationMinutes,
        total_questions: Math.min(cvConfig.totalQuestions, cvGeneratedQuestions.length),
        expires_in_hours: cvConfig.expiresInHours,
        cv_based: true,
        generated_questions: cvGeneratedQuestions,
        cv_snapshot: {
          skills: getCandidateSkills(cvSelectedCandidate),
          experience: cvSelectedCandidate.experience || [],
          education: cvSelectedCandidate.education || [],
          projects: cvSelectedCandidate.projects ? 
            (Array.isArray(cvSelectedCandidate.projects) ? cvSelectedCandidate.projects : [cvSelectedCandidate.projects]) 
            : [],
          resume_summary: cvSelectedCandidate.resume_summary
        }
      });

      setCvCreatedExamToken(examSession.exam_token);
      setSuccess('CV-based exam created successfully!');

      // Send email notification if enabled
      if (cvConfig.sendEmailNotification) {
        try {
          const emailData: ExamEmailData = {
            candidateName: cvSelectedCandidate.name,
            candidateEmail: cvSelectedCandidate.email,
            jobTitle: 'CV-Based Assessment',
            examDuration: cvConfig.durationMinutes,
            examToken: examSession.exam_token,
            expiresAt: examSession.expires_at,
            examLink: `${window.location.origin}/candidate/exam/${examSession.exam_token}`,
            customMessage: cvConfig.customEmailMessage || '',
            companyName: 'AI HR Saathi'
          };

          await ExamEmailService.sendExamInvitation(emailData);
        } catch (emailError) {
          console.warn('Failed to send email notification:', emailError);
        }
      }

    } catch (err) {
      console.error('Error creating CV-based exam:', err);
      setError(err instanceof Error ? err.message : 'Failed to create CV-based exam');
    } finally {
      setCvCreating(false);
    }
  };

  // Reset CV-based exam form
  const resetCVForm = () => {
    setCvSelectedCandidateId('');
    setCvSource('existing');
    setCvUploadedFile(null);
    setCvUploadedText('');
    setCvFocusAreas([]);
    setCvGeneratedQuestions([]);
    setCvShowQuestionReview(false);
    setCvCreatedExamToken(null);
    setCvConfig({
      durationMinutes: 30,
      totalQuestions: 15,
      expiresInHours: 48,
      technicalPercentage: 70,
      aptitudePercentage: 30,
      difficultyDistribution: { easy: 20, medium: 50, hard: 30 },
      sendEmailNotification: true,
      customEmailMessage: ''
    });
  };

  // Copy CV exam link
  const copyCvExamLink = () => {
    if (cvCreatedExamToken) {
      const examUrl = `${window.location.origin}/candidate/exam/${cvCreatedExamToken}`;
      navigator.clipboard.writeText(examUrl);
      setSuccess('Exam link copied to clipboard!');
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

        {/* Tab Navigation */}
        <div className="mb-4 sm:mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-1">
            <div className="flex">
              <button
                type="button"
                onClick={() => setActiveTab('job-based')}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'job-based'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Job Description Based</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('cv-based')}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'cv-based'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>CV-Based Exam</span>
              </button>
            </div>
          </div>
        </div>

        {/* Job Description Based Form */}
        {activeTab === 'job-based' && (
          <>
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

              {/* Scheduled Exam Section */}
              <div className="space-y-3 pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.isScheduled}
                      onChange={(e) => {
                        setConfig(prev => ({ 
                          ...prev, 
                          isScheduled: e.target.checked,
                          scheduledDate: e.target.checked ? prev.scheduledDate || '' : '',
                          scheduledTime: e.target.checked ? prev.scheduledTime || '' : ''
                        }));
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-700">Schedule Exam for Specific Date & Time</span>
                  </label>
                </div>

                {config.isScheduled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    {/* Scheduled Date */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        <span className="flex items-center space-x-1.5">
                          <Calendar className="w-4 h-4" />
                          <span>Scheduled Date</span>
                        </span>
                      </label>
                      <input
                        type="date"
                        value={config.scheduledDate || ''}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => {
                          const selectedDate = e.target.value;
                          setConfig(prev => ({ ...prev, scheduledDate: selectedDate }));
                        }}
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        required={config.isScheduled}
                      />
                    </div>

                    {/* Scheduled Time */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        <span className="flex items-center space-x-1.5">
                          <Clock className="w-4 h-4" />
                          <span>Scheduled Time</span>
                        </span>
                      </label>
                      <input
                        type="time"
                        value={config.scheduledTime || ''}
                        onChange={(e) => {
                          setConfig(prev => ({ ...prev, scheduledTime: e.target.value }));
                        }}
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        required={config.isScheduled}
                      />
                    </div>

                    {/* Info Message */}
                    {config.scheduledDate && config.scheduledTime && (
                      <div className="sm:col-span-2">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-xs text-blue-800">
                            <strong>Note:</strong> Candidates can access this exam 30 minutes before the scheduled start time. 
                            The exam will start at <strong>{new Date(`${config.scheduledDate}T${config.scheduledTime}`).toLocaleString()}</strong>.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
          </>
        )}

        {/* CV-Based Exam Form */}
        {activeTab === 'cv-based' && (
          <div className="space-y-6">
            {/* CV Exam Success Message */}
            {cvCreatedExamToken && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-900">CV-Based Exam Created!</h3>
                      <p className="text-sm text-green-700">Share this link with the candidate</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={copyCvExamLink}
                      className="flex items-center space-x-1.5 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copy Link</span>
                    </button>
                    <button
                      onClick={resetCVForm}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      Create Another
                    </button>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-white rounded-lg border">
                  <code className="text-sm text-gray-800 break-all">
                    {`${window.location.origin}/candidate/exam/${cvCreatedExamToken}`}
                  </code>
                </div>
              </div>
            )}

            {/* Main CV Form */}
            {!cvCreatedExamToken && (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 sm:p-6 space-y-6">
                  {/* Section: Select Candidate */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <User className="w-4 h-4 text-purple-600" />
                      </div>
                      <h2 className="text-base font-semibold text-gray-900">Select Candidate</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Candidate Dropdown */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Candidate</label>
                        <select
                          value={cvSelectedCandidateId}
                          onChange={(e) => {
                            setCvSelectedCandidateId(e.target.value);
                            setCvFocusAreas([]);
                            setCvGeneratedQuestions([]);
                            setCvShowQuestionReview(false);
                          }}
                          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                        >
                          <option value="">Select a candidate...</option>
                          {candidates.map((candidate) => (
                            <option key={candidate.id} value={candidate.id}>
                              {candidate.name} - {candidate.email}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* CV Source Selection */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">CV Source</label>
                        <div className="flex space-x-3">
                          <button
                            type="button"
                            onClick={() => setCvSource('existing')}
                            className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                              cvSource === 'existing'
                                ? 'bg-purple-50 border-purple-500 text-purple-700'
                                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <FileText className="w-4 h-4" />
                            <span>Use Existing CV</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setCvSource('upload')}
                            className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                              cvSource === 'upload'
                                ? 'bg-purple-50 border-purple-500 text-purple-700'
                                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <Upload className="w-4 h-4" />
                            <span>Upload New CV</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* CV Upload Area */}
                    {cvSource === 'upload' && (
                      <div
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors cursor-pointer"
                        onDrop={handleCvDrop}
                        onDragOver={(e) => e.preventDefault()}
                        onClick={() => document.getElementById('cv-file-input')?.click()}
                      >
                        <input
                          id="cv-file-input"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleCvFileUpload(file);
                          }}
                        />
                        {cvUploadedFile ? (
                          <div className="space-y-2">
                            <FileText className="w-10 h-10 text-purple-500 mx-auto" />
                            <p className="text-sm font-medium text-gray-900">{cvUploadedFile.name}</p>
                            <p className="text-xs text-green-600">File uploaded successfully</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload className="w-10 h-10 text-gray-400 mx-auto" />
                            <p className="text-sm text-gray-600">
                              Drag and drop a CV file, or click to browse
                            </p>
                            <p className="text-xs text-gray-400">Supports PDF, DOC, DOCX (max 5MB)</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Candidate CV Preview */}
                  {cvSelectedCandidate && cvSource === 'existing' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="w-4 h-4 text-blue-600" />
                          </div>
                          <h2 className="text-base font-semibold text-gray-900">Candidate CV Data</h2>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCvShowCandidateDetails(!cvShowCandidateDetails)}
                          className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1"
                        >
                          <span>{cvShowCandidateDetails ? 'Hide' : 'Show'} Details</span>
                          {cvShowCandidateDetails ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {cvShowCandidateDetails && (
                        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                          {/* Skills */}
                          {getCandidateSkills(cvSelectedCandidate).length > 0 && (
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <Code className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">Skills</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {getCandidateSkills(cvSelectedCandidate).slice(0, 20).map((skill, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                                  >
                                    {skill}
                                  </span>
                                ))}
                                {getCandidateSkills(cvSelectedCandidate).length > 20 && (
                                  <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                                    +{getCandidateSkills(cvSelectedCandidate).length - 20} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Experience */}
                          {Array.isArray(cvSelectedCandidate.experience) && cvSelectedCandidate.experience.length > 0 && (
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <Briefcase className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">Experience</span>
                              </div>
                              <div className="space-y-2">
                                {cvSelectedCandidate.experience.slice(0, 3).map((exp: any, idx: number) => (
                                  <div key={idx} className="text-sm text-gray-600">
                                    <span className="font-medium">{exp.title || exp.position}</span>
                                    {exp.company && <span> at {exp.company}</span>}
                                    {exp.duration && <span className="text-gray-400"> ({exp.duration})</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Education */}
                          {Array.isArray(cvSelectedCandidate.education) && cvSelectedCandidate.education.length > 0 && (
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <GraduationCap className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">Education</span>
                              </div>
                              <div className="space-y-1">
                                {cvSelectedCandidate.education.slice(0, 2).map((edu: any, idx: number) => (
                                  <div key={idx} className="text-sm text-gray-600">
                                    <span className="font-medium">{edu.degree}</span>
                                    {edu.institution && <span> - {edu.institution}</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Resume Summary */}
                          {cvSelectedCandidate.resume_summary && (
                            <div>
                              <span className="text-sm font-medium text-gray-700">Summary</span>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-3">
                                {cvSelectedCandidate.resume_summary}
                              </p>
                            </div>
                          )}

                          {/* No CV Data Warning */}
                          {!getCandidateSkills(cvSelectedCandidate).length && 
                           !cvSelectedCandidate.experience?.length && 
                           !cvSelectedCandidate.resume_summary && (
                            <div className="text-center py-4">
                              <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                              <p className="text-sm text-gray-600">
                                No CV data found for this candidate.
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                Try uploading a new CV or select a different candidate.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Focus Areas Selection */}
                  {cvSelectedCandidate && getCandidateSkills(cvSelectedCandidate).length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Sparkles className="w-4 h-4 text-orange-600" />
                        </div>
                        <h2 className="text-base font-semibold text-gray-900">Focus Areas (Optional)</h2>
                      </div>
                      <p className="text-sm text-gray-600">
                        Select specific skills to focus the questions on, or leave empty to cover all skills.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {getCandidateSkills(cvSelectedCandidate).slice(0, 15).map((skill, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => toggleFocusArea(skill)}
                            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                              cvFocusAreas.includes(skill)
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {skill}
                          </button>
                        ))}
                      </div>
                      {cvFocusAreas.length > 0 && (
                        <p className="text-xs text-purple-600">
                          {cvFocusAreas.length} focus area{cvFocusAreas.length !== 1 ? 's' : ''} selected
                        </p>
                      )}
                    </div>
                  )}

                  {/* Exam Configuration */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Settings className="w-4 h-4 text-green-600" />
                      </div>
                      <h2 className="text-base font-semibold text-gray-900">Exam Configuration</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                          value={cvConfig.durationMinutes}
                          onChange={(e) => setCvConfig(prev => ({ ...prev, durationMinutes: parseInt(e.target.value) || 30 }))}
                          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Total Questions</label>
                        <input
                          type="number"
                          min="5"
                          max="50"
                          value={cvConfig.totalQuestions}
                          onChange={(e) => setCvConfig(prev => ({ ...prev, totalQuestions: parseInt(e.target.value) || 15 }))}
                          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Expires In</label>
                        <select
                          value={cvConfig.expiresInHours}
                          onChange={(e) => setCvConfig(prev => ({ ...prev, expiresInHours: parseInt(e.target.value) }))}
                          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value={24}>24 hours</option>
                          <option value={48}>48 hours</option>
                          <option value={72}>72 hours</option>
                          <option value={168}>1 week</option>
                        </select>
                      </div>
                    </div>

                    {/* Technical/Aptitude Split */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Technical Questions (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={cvConfig.technicalPercentage}
                          onChange={(e) => {
                            const tech = parseInt(e.target.value) || 0;
                            setCvConfig(prev => ({
                              ...prev,
                              technicalPercentage: Math.min(100, Math.max(0, tech)),
                              aptitudePercentage: 100 - Math.min(100, Math.max(0, tech))
                            }));
                          }}
                          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Aptitude Questions (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={cvConfig.aptitudePercentage}
                          onChange={(e) => {
                            const apt = parseInt(e.target.value) || 0;
                            setCvConfig(prev => ({
                              ...prev,
                              aptitudePercentage: Math.min(100, Math.max(0, apt)),
                              technicalPercentage: 100 - Math.min(100, Math.max(0, apt))
                            }));
                          }}
                          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Difficulty Distribution */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Difficulty Distribution (%)
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-green-600">Easy</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={cvConfig.difficultyDistribution.easy}
                            onChange={(e) => {
                              const easy = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                              const remaining = 100 - easy;
                              const currentMediumHard = cvConfig.difficultyDistribution.medium + cvConfig.difficultyDistribution.hard;
                              const ratio = currentMediumHard > 0 ? remaining / currentMediumHard : 0.5;
                              setCvConfig(prev => ({
                                ...prev,
                                difficultyDistribution: {
                                  easy,
                                  medium: Math.round(prev.difficultyDistribution.medium * ratio),
                                  hard: remaining - Math.round(prev.difficultyDistribution.medium * ratio)
                                }
                              }));
                            }}
                            className="w-full px-3 py-2 text-sm border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-yellow-600">Medium</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={cvConfig.difficultyDistribution.medium}
                            onChange={(e) => {
                              const medium = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                              const remaining = 100 - medium;
                              const currentEasyHard = cvConfig.difficultyDistribution.easy + cvConfig.difficultyDistribution.hard;
                              const ratio = currentEasyHard > 0 ? remaining / currentEasyHard : 0.5;
                              setCvConfig(prev => ({
                                ...prev,
                                difficultyDistribution: {
                                  easy: Math.round(prev.difficultyDistribution.easy * ratio),
                                  medium,
                                  hard: remaining - Math.round(prev.difficultyDistribution.easy * ratio)
                                }
                              }));
                            }}
                            className="w-full px-3 py-2 text-sm border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-red-600">Hard</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={cvConfig.difficultyDistribution.hard}
                            onChange={(e) => {
                              const hard = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                              const remaining = 100 - hard;
                              const currentEasyMedium = cvConfig.difficultyDistribution.easy + cvConfig.difficultyDistribution.medium;
                              const ratio = currentEasyMedium > 0 ? remaining / currentEasyMedium : 0.5;
                              setCvConfig(prev => ({
                                ...prev,
                                difficultyDistribution: {
                                  easy: Math.round(prev.difficultyDistribution.easy * ratio),
                                  medium: remaining - Math.round(prev.difficultyDistribution.easy * ratio),
                                  hard
                                }
                              }));
                            }}
                            className="w-full px-3 py-2 text-sm border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Total: {cvConfig.difficultyDistribution.easy + cvConfig.difficultyDistribution.medium + cvConfig.difficultyDistribution.hard}%
                      </p>
                    </div>
                  </div>

                  {/* Email Notification */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Mail className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Send Email Invitation</h3>
                          <p className="text-xs text-gray-600">Automatically send exam invitation</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cvConfig.sendEmailNotification}
                          onChange={(e) => setCvConfig(prev => ({ ...prev, sendEmailNotification: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  </div>

                  {/* Generate Questions Button */}
                  {!cvShowQuestionReview && (
                    <div className="flex justify-end pt-4 border-t">
                      <button
                        type="button"
                        onClick={handleGenerateQuestionsFromCV}
                        disabled={!cvSelectedCandidateId || cvGenerating || (cvSource === 'upload' && !cvUploadedText)}
                        className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {cvGenerating ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Generating Questions...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5" />
                            <span>Generate Questions from CV</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Question Review Section */}
                  {cvShowQuestionReview && cvGeneratedQuestions.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <div className="p-2 bg-indigo-100 rounded-lg">
                            <Eye className="w-4 h-4 text-indigo-600" />
                          </div>
                          <h2 className="text-base font-semibold text-gray-900">
                            Generated Questions ({cvGeneratedQuestions.length})
                          </h2>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setCvShowQuestionReview(false);
                            setCvGeneratedQuestions([]);
                          }}
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          Regenerate
                        </button>
                      </div>

                      <div className="max-h-96 overflow-y-auto space-y-3 border rounded-lg p-3">
                        {cvGeneratedQuestions.map((question, idx) => (
                          <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <span className="text-xs font-medium text-gray-500">Q{idx + 1}</span>
                              <div className="flex space-x-1.5">
                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                  question.difficulty_level === 'easy' ? 'bg-green-100 text-green-700' :
                                  question.difficulty_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {question.difficulty_level}
                                </span>
                                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                                  {question.question_category || question.category}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-800 mb-2">{question.question_text}</p>
                            {question.mcq_options && (
                              <div className="space-y-1 ml-3">
                                {question.mcq_options.map((opt, optIdx) => (
                                  <div key={optIdx} className={`text-xs ${
                                    opt.option === question.correct_answer 
                                      ? 'text-green-600 font-medium' 
                                      : 'text-gray-500'
                                  }`}>
                                    {opt.option}. {opt.text}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Create Exam Button */}
                      <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button
                          type="button"
                          onClick={() => navigate('/exams')}
                          className="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleCreateCVBasedExam}
                          disabled={cvCreating}
                          className="flex items-center space-x-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {cvCreating ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Creating Exam...</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              <span>Create CV-Based Exam</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamCreationPage;
