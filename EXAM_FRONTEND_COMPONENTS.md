# Exam System - Frontend Components Implementation

## 🎨 Frontend Architecture Overview

The exam system frontend consists of React components built with TypeScript, Tailwind CSS, and integrates with the existing AI HR Saathi design system. Components are organized by functionality and user role.

## 📁 Component Structure

```
src/
├── pages/
│   ├── ExamManagementPage.tsx        # Admin exam management
│   ├── CandidateExamPage.tsx         # Exam taking interface
│   ├── ExamLinkPage.tsx              # Token validation & entry
│   ├── ExamResultsPage.tsx           # Results display
│   └── ExamQuestionEditorPage.tsx    # HR question management
├── components/
│   ├── exam/
│   │   ├── ExamTimer.tsx             # Countdown timer
│   │   ├── MCQQuestion.tsx           # Multiple choice display
│   │   ├── TextQuestion.tsx          # Text answer input
│   │   ├── QuestionNavigator.tsx     # Question navigation
│   │   ├── ExamProgressBar.tsx       # Progress indicator
│   │   ├── ExamInstructions.tsx      # Rules modal
│   │   ├── QuestionEditor.tsx        # HR question editor
│   │   ├── QuestionPreview.tsx       # Question preview
│   │   └── ResultsBreakdown.tsx      # Results visualization
│   └── modals/
│       ├── ExamInvitationModal.tsx   # Send exam invitations
│       ├── QuestionApprovalModal.tsx # Approve/reject questions
│       └── ExamSettingsModal.tsx     # Configure exam settings
└── types/
    └── exam.ts                       # Exam-specific types
```

## 🎯 1. Admin Pages

### ExamManagementPage.tsx

**Purpose**: Central hub for HR to manage exams, questions, and monitor sessions

```typescript
import React, { useState, useEffect } from 'react';
import { ExamService, ExamQuestionGenerator } from '../services';
import { ExamSession, ExamQuestion, JobDescription } from '../types';

export const ExamManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'questions' | 'sessions' | 'invitations'>('questions');
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [activeSessions, setActiveSessions] = useState<ExamSession[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>('');

  // Question Management
  const handleGenerateQuestions = async (jobId: string) => {
    const result = await ExamQuestionGenerator.triggerAIGeneration(jobId, 30);
    if (result.success) {
      // Refresh questions list
      await loadQuestions(jobId);
    }
  };

  const handleCreateManualQuestion = async (questionData: CreateQuestionRequest) => {
    const result = await ExamQuestionGenerator.createManualQuestion(questionData);
    if (result.success) {
      await loadQuestions(selectedJob);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Exam Management</h1>
          <p className="text-gray-600 mt-2">Manage questions, create exams, and monitor sessions</p>
        </div>

        {/* Job Selection */}
        <div className="mb-6">
          <JobSelector 
            selectedJob={selectedJob} 
            onJobChange={setSelectedJob}
            onJobSelect={loadQuestions}
          />
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'questions', label: 'Question Bank', count: questions.length },
              { id: 'sessions', label: 'Active Sessions', count: activeSessions.length },
              { id: 'invitations', label: 'Send Invitations', count: 0 }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'questions' && (
          <QuestionManagementTab 
            jobId={selectedJob}
            questions={questions}
            onGenerateQuestions={handleGenerateQuestions}
            onCreateQuestion={handleCreateManualQuestion}
            onUpdateQuestions={setQuestions}
          />
        )}

        {activeTab === 'sessions' && (
          <ActiveSessionsTab 
            sessions={activeSessions}
            onRefresh={loadActiveSessions}
          />
        )}

        {activeTab === 'invitations' && (
          <ExamInvitationsTab 
            jobId={selectedJob}
            onSendInvitations={handleSendInvitations}
          />
        )}
      </div>
    </div>
  );
};
```

### QuestionManagementTab Component

```typescript
const QuestionManagementTab: React.FC<{
  jobId: string;
  questions: ExamQuestion[];
  onGenerateQuestions: (jobId: string) => void;
  onCreateQuestion: (data: CreateQuestionRequest) => void;
  onUpdateQuestions: (questions: ExamQuestion[]) => void;
}> = ({ jobId, questions, onGenerateQuestions, onCreateQuestion, onUpdateQuestions }) => {
  const [inputMethod, setInputMethod] = useState<'existing' | 'upload' | 'manual' | 'topic'>('existing');
  const [selectedJobDescription, setSelectedJobDescription] = useState<string>(jobId);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [manualJobDescription, setManualJobDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [topicInsights, setTopicInsights] = useState('');
  const [generating, setGenerating] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [availableJobDescriptions, setAvailableJobDescriptions] = useState<JobDescription[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    difficulty: 'all',
    status: 'all'
  });

  const filteredQuestions = questions.filter(q => {
    if (filters.category !== 'all' && q.question_category !== filters.category) return false;
    if (filters.difficulty !== 'all' && q.difficulty_level !== filters.difficulty) return false;
    if (filters.status !== 'all' && q.status !== filters.status) return false;
    return true;
  });

  const handleEnhancedGenerateQuestions = async () => {
    setGenerating(true);
    try {
      let content = '';
      
      switch (inputMethod) {
        case 'existing':
          if (!selectedJobDescription) {
            alert('Please select a job description');
            return;
          }
          const job = availableJobDescriptions.find(jd => jd.id === selectedJobDescription);
          content = `${job?.title}\n\n${job?.description}\n\n${job?.requirements}`;
          break;
          
        case 'upload':
          if (!uploadedFile) {
            alert('Please upload a job description file');
            return;
          }
          // Use extracted text if available, otherwise extract from file
          if (extractedText) {
            content = extractedText;
          } else {
            content = await extractTextFromFile(uploadedFile);
          }
          break;
          
        case 'manual':
          if (!manualJobDescription.trim()) {
            alert('Please enter the job description');
            return;
          }
          content = manualJobDescription;
          break;
          
        case 'topic':
          if (!topic.trim() || !topicInsights.trim()) {
            alert('Please provide both topic and insights');
            return;
          }
          content = `Topic: ${topic}\n\nInsights: ${topicInsights}`;
          break;
      }

      const result = await ExamQuestionGenerator.generateQuestions({
        content,
        inputMethod,
        questionCount: 20,
        distribution: { technical: 70, aptitude: 30 }
      });

      if (result.success) {
        // Refresh questions list
        onUpdateQuestions([...questions, ...result.questions]);
      }
    } catch (error) {
      console.error('Question generation failed:', error);
    } finally {
      setGenerating(false);
    }
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    if (file.type === 'text/plain') {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target?.result as string);
        };
        reader.onerror = reject;
        reader.readAsText(file);
      });
    } else if (file.type === 'application/pdf') {
      // Call backend service to extract text from PDF
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/extract-pdf-text', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to extract text from PDF');
      }
      
      const result = await response.json();
      return result.extractedText;
    } else {
      throw new Error('Unsupported file type');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.type === 'text/plain' || file.type === 'application/pdf') {
      setUploadedFile(file);
      setExtractedText(''); // Reset extracted text
      
      // Auto-extract text for PDF files
      if (file.type === 'application/pdf') {
        setExtracting(true);
        try {
          const text = await extractTextFromFile(file);
          setExtractedText(text);
        } catch (error) {
          console.error('Failed to extract text from PDF:', error);
          alert('Failed to extract text from PDF. Please try again or use manual input.');
        } finally {
          setExtracting(false);
        }
      }
    } else {
      alert('Please upload a .txt or .pdf file');
    }
  };

  const isInputValid = (): boolean => {
    switch (inputMethod) {
      case 'existing':
        return selectedJobDescription !== '';
      case 'upload':
        return uploadedFile !== null;
      case 'manual':
        return manualJobDescription.trim() !== '';
      case 'topic':
        return topic.trim() !== '' && topicInsights.trim() !== '';
      default:
        return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Question Generation Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Question Generation</h3>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            ➕ Add Manual Question
          </button>
        </div>

        {/* Input Method Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Choose Input Method
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => setInputMethod('existing')}
              className={`p-3 border rounded-lg text-center ${
                inputMethod === 'existing' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="text-2xl mb-1">📋</div>
              <div className="text-sm font-medium">Existing JD</div>
            </button>
            
            <button
              onClick={() => setInputMethod('upload')}
              className={`p-3 border rounded-lg text-center ${
                inputMethod === 'upload' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="text-2xl mb-1">📄</div>
              <div className="text-sm font-medium">Upload PDF</div>
            </button>
            
            <button
              onClick={() => setInputMethod('manual')}
              className={`p-3 border rounded-lg text-center ${
                inputMethod === 'manual' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="text-2xl mb-1">✍️</div>
              <div className="text-sm font-medium">Type Manually</div>
            </button>
            
            <button
              onClick={() => setInputMethod('topic')}
              className={`p-3 border rounded-lg text-center ${
                inputMethod === 'topic' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="text-2xl mb-1">💡</div>
              <div className="text-sm font-medium">Custom Topic</div>
            </button>
          </div>
        </div>

        {/* Input Content Based on Selected Method */}
        <div className="space-y-4">
          {inputMethod === 'existing' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Job Description
              </label>
              <select
                value={selectedJobDescription}
                onChange={(e) => setSelectedJobDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Choose a job description...</option>
                {availableJobDescriptions.map(jd => (
                  <option key={jd.id} value={jd.id}>
                    {jd.title} - {jd.company}
                  </option>
                ))}
              </select>
              {selectedJobDescription && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">
                    <strong>Selected:</strong> {availableJobDescriptions.find(jd => jd.id === selectedJobDescription)?.title}
                  </div>
                </div>
              )}
            </div>
          )}

          {inputMethod === 'upload' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Job Description File
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer"
                >
                  <div className="text-4xl text-gray-400 mb-2">📁</div>
                  <div className="text-sm text-gray-600">
                    Click to upload or drag and drop
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Supports PDF files
                  </div>
                </label>
              </div>
              
              {extracting && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-700 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
                    Extracting text from PDF...
                  </div>
                </div>
              )}
              
              {uploadedFile && !extracting && (
                <div className="mt-2 p-3 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-700">
                    <strong>Uploaded:</strong> {uploadedFile.name}
                  </div>
                </div>
              )}
              
              {extractedText && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Extracted Text (Preview)
                  </label>
                  <div className="border border-gray-300 rounded-lg p-3 bg-gray-50 max-h-40 overflow-y-auto">
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {extractedText.length > 500 ? 
                        `${extractedText.substring(0, 500)}...` : 
                        extractedText
                      }
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {extractedText.length} characters extracted
                  </div>
                </div>
              )}
            </div>
          )}

          {inputMethod === 'manual' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Description Content
              </label>
              <textarea
                value={manualJobDescription}
                onChange={(e) => setManualJobDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 h-48"
                placeholder="Enter the job description content here. Include job title, responsibilities, requirements, skills needed, etc..."
              />
              <div className="text-xs text-gray-500 mt-1">
                {manualJobDescription.length} characters
              </div>
            </div>
          )}

          {inputMethod === 'topic' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topic/Subject
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="e.g., React Development, Data Analysis, Project Management"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topic Insights & Context
                </label>
                <textarea
                  value={topicInsights}
                  onChange={(e) => setTopicInsights(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 h-32"
                  placeholder="Provide detailed insights about the topic, key concepts, skills required, common challenges, etc..."
                />
              </div>
            </div>
          )}

          <button
            onClick={handleEnhancedGenerateQuestions}
            disabled={generating || !isInputValid()}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? 'Generating Questions...' : 'Generate Questions with AI'}
          </button>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">

        {/* Filters */}
        <div className="flex space-x-4">
          <select
            value={filters.category}
            onChange={(e) => setFilters({...filters, category: e.target.value})}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="all">All Categories</option>
            <option value="technical">Technical</option>
            <option value="aptitude">Aptitude</option>
          </select>
          <select
            value={filters.difficulty}
            onChange={(e) => setFilters({...filters, difficulty: e.target.value})}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Questions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredQuestions.map(question => (
          <QuestionCard
            key={question.id}
            question={question}
            onUpdate={onUpdateQuestions}
          />
        ))}
      </div>

      {/* Create Question Modal */}
      {showCreateModal && (
        <QuestionEditorModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={onCreateQuestion}
          jobId={jobId}
        />
      )}
    </div>
  );
};
```

## 🎓 2. Candidate Pages

### CandidateExamPage.tsx

**Purpose**: Main exam-taking interface with adaptive questions and real-time features

```typescript
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExamService } from '../services';
import { ExamSession, ExamQuestion, ExamResponse } from '../types';

export const CandidateExamPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [examSession, setExamSession] = useState<ExamSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [responses, setResponses] = useState<Map<string, string>>(new Map());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  // Load exam session
  useEffect(() => {
    if (token) {
      loadExamSession(token);
    }
  }, [token]);

  // Timer effect
  useEffect(() => {
    if (examSession && examSession.status === 'in_progress') {
      const interval = setInterval(() => {
        const now = Date.now();
        const startTime = new Date(examSession.started_at!).getTime();
        const elapsed = (now - startTime) / 1000 / 60; // minutes
        const remaining = examSession.duration_minutes - elapsed;
        
        setTimeRemaining(Math.max(0, remaining));
        
        if (remaining <= 0) {
          handleAutoSubmit();
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [examSession]);

  // Auto-save effect
  useEffect(() => {
    if (currentAnswer && examSession) {
      const autoSaveTimer = setTimeout(() => {
        autoSaveAnswer();
      }, 30000); // 30 seconds

      return () => clearTimeout(autoSaveTimer);
    }
  }, [currentAnswer]);

  const loadExamSession = async (examToken: string) => {
    const result = await ExamService.getExamByToken(examToken);
    if (result.success && result.data) {
      setExamSession(result.data);
      
      // Start exam if not already started
      if (result.data.status === 'pending') {
        await ExamService.startExam(result.data.id);
        setExamSession({ ...result.data, status: 'in_progress' });
      }
    } else {
      navigate('/candidate/login', { state: { error: result.error } });
    }
  };

  const autoSaveAnswer = useCallback(async () => {
    if (currentAnswer && examSession && currentQuestionIndex < examSession.questions_list.length) {
      const questionId = examSession.questions_list[currentQuestionIndex].id;
      await ExamService.autoSaveAnswer(examSession.id, questionId, currentAnswer);
    }
  }, [currentAnswer, examSession, currentQuestionIndex]);

  const handleAnswerChange = (answer: string) => {
    setCurrentAnswer(answer);
    setResponses(prev => new Map(prev.set(
      examSession!.questions_list[currentQuestionIndex].id, 
      answer
    )));
  };

  const handleNextQuestion = async () => {
    // Submit current answer
    if (currentAnswer && examSession) {
      const questionId = examSession.questions_list[currentQuestionIndex].id;
      await ExamService.submitAnswer(examSession.id, questionId, currentAnswer);
    }

    // Move to next question
    if (currentQuestionIndex < examSession!.questions_list.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      const nextQuestionId = examSession!.questions_list[currentQuestionIndex + 1].id;
      setCurrentAnswer(responses.get(nextQuestionId) || '');
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      const prevQuestionId = examSession!.questions_list[currentQuestionIndex - 1].id;
      setCurrentAnswer(responses.get(prevQuestionId) || '');
    }
  };

  const handleSubmitExam = async () => {
    setIsSubmitting(true);
    
    // Submit final answer
    if (currentAnswer && examSession) {
      const questionId = examSession.questions_list[currentQuestionIndex].id;
      await ExamService.submitAnswer(examSession.id, questionId, currentAnswer);
    }

    // Complete exam
    const result = await ExamService.completeExam(examSession!.id);
    if (result.success) {
      navigate(`/exam/results/${examSession!.id}`);
    }
    
    setIsSubmitting(false);
  };

  const handleAutoSubmit = async () => {
    await handleSubmitExam();
  };

  if (!examSession) {
    return <div className="flex justify-center items-center h-screen">
      <div className="text-lg">Loading exam...</div>
    </div>;
  }

  if (showInstructions) {
    return (
      <ExamInstructions
        examSession={examSession}
        onStart={() => setShowInstructions(false)}
      />
    );
  }

  const currentQuestion = examSession.questions_list[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Online Examination</h1>
              <p className="text-sm text-gray-600">Question {currentQuestionIndex + 1} of {examSession.questions_list.length}</p>
            </div>
            <ExamTimer 
              timeRemaining={timeRemaining}
              onTimeUp={handleAutoSubmit}
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              {/* Question */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {currentQuestion.category}
                  </span>
                  <span className="text-sm text-gray-500">
                    {currentQuestion.difficulty} • {currentQuestion.points} point{currentQuestion.points > 1 ? 's' : ''}
                  </span>
                </div>
                
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  {currentQuestion.question_text}
                </h2>

                {/* Question Component */}
                {currentQuestion.question_type === 'mcq' ? (
                  <MCQQuestion
                    question={currentQuestion}
                    selectedAnswer={currentAnswer}
                    onAnswerChange={handleAnswerChange}
                  />
                ) : (
                  <TextQuestion
                    question={currentQuestion}
                    answer={currentAnswer}
                    onAnswerChange={handleAnswerChange}
                  />
                )}
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center pt-6 border-t">
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>

                <div className="flex space-x-2">
                  {currentQuestionIndex === examSession.questions_list.length - 1 ? (
                    <button
                      onClick={handleSubmitExam}
                      disabled={isSubmitting}
                      className="px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Exam'}
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuestion}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                    >
                      Next →
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <QuestionNavigator
              questions={examSession.questions_list}
              currentIndex={currentQuestionIndex}
              responses={responses}
              onQuestionSelect={setCurrentQuestionIndex}
            />
            
            <ExamProgressBar
              totalQuestions={examSession.questions_list.length}
              answeredQuestions={responses.size}
              timeRemaining={timeRemaining}
              totalTime={examSession.duration_minutes}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
```

### ExamResultsPage.tsx

**Purpose**: Display detailed exam results immediately after completion

```typescript
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ExamResultsService } from '../services';
import { ExamResult, PerformanceAnalytics } from '../types';

export const ExamResultsPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [results, setResults] = useState<ExamResult | null>(null);
  const [analytics, setAnalytics] = useState<PerformanceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      loadResults(sessionId);
    }
  }, [sessionId]);

  const loadResults = async (sessionId: string) => {
    const [resultsResult, analyticsResult] = await Promise.all([
      ExamResultsService.getExamResults(sessionId),
      ExamResultsService.getExamAnalytics(sessionId)
    ]);

    if (resultsResult.success) {
      setResults(resultsResult.results);
    }
    if (analyticsResult) {
      setAnalytics(analyticsResult);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg">Loading results...</div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg text-red-600">Results not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Exam Results</h1>
          <p className="text-gray-600">Your performance summary and detailed analysis</p>
        </div>

        {/* Overall Score Card */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {results.percentage}%
            </div>
            <div className={`text-lg font-medium mb-4 ${
              results.evaluation_status === 'passed' ? 'text-green-600' : 'text-red-600'
            }`}>
              {results.evaluation_status === 'passed' ? '✅ Passed' : '❌ Failed'}
            </div>
            <div className="text-gray-600">
              {results.correct_answers} out of {results.correct_answers + results.wrong_answers} questions correct
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <ResultsBreakdown
            title="Technical Questions"
            score={results.technical_score}
            maxScore={results.technical_max_score}
            percentage={results.technical_max_score > 0 ? 
              (results.technical_score / results.technical_max_score) * 100 : 0
            }
            color="blue"
          />
          <ResultsBreakdown
            title="Aptitude Questions"
            score={results.aptitude_score}
            maxScore={results.aptitude_max_score}
            percentage={results.aptitude_max_score > 0 ? 
              (results.aptitude_score / results.aptitude_max_score) * 100 : 0
            }
            color="green"
          />
        </div>

        {/* Performance Analytics */}
        {analytics && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {results.time_taken_minutes}m
                </div>
                <div className="text-sm text-gray-600">Time Taken</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {results.avg_time_per_question}s
                </div>
                <div className="text-sm text-gray-600">Avg per Question</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {analytics.difficultyProgression?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Adaptive Questions</div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => window.print()}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            📄 Print Results
          </button>
          <button
            onClick={() => window.location.href = '/candidate/dashboard'}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
          >
            🏠 Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
```

## 🧩 3. Reusable Components

### ExamTimer.tsx

```typescript
import React, { useState, useEffect } from 'react';

interface ExamTimerProps {
  timeRemaining: number; // in minutes
  onTimeUp: () => void;
}

export const ExamTimer: React.FC<ExamTimerProps> = ({ timeRemaining, onTimeUp }) => {
  const [warningShown, setWarningShown] = useState(false);

  useEffect(() => {
    if (timeRemaining <= 5 && !warningShown) {
      setWarningShown(true);
      // Show warning notification
    }
    
    if (timeRemaining <= 0) {
      onTimeUp();
    }
  }, [timeRemaining, onTimeUp, warningShown]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.floor((minutes % 1) * 60);
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeRemaining <= 5) return 'text-red-600 bg-red-100';
    if (timeRemaining <= 15) return 'text-yellow-600 bg-yellow-100';
    return 'text-blue-600 bg-blue-100';
  };

  return (
    <div className={`px-4 py-2 rounded-lg font-mono text-lg font-bold ${getTimerColor()}`}>
      ⏰ {formatTime(timeRemaining)}
    </div>
  );
};
```

### MCQQuestion.tsx

```typescript
import React from 'react';
import { ExamQuestion } from '../types';

interface MCQQuestionProps {
  question: ExamQuestion;
  selectedAnswer: string;
  onAnswerChange: (answer: string) => void;
}

export const MCQQuestion: React.FC<MCQQuestionProps> = ({ 
  question, 
  selectedAnswer, 
  onAnswerChange 
}) => {
  const options = question.mcq_options || [];

  return (
    <div className="space-y-3">
      {options.map((option, index) => (
        <label
          key={index}
          className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
            selectedAnswer === option.option
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input
            type="radio"
            name={`question-${question.id}`}
            value={option.option}
            checked={selectedAnswer === option.option}
            onChange={(e) => onAnswerChange(e.target.value)}
            className="sr-only"
          />
          <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
            selectedAnswer === option.option
              ? 'border-blue-500 bg-blue-500'
              : 'border-gray-300'
          }`}>
            {selectedAnswer === option.option && (
              <div className="w-2 h-2 rounded-full bg-white"></div>
            )}
          </div>
          <div className="flex-1">
            <span className="font-medium text-gray-900 mr-2">{option.option}.</span>
            <span className="text-gray-700">{option.text}</span>
          </div>
        </label>
      ))}
    </div>
  );
};
```

### TextQuestion.tsx

```typescript
import React, { useState } from 'react';
import { ExamQuestion } from '../types';

interface TextQuestionProps {
  question: ExamQuestion;
  answer: string;
  onAnswerChange: (answer: string) => void;
}

export const TextQuestion: React.FC<TextQuestionProps> = ({ 
  question, 
  answer, 
  onAnswerChange 
}) => {
  const [charCount, setCharCount] = useState(answer.length);
  const maxChars = 1000; // Configurable character limit

  const handleAnswerChange = (value: string) => {
    if (value.length <= maxChars) {
      setCharCount(value.length);
      onAnswerChange(value);
    }
  };

  return (
    <div className="space-y-3">
      <textarea
        value={answer}
        onChange={(e) => handleAnswerChange(e.target.value)}
        placeholder="Type your answer here..."
        className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        rows={6}
        maxLength={maxChars}
      />
      <div className="flex justify-between text-sm text-gray-500">
        <span>Provide a detailed and clear answer</span>
        <span className={charCount > maxChars * 0.9 ? 'text-red-500' : ''}>
          {charCount}/{maxChars} characters
        </span>
      </div>
    </div>
  );
};
```

### QuestionNavigator.tsx

```typescript
import React from 'react';

interface QuestionNavigatorProps {
  questions: Array<{ id: string; category: string; difficulty: string }>;
  currentIndex: number;
  responses: Map<string, string>;
  onQuestionSelect: (index: number) => void;
}

export const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
  questions,
  currentIndex,
  responses,
  onQuestionSelect
}) => {
  const getQuestionStatus = (questionId: string, index: number) => {
    if (index === currentIndex) return 'current';
    if (responses.has(questionId)) return 'answered';
    return 'unanswered';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'current': return 'bg-blue-500 text-white';
      case 'answered': return 'bg-green-500 text-white';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Navigator</h3>
      <div className="grid grid-cols-5 gap-2">
        {questions.map((question, index) => {
          const status = getQuestionStatus(question.id, index);
          return (
            <button
              key={question.id}
              onClick={() => onQuestionSelect(index)}
              className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${getStatusColor(status)}`}
              title={`Question ${index + 1} - ${question.category} (${question.difficulty})`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
      
      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
          <span>Current</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
          <span>Answered</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
          <span>Unanswered</span>
        </div>
      </div>
    </div>
  );
};
```

## 📊 4. HR Exam Results & Reporting

### HRExamResultsPage.tsx

**Purpose**: Comprehensive exam results dashboard for HR to view and analyze candidate performance

```typescript
import React, { useState, useEffect } from 'react';
import { ExamResultsService, ExamService } from '../services';
import { ExamResult, Candidate, JobDescription } from '../types';

export const HRExamResultsPage: React.FC = () => {
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [filters, setFilters] = useState({
    jobDescription: '',
    candidate: '',
    dateRange: '',
    scoreRange: { min: 0, max: 100 },
    status: 'all' // 'all', 'passed', 'failed'
  });
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExamResults();
    loadCandidates();
    loadJobDescriptions();
  }, []);

  const loadExamResults = async () => {
    setLoading(true);
    try {
      const result = await ExamResultsService.getAllExamResults(filters);
      if (result.success) {
        setExamResults(result.results);
      }
    } catch (error) {
      console.error('Failed to load exam results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const filteredResults = examResults.filter(result => {
    if (filters.jobDescription && result.jobDescriptionId !== filters.jobDescription) return false;
    if (filters.candidate && result.candidateId !== filters.candidate) return false;
    if (filters.status !== 'all') {
      const passed = result.percentage >= 60;
      if (filters.status === 'passed' && !passed) return false;
      if (filters.status === 'failed' && passed) return false;
    }
    if (result.percentage < filters.scoreRange.min || result.percentage > filters.scoreRange.max) return false;
    return true;
  });

  const getCandidateName = (candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId);
    return candidate ? candidate.name : 'Unknown Candidate';
  };

  const getJobTitle = (jobDescriptionId: string) => {
    const job = jobDescriptions.find(j => j.id === jobDescriptionId);
    return job ? job.title : 'Unknown Position';
  };

  const exportResults = async (format: 'csv' | 'pdf') => {
    try {
      const result = await ExamResultsService.exportResults(filteredResults, format);
      if (result.success) {
        // Download file
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = `exam-results-${new Date().toISOString().split('T')[0]}.${format}`;
        link.click();
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg">Loading exam results...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Exam Results Dashboard</h1>
          <p className="text-gray-600 mt-2">View and analyze candidate exam performance</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-2xl font-bold text-gray-900">{examResults.length}</div>
            <div className="text-sm text-gray-600">Total Exams Taken</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-2xl font-bold text-green-600">
              {examResults.filter(r => r.percentage >= 60).length}
            </div>
            <div className="text-sm text-gray-600">Passed</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-2xl font-bold text-red-600">
              {examResults.filter(r => r.percentage < 60).length}
            </div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-2xl font-bold text-blue-600">
              {examResults.length > 0 ? 
                Math.round(examResults.reduce((sum, r) => sum + r.percentage, 0) / examResults.length) : 0}%
            </div>
            <div className="text-sm text-gray-600">Average Score</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <select
              value={filters.jobDescription}
              onChange={(e) => handleFilterChange({ jobDescription: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">All Positions</option>
              {jobDescriptions.map(job => (
                <option key={job.id} value={job.id}>{job.title}</option>
              ))}
            </select>

            <select
              value={filters.candidate}
              onChange={(e) => handleFilterChange({ candidate: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">All Candidates</option>
              {candidates.map(candidate => (
                <option key={candidate.id} value={candidate.id}>{candidate.name}</option>
              ))}
            </select>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange({ status: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="all">All Results</option>
              <option value="passed">Passed Only</option>
              <option value="failed">Failed Only</option>
            </select>

            <input
              type="range"
              min="0"
              max="100"
              value={filters.scoreRange.min}
              onChange={(e) => handleFilterChange({ 
                scoreRange: { ...filters.scoreRange, min: parseInt(e.target.value) }
              })}
              className="w-full"
            />

            <div className="flex space-x-2">
              <button
                onClick={() => exportResults('csv')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                📊 Export CSV
              </button>
              <button
                onClick={() => exportResults('pdf')}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                📄 Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Candidate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Technical
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aptitude
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time Taken
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredResults.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getCandidateName(result.candidateId)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getJobTitle(result.jobDescriptionId)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {result.percentage}%
                        </div>
                        <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              result.percentage >= 80 ? 'bg-green-500' :
                              result.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${result.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {result.technical_max_score > 0 ? 
                          `${Math.round((result.technical_score / result.technical_max_score) * 100)}%` : 
                          'N/A'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {result.aptitude_max_score > 0 ? 
                          `${Math.round((result.aptitude_score / result.aptitude_max_score) * 100)}%` : 
                          'N/A'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {result.time_taken_minutes}m
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        result.evaluation_status === 'passed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {result.evaluation_status === 'passed' ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(result.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedResult(result);
                          setShowDetailedView(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => window.open(`/exam/results/${result.exam_session_id}`, '_blank')}
                        className="text-green-600 hover:text-green-900"
                      >
                        Print Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed View Modal */}
        {showDetailedView && selectedResult && (
          <ExamResultDetailModal
            result={selectedResult}
            candidate={candidates.find(c => c.id === selectedResult.candidateId)}
            jobDescription={jobDescriptions.find(j => j.id === selectedResult.jobDescriptionId)}
            onClose={() => setShowDetailedView(false)}
          />
        )}
      </div>
    </div>
  );
};
```

### ExamResultDetailModal.tsx

**Purpose**: Detailed view of individual exam results with question-by-question breakdown

```typescript
import React, { useState, useEffect } from 'react';
import { ExamResultsService } from '../services';
import { ExamResult, Candidate, JobDescription, ExamResponse } from '../types';

interface ExamResultDetailModalProps {
  result: ExamResult;
  candidate?: Candidate;
  jobDescription?: JobDescription;
  onClose: () => void;
}

export const ExamResultDetailModal: React.FC<ExamResultDetailModalProps> = ({
  result,
  candidate,
  jobDescription,
  onClose
}) => {
  const [responses, setResponses] = useState<ExamResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetailedResponses();
  }, [result.exam_session_id]);

  const loadDetailedResponses = async () => {
    try {
      const response = await ExamResultsService.getDetailedResponses(result.exam_session_id);
      if (response.success) {
        setResponses(response.responses);
      }
    } catch (error) {
      console.error('Failed to load detailed responses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Detailed Exam Results</h3>
            <p className="text-gray-600">
              {candidate?.name} - {jobDescription?.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        {/* Overall Performance */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-3xl font-bold text-gray-900">{result.percentage}%</div>
            <div className="text-sm text-gray-600">Overall Score</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className={`text-3xl font-bold ${getScoreColor(result.technical_score, result.technical_max_score)}`}>
              {result.technical_max_score > 0 ? 
                Math.round((result.technical_score / result.technical_max_score) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-600">Technical Score</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className={`text-3xl font-bold ${getScoreColor(result.aptitude_score, result.aptitude_max_score)}`}>
              {result.aptitude_max_score > 0 ? 
                Math.round((result.aptitude_score / result.aptitude_max_score) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-600">Aptitude Score</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-3xl font-bold text-gray-900">{result.time_taken_minutes}m</div>
            <div className="text-sm text-gray-600">Time Taken</div>
          </div>
        </div>

        {/* Question-by-Question Breakdown */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Question Analysis</h4>
          {loading ? (
            <div className="text-center py-8">Loading question details...</div>
          ) : (
            <div className="space-y-4">
              {responses.map((response, index) => (
                <div key={response.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        Question {index + 1}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {response.question?.question_text}
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <div className={`text-lg font-bold ${
                        response.is_correct ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {response.points_earned}/{response.question?.points || 1}
                      </div>
                      <div className="text-xs text-gray-500">
                        {response.time_taken_seconds}s
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="text-sm text-gray-700">
                      <strong>Answer:</strong> {response.answer_text}
                    </div>
                    {response.question?.answer_explanation && (
                      <div className="text-sm text-gray-600 mt-2">
                        <strong>Explanation:</strong> {response.question.answer_explanation}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Print Report
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
```

### Enhanced ReportsPage.tsx

**Purpose**: Updated reports page to include exam results alongside interview results

```typescript
import React, { useState, useEffect } from 'react';
import { ExamResultsService, InterviewService } from '../services';
import { ExamResult, InterviewResults } from '../types';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'interviews' | 'exams' | 'combined'>('combined');
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [interviewResults, setInterviewResults] = useState<InterviewResults[]>([]);
  const [combinedResults, setCombinedResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllResults();
  }, []);

  const loadAllResults = async () => {
    setLoading(true);
    try {
      const [examData, interviewData] = await Promise.all([
        ExamResultsService.getAllExamResults({}),
        InterviewService.getAllInterviewResults()
      ]);

      if (examData.success) {
        setExamResults(examData.results);
      }
      if (interviewData.success) {
        setInterviewResults(interviewData.results);
      }

      // Combine results for unified view
      const combined = await combineResults(examData.results, interviewData.results);
      setCombinedResults(combined);
    } catch (error) {
      console.error('Failed to load results:', error);
    } finally {
      setLoading(false);
    }
  };

  const combineResults = async (exams: ExamResult[], interviews: InterviewResults[]) => {
    // Logic to combine exam and interview results by candidate
    // This would match candidates and create unified performance metrics
    return [];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Candidate Reports</h1>
          <p className="text-gray-600 mt-2">Comprehensive evaluation results for all candidates</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'combined', label: 'Combined Results', count: combinedResults.length },
              { id: 'interviews', label: 'Interview Results', count: interviewResults.length },
              { id: 'exams', label: 'Exam Results', count: examResults.length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'combined' && (
          <CombinedResultsTab 
            results={combinedResults}
            loading={loading}
          />
        )}

        {activeTab === 'interviews' && (
          <InterviewResultsTab 
            results={interviewResults}
            loading={loading}
          />
        )}

        {activeTab === 'exams' && (
          <ExamResultsTab 
            results={examResults}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};
```

## 🏗️ 5. Enhanced Admin Structure

### Main Navigation Enhancement

```typescript
// Updated Admin Navigation Structure
const adminNavigation = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'Home',
    path: '/admin/dashboard'
  },
  {
    id: 'interviews',
    label: 'Interviews',
    icon: 'Video',
    path: '/admin/interviews',
    submenu: [
      { label: 'Interview Management', path: '/admin/interviews/management' },
      { label: 'Interview Reports', path: '/admin/interviews/reports' }
    ]
  },
  {
    id: 'exams', // NEW DEDICATED SECTION
    label: 'Exams',
    icon: 'FileText',
    path: '/admin/exams',
    submenu: [
      { label: 'Exam Dashboard', path: '/admin/exams/dashboard' },
      { label: 'Question Bank', path: '/admin/exams/questions' },
      { label: 'Topic Management', path: '/admin/exams/topics' },
      { label: 'Category Configuration', path: '/admin/exams/categories' },
      { label: 'Exam Sessions', path: '/admin/exams/sessions' },
      { label: 'Exam Results', path: '/admin/exams/results' },
      { label: 'Exam Analytics', path: '/admin/exams/analytics' }
    ]
  },
  {
    id: 'candidates',
    label: 'Candidates',
    icon: 'Users',
    path: '/admin/candidates'
  },
  {
    id: 'job-descriptions',
    label: 'Job Descriptions',
    icon: 'Briefcase',
    path: '/admin/job-descriptions'
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: 'BarChart',
    path: '/admin/reports'
  }
];
```

### Exam Dashboard Page

```typescript
// New Exam Dashboard Component
export const ExamDashboardPage: React.FC = () => {
  const [activeExams, setActiveExams] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [completedExams, setCompletedExams] = useState(0);
  const [pendingReviews, setPendingReviews] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Exam Management</h1>
          <p className="text-gray-600 mt-2">Comprehensive exam system management</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Active Exams"
            value={activeExams}
            icon="Play"
            color="blue"
            trend="+12%"
          />
          <StatCard
            title="Questions Bank"
            value={totalQuestions}
            icon="FileText"
            color="green"
            trend="+5%"
          />
          <StatCard
            title="Completed Exams"
            value={completedExams}
            icon="CheckCircle"
            color="purple"
            trend="+18%"
          />
          <StatCard
            title="Pending Reviews"
            value={pendingReviews}
            icon="Clock"
            color="orange"
            trend="+3%"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <QuickActionCard
            title="Create New Exam"
            description="Set up a new exam with questions"
            icon="Plus"
            action={() => navigate('/admin/exams/create')}
            color="blue"
          />
          <QuickActionCard
            title="Generate Questions"
            description="Use AI to generate exam questions"
            icon="Zap"
            action={() => navigate('/admin/exams/questions/generate')}
            color="green"
          />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentActivityCard />
          <UpcomingExamsCard />
        </div>
      </div>
    </div>
  );
};
```

### Enhanced Question Bank Page

```typescript
// Dedicated Question Bank Page
export const QuestionBankPage: React.FC = () => {
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [topics, setTopics] = useState<QuestionTopic[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Actions */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Question Bank</h1>
            <p className="text-gray-600 mt-2">Manage and organize exam questions</p>
          </div>
          <div className="flex space-x-4">
            <Button
              onClick={() => setShowGenerateModal(true)}
              className="bg-blue-600 text-white"
            >
              <Zap className="w-4 h-4 mr-2" />
              Generate with AI
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-green-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Manual Question
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search questions..."
            />
            <Select
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={['All', 'Technical', 'Aptitude']}
            />
            <Select
              value={topicFilter}
              onChange={setTopicFilter}
              options={[
                'All Topics',
                ...topics.map(topic => topic.name)
              ]}
            />
            <Select
              value={difficultyFilter}
              onChange={setDifficultyFilter}
              options={['All', 'Easy', 'Medium', 'Hard']}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={['All', 'Approved', 'Pending', 'Rejected']}
            />
            <Button
              onClick={exportQuestions}
              className="bg-gray-600 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Questions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {questions.map(question => (
            <QuestionCard
              key={question.id}
              question={question}
              onEdit={handleEditQuestion}
              onDelete={handleDeleteQuestion}
              onApprove={handleApproveQuestion}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
```

### Exam Sessions Management Page

```typescript
// Exam Sessions Management Page
export const ExamSessionsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [activeSessions, setActiveSessions] = useState<ExamSession[]>([]);
  const [scheduledSessions, setScheduledSessions] = useState<ExamSession[]>([]);
  const [completedSessions, setCompletedSessions] = useState<ExamSession[]>([]);
  const [expiredSessions, setExpiredSessions] = useState<ExamSession[]>([]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Exam Sessions</h1>
          <p className="text-gray-600 mt-2">Monitor and manage active exam sessions</p>
        </div>

        {/* Session Status Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'active', label: 'Active Sessions', count: activeSessions.length },
              { id: 'scheduled', label: 'Scheduled', count: scheduledSessions.length },
              { id: 'completed', label: 'Completed', count: completedSessions.length },
              { id: 'expired', label: 'Expired', count: expiredSessions.length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        {/* Sessions Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Candidate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time Remaining
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessions.map(session => (
                  <SessionRow
                    key={session.id}
                    session={session}
                    onViewDetails={handleViewDetails}
                    onTerminate={handleTerminateSession}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### Topic Management Page

```typescript
// Topic Management Page
export const TopicManagementPage: React.FC = () => {
  const [topics, setTopics] = useState<QuestionTopic[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'technical' | 'aptitude' | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState<QuestionTopic | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Topic Management</h1>
            <p className="text-gray-600 mt-2">Organize and manage question topics and categories</p>
          </div>
          <div className="flex space-x-4">
            <Select
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={[
                { value: 'all', label: 'All Categories' },
                { value: 'technical', label: 'Technical' },
                { value: 'aptitude', label: 'Aptitude' }
              ]}
            />
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Topic
            </Button>
          </div>
        </div>

        {/* Topics Tree */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Topic Hierarchy</h2>
            <TopicTree
              topics={topics}
              onEdit={setEditingTopic}
              onDelete={handleDeleteTopic}
              onAddSubTopic={handleAddSubTopic}
            />
          </div>
        </div>

        {/* Create/Edit Modal */}
        {(showCreateModal || editingTopic) && (
          <TopicModal
            topic={editingTopic}
            onClose={() => {
              setShowCreateModal(false);
              setEditingTopic(null);
            }}
            onSave={handleSaveTopic}
          />
        )}
      </div>
    </div>
  );
};

// Topic Tree Component
export const TopicTree: React.FC<{
  topics: QuestionTopic[];
  onEdit: (topic: QuestionTopic) => void;
  onDelete: (topicId: string) => void;
  onAddSubTopic: (parentId: string) => void;
}> = ({ topics, onEdit, onDelete, onAddSubTopic }) => {
  return (
    <div className="space-y-2">
      {topics.map(topic => (
        <TopicNode
          key={topic.id}
          topic={topic}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddSubTopic={onAddSubTopic}
        />
      ))}
    </div>
  );
};

// Topic Node Component
export const TopicNode: React.FC<{
  topic: QuestionTopic;
  onEdit: (topic: QuestionTopic) => void;
  onDelete: (topicId: string) => void;
  onAddSubTopic: (parentId: string) => void;
}> = ({ topic, onEdit, onDelete, onAddSubTopic }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          {topic.children && topic.children.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
          <div>
            <h3 className="font-medium text-gray-900">{topic.name}</h3>
            {topic.description && (
              <p className="text-sm text-gray-600">{topic.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <StatusBadge status={topic.category} />
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAddSubTopic(topic.id)}
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(topic)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(topic.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {isExpanded && topic.children && topic.children.length > 0 && (
        <div className="pl-8 pb-4">
          <TopicTree
            topics={topic.children}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddSubTopic={onAddSubTopic}
          />
        </div>
      )}
    </div>
  );
};
```

### Job-Specific Category Configuration

```typescript
// Job Category Configuration Component
export const JobCategoryConfigPage: React.FC = () => {
  const [jobDescriptionId, setJobDescriptionId] = useState<string>('');
  const [availableTopics, setAvailableTopics] = useState<QuestionTopic[]>([]);
  const [jobCategories, setJobCategories] = useState<JobQuestionCategory[]>([]);
  const [totalWeight, setTotalWeight] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Job Category Configuration</h1>
          <p className="text-gray-600 mt-2">Configure question distribution for specific job descriptions</p>
        </div>

        {/* Job Selection */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Select Job Description</h2>
          <JobDescriptionSelector
            value={jobDescriptionId}
            onChange={setJobDescriptionId}
            placeholder="Choose a job description to configure..."
          />
        </div>

        {jobDescriptionId && (
          <>
            {/* Category Configuration */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">Question Distribution</h2>
                <div className="flex items-center space-x-4">
                  <span className={`text-sm ${totalWeight === 100 ? 'text-green-600' : 'text-red-600'}`}>
                    Total Weight: {totalWeight}%
                  </span>
                  <Button
                    onClick={addNewCategory}
                    className="bg-blue-600 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {jobCategories.map((category, index) => (
                  <CategoryConfigCard
                    key={category.id || index}
                    category={category}
                    availableTopics={availableTopics}
                    onUpdate={updateCategory}
                    onDelete={removeCategory}
                    onWeightChange={updateWeight}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">Distribution Preview</h2>
              <DistributionPreview
                categories={jobCategories}
                totalQuestions={30}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Category Configuration Card
export const CategoryConfigCard: React.FC<{
  category: JobQuestionCategory;
  availableTopics: QuestionTopic[];
  onUpdate: (category: JobQuestionCategory) => void;
  onDelete: (categoryId: string) => void;
  onWeightChange: (categoryId: string, weight: number) => void;
}> = ({ category, availableTopics, onUpdate, onDelete, onWeightChange }) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Topic Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Topic
          </label>
          <Select
            value={category.topic_id}
            onChange={(topicId) => onUpdate({ ...category, topic_id: topicId })}
            options={availableTopics.map(topic => ({
              value: topic.id,
              label: topic.name
            }))}
          />
        </div>

        {/* Weight Percentage */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Weight (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={category.weight_percentage}
            onChange={(e) => onWeightChange(category.id, parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Min/Max Questions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Min/Max Questions
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              min="0"
              value={category.min_questions}
              onChange={(e) => onUpdate({ ...category, min_questions: parseInt(e.target.value) })}
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Min"
            />
            <input
              type="number"
              min="0"
              value={category.max_questions}
              onChange={(e) => onUpdate({ ...category, max_questions: parseInt(e.target.value) })}
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Max"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-end space-x-2">
          <Button
            onClick={() => onDelete(category.id)}
            className="bg-red-600 text-white"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Difficulty Distribution */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Difficulty Distribution
        </label>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Easy (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={category.easy_percentage}
              onChange={(e) => onUpdate({ ...category, easy_percentage: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Medium (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={category.medium_percentage}
              onChange={(e) => onUpdate({ ...category, medium_percentage: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Hard (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={category.hard_percentage}
              onChange={(e) => onUpdate({ ...category, hard_percentage: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
```

### Shared Exam Components

```typescript
// Shared Exam Components
export const ExamCard: React.FC<ExamCardProps> = ({ exam, onEdit, onDelete, onView }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{exam.title}</h3>
          <p className="text-sm text-gray-600">{exam.jobPosition}</p>
        </div>
        <StatusBadge status={exam.status} />
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-sm">
          <span className="text-gray-500">Questions:</span>
          <span className="ml-1 font-medium">{exam.questionCount}</span>
        </div>
        <div className="text-sm">
          <span className="text-gray-500">Duration:</span>
          <span className="ml-1 font-medium">{exam.duration}min</span>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Created {formatDate(exam.createdAt)}
        </div>
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" onClick={() => onView(exam.id)}>
            <Eye className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => onEdit(exam.id)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => onDelete(exam.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Status Badge Component
export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { color: 'bg-green-100 text-green-800', icon: 'Play' };
      case 'scheduled':
        return { color: 'bg-blue-100 text-blue-800', icon: 'Clock' };
      case 'completed':
        return { color: 'bg-purple-100 text-purple-800', icon: 'CheckCircle' };
      case 'expired':
        return { color: 'bg-red-100 text-red-800', icon: 'XCircle' };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: 'HelpCircle' };
    }
  };

  const config = getStatusConfig(status);
  const Icon = icons[config.icon];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="w-3 h-3 mr-1" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Progress Bar Component
export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  current, 
  total, 
  label, 
  showPercentage = true 
}) => {
  const percentage = (current / total) * 100;

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>{label}</span>
        {showPercentage && <span>{Math.round(percentage)}%</span>}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {current} of {total} completed
      </div>
    </div>
  );
};
```

## 🎨 6. Styling and Theming

### Tailwind Configuration

```javascript
// tailwind.config.js additions
module.exports = {
  theme: {
    extend: {
      colors: {
        exam: {
          primary: '#3B82F6',
          secondary: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          success: '#10B981'
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounce 2s infinite'
      }
    }
  }
}
```

### Component Styling Patterns

```typescript
// Consistent styling patterns across components
const buttonStyles = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
  success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
};

const cardStyles = 'bg-white rounded-lg shadow-sm border border-gray-200';
const inputStyles = 'border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';
```

## 📱 5. Responsive Design

### Mobile-First Approach

```typescript
// Responsive grid patterns
const responsiveGrid = {
  questions: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  examLayout: 'grid grid-cols-1 lg:grid-cols-4 gap-8',
  results: 'grid grid-cols-1 md:grid-cols-2 gap-6'
};

// Mobile-specific components
const MobileExamHeader = () => (
  <div className="lg:hidden bg-white shadow-sm border-b p-4">
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-lg font-semibold">Exam</h1>
        <p className="text-sm text-gray-600">Question 1 of 15</p>
      </div>
      <ExamTimer timeRemaining={timeRemaining} onTimeUp={handleAutoSubmit} />
    </div>
  </div>
);
```

## 🧪 6. Testing Components

### Component Testing Examples

```typescript
// ExamTimer.test.tsx
import { render, screen } from '@testing-library/react';
import { ExamTimer } from './ExamTimer';

describe('ExamTimer', () => {
  it('displays correct time format', () => {
    render(<ExamTimer timeRemaining={5.5} onTimeUp={jest.fn()} />);
    expect(screen.getByText('5:30')).toBeInTheDocument();
  });

  it('shows warning color when time is low', () => {
    render(<ExamTimer timeRemaining={3} onTimeUp={jest.fn()} />);
    const timer = screen.getByText(/3:00/);
    expect(timer).toHaveClass('text-red-600');
  });
});

// MCQQuestion.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MCQQuestion } from './MCQQuestion';

describe('MCQQuestion', () => {
  const mockQuestion = {
    id: '1',
    question_text: 'What is 2+2?',
    question_type: 'mcq',
    mcq_options: [
      { option: 'A', text: '3' },
      { option: 'B', text: '4' },
      { option: 'C', text: '5' }
    ]
  };

  it('renders all options', () => {
    render(
      <MCQQuestion 
        question={mockQuestion} 
        selectedAnswer="" 
        onAnswerChange={jest.fn()} 
      />
    );
    
    expect(screen.getByText('A. 3')).toBeInTheDocument();
    expect(screen.getByText('B. 4')).toBeInTheDocument();
    expect(screen.getByText('C. 5')).toBeInTheDocument();
  });

  it('calls onAnswerChange when option is selected', () => {
    const mockOnChange = jest.fn();
    render(
      <MCQQuestion 
        question={mockQuestion} 
        selectedAnswer="" 
        onAnswerChange={mockOnChange} 
      />
    );
    
    fireEvent.click(screen.getByText('B. 4'));
    expect(mockOnChange).toHaveBeenCalledWith('B');
  });
});
```

---

**Next Steps**: Review the AI integration workflows in `EXAM_AI_INTEGRATION.md`
