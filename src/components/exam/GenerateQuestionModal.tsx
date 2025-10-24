import React, { useState, useEffect } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Brain, 
  BookOpen,
  Type,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { n8nExamWorkflows, buildQuestionGenerationRequest } from '../../services/n8nExamWorkflows';
import { questionService } from '../../services/questionService';
import { JobDescription } from '../../types';
import './GenerateQuestionModal.css';

interface GenerateQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestionsGenerated: (questions: any[]) => void;
  jobDescriptions: JobDescription[];
  loading?: boolean;
}

type InputMethod = 'existing_jd' | 'upload_pdf' | 'manual_input' | 'custom_topic';

const GenerateQuestionModal: React.FC<GenerateQuestionModalProps> = ({
  isOpen,
  onClose,
  onQuestionsGenerated,
  jobDescriptions,
  loading = false
}) => {
  const [inputMethod, setInputMethod] = useState<InputMethod>('existing_jd');
  const [selectedJobDescription, setSelectedJobDescription] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [manualJobDescription, setManualJobDescription] = useState<string>('');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [topicInsights, setTopicInsights] = useState<string>('');
  
  // Generation configuration
  const [totalQuestions, setTotalQuestions] = useState<number>(15);
  const [technicalPercentage, setTechnicalPercentage] = useState<number>(70);
  const [aptitudePercentage, setAptitudePercentage] = useState<number>(30);
  const [mcqPercentage, setMcqPercentage] = useState<number>(60);
  const [textPercentage, setTextPercentage] = useState<number>(40);
  const [easyQuestions, setEasyQuestions] = useState<number>(3);
  const [mediumQuestions, setMediumQuestions] = useState<number>(8);
  const [hardQuestions, setHardQuestions] = useState<number>(4);
  
  // State management
  const [generating, setGenerating] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      resetForm();
    }
  }, [isOpen, jobDescriptions]);

  // Auto-adjust total questions when difficulty distribution changes
  useEffect(() => {
    const newTotal = easyQuestions + mediumQuestions + hardQuestions;
    if (newTotal !== totalQuestions) {
      setTotalQuestions(newTotal);
    }
  }, [easyQuestions, mediumQuestions, hardQuestions, totalQuestions]);

  // Helper functions for balanced difficulty adjustment
  const adjustDifficultyBalanced = (changedType: 'easy' | 'medium' | 'hard', newValue: number) => {
    const increase = newValue - (changedType === 'easy' ? easyQuestions : changedType === 'medium' ? mediumQuestions : hardQuestions);
    
    if (increase === 0) return;

    const otherTypes = ['easy', 'medium', 'hard'].filter(type => type !== changedType) as ('easy' | 'medium' | 'hard')[];
    const otherValues = otherTypes.map(type => ({
      type,
      value: type === 'easy' ? easyQuestions : type === 'medium' ? mediumQuestions : hardQuestions
    }));

    otherValues.sort((a, b) => b.value - a.value);

    let remainingToReduce = Math.abs(increase);
    const newOtherValues = [...otherValues];

    for (let i = 0; i < newOtherValues.length && remainingToReduce > 0; i++) {
      const canReduce = Math.min(newOtherValues[i].value, remainingToReduce);
      newOtherValues[i].value -= canReduce;
      remainingToReduce -= canReduce;
    }

    if (changedType === 'easy') {
      setEasyQuestions(newValue);
      setMediumQuestions(newOtherValues.find(v => v.type === 'medium')?.value || 0);
      setHardQuestions(newOtherValues.find(v => v.type === 'hard')?.value || 0);
    } else if (changedType === 'medium') {
      setEasyQuestions(newOtherValues.find(v => v.type === 'easy')?.value || 0);
      setMediumQuestions(newValue);
      setHardQuestions(newOtherValues.find(v => v.type === 'hard')?.value || 0);
    } else if (changedType === 'hard') {
      setEasyQuestions(newOtherValues.find(v => v.type === 'easy')?.value || 0);
      setMediumQuestions(newOtherValues.find(v => v.type === 'medium')?.value || 0);
      setHardQuestions(newValue);
    }
  };

  const resetForm = () => {
    setInputMethod('existing_jd');
    setSelectedJobDescription('');
    setUploadedFile(null);
    setExtractedText('');
    setManualJobDescription('');
    setCustomTopic('');
    setTopicInsights('');
    setTotalQuestions(15);
    setTechnicalPercentage(70);
    setAptitudePercentage(30);
    setMcqPercentage(60);
    setTextPercentage(40);
    setEasyQuestions(3);
    setMediumQuestions(8);
    setHardQuestions(4);
    setGenerating(false);
    setExtracting(false);
    setErrors({});
    setGeneratedQuestions([]);
    setShowPreview(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setErrors({ file: 'Please upload a PDF file only' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setErrors({ file: 'File size must be less than 10MB' });
      return;
    }

    setUploadedFile(file);
    setExtracting(true);
    setErrors({});

    try {
      // For now, we'll simulate PDF text extraction
      // In production, you would use a proper PDF parsing service
      const mockExtractedText = `Job Description extracted from PDF:

Position: ${file.name.replace('.pdf', '')}
Description: This is a sample job description extracted from the uploaded PDF file. The actual implementation would use a PDF parsing library to extract text content.

Required Skills: JavaScript, React, Node.js, Database Management
Preferred Skills: TypeScript, AWS, Docker, CI/CD
Experience Level: Mid-level
Employment Type: Full-time
Technical Stack: React, Node.js, MongoDB, Express
Key Responsibilities: 
- Develop web applications
- Collaborate with team members
- Maintain code quality
- Deploy applications

Education Requirements: Bachelor's degree in Computer Science or related field`;

      setExtractedText(mockExtractedText);
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      setErrors({ file: 'Failed to extract text from PDF. Please try again.' });
    } finally {
      setExtracting(false);
    }
  };

  const validateInput = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (inputMethod === 'existing_jd' && !selectedJobDescription) {
      newErrors.jobDescription = 'Please select a job description';
    }

    if (inputMethod === 'upload_pdf' && !uploadedFile) {
      newErrors.file = 'Please upload a PDF file';
    }

    if (inputMethod === 'manual_input' && !manualJobDescription.trim()) {
      newErrors.manualDescription = 'Please enter a job description';
    }

    if (inputMethod === 'custom_topic' && !customTopic.trim()) {
      newErrors.customTopic = 'Please enter a topic name';
    }

    if (totalQuestions < 5 || totalQuestions > 50) {
      newErrors.totalQuestions = 'Total questions must be between 5 and 50';
    }

    if (technicalPercentage + aptitudePercentage !== 100) {
      newErrors.percentages = 'Technical and Aptitude percentages must add up to 100%';
    }

    if (mcqPercentage + textPercentage !== 100) {
      newErrors.questionTypes = 'MCQ and Text percentages must add up to 100%';
    }

    // No need to validate difficulty distribution as it's automatically balanced

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerateQuestions = async () => {
    if (!validateInput()) {
      return;
    }

    setGenerating(true);
    setErrors({});

    try {
      let jobDescriptionData: any = {};
      let sourceInfo: any = {};

      // Prepare job description data based on input method
      switch (inputMethod) {
        case 'existing_jd':
          const selectedJD = jobDescriptions.find(jd => jd.id === selectedJobDescription);
          if (selectedJD) {
            jobDescriptionData = selectedJD;
          }
          sourceInfo = { job_description_id: selectedJobDescription };
          break;

        case 'upload_pdf':
          // Parse extracted text to create job description structure
          jobDescriptionData = {
            id: 'uploaded-pdf',
            title: 'Uploaded Job Description',
            description: extractedText,
            department: 'Unknown',
            location: 'Unknown',
            employmentType: 'full-time',
            experienceLevel: 'mid',
            requirements: [],
            responsibilities: [],
            benefits: [],
            skills: [],
            qualifications: [],
            status: 'draft',
            createdBy: 'user',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            // AI-extracted fields
            required_skills: [],
            preferred_skills: [],
            technical_stack: [],
            key_responsibilities: [],
            education_requirements: ''
          };
          sourceInfo = { uploaded_file: uploadedFile?.name, extracted_text: extractedText };
          break;

        case 'manual_input':
          jobDescriptionData = {
            id: 'manual-input',
            title: 'Manual Job Description',
            description: manualJobDescription,
            department: 'Unknown',
            location: 'Unknown',
            employmentType: 'full-time',
            experienceLevel: 'mid',
            requirements: [],
            responsibilities: [],
            benefits: [],
            skills: [],
            qualifications: [],
            status: 'draft',
            createdBy: 'user',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            // AI-extracted fields
            required_skills: [],
            preferred_skills: [],
            technical_stack: [],
            key_responsibilities: [],
            education_requirements: ''
          };
          sourceInfo = { manual_description: manualJobDescription };
          break;

        case 'custom_topic':
          jobDescriptionData = {
            id: 'custom-topic',
            title: customTopic,
            description: topicInsights || 'Custom topic for question generation',
            department: 'Unknown',
            location: 'Unknown',
            employmentType: 'full-time',
            experienceLevel: 'mid',
            requirements: [],
            responsibilities: [],
            benefits: [],
            skills: [],
            qualifications: [],
            status: 'draft',
            createdBy: 'user',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            // AI-extracted fields
            required_skills: [],
            preferred_skills: [],
            technical_stack: [],
            key_responsibilities: [],
            education_requirements: ''
          };
          sourceInfo = { 
            custom_topic: customTopic,
            topic_insights: topicInsights
          };
          break;
      }

      // Build generation configuration
      const generationConfig = {
        total_questions: totalQuestions,
        technical_percentage: technicalPercentage,
        aptitude_percentage: aptitudePercentage,
        difficulty_distribution: {
          easy: easyQuestions,
          medium: mediumQuestions,
          hard: hardQuestions
        },
        question_types: {
          mcq: mcqPercentage,
          text: textPercentage
        }
      };

      // Build request for N8N workflow
      const request = buildQuestionGenerationRequest(
        jobDescriptionData,
        generationConfig,
        inputMethod,
        sourceInfo
      );

      // Call N8N workflow
      const response = await n8nExamWorkflows.generateQuestions(request);
      
      if (response.generated_questions && response.generated_questions.length > 0) {
        setGeneratedQuestions(response.generated_questions);
        setShowPreview(true);
      } else {
        setErrors({ general: 'No questions were generated. Please try again.' });
      }

    } catch (error) {
      console.error('Error generating questions:', error);
      setErrors({ 
        general: `Failed to generate questions: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveQuestions = async () => {
    if (generatedQuestions.length === 0) return;

    setGenerating(true);
    try {
      // Save questions one by one
      const savedQuestions = [];
      for (const question of generatedQuestions) {
        const questionData = {
          job_description_id: selectedJobDescription || '',
          question_text: question.question_text,
          question_type: question.question_type,
          question_category: question.question_category,
          difficulty_level: question.difficulty_level,
          topic_id: 'general', // Default topic since we removed topic selection
          subtopic: question.subtopic || 'General',
          points: question.points,
          time_limit_seconds: question.time_limit_seconds,
          mcq_options: question.mcq_options || [],
          correct_answer: question.correct_answer,
          answer_explanation: question.answer_explanation,
          tags: question.tags || []
        };
        
        const savedQuestion = await questionService.createQuestion(questionData);
        savedQuestions.push(savedQuestion);
      }
      
      onQuestionsGenerated(savedQuestions);
      onClose();
    } catch (error) {
      console.error('Error saving questions:', error);
      setErrors({ general: 'Failed to save questions. Please try again.' });
    } finally {
      setGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-ai-teal/10 rounded-lg">
              <Brain className="h-6 w-6 text-ai-teal" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {showPreview ? 'Generated Questions' : 'Generate Questions'}
              </h2>
              <p className="text-sm text-gray-600">
                {showPreview 
                  ? `Review and save ${generatedQuestions.length} generated questions`
                  : 'Configure and generate questions using AI'
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {!showPreview ? (
            /* Configuration Form */
            <div className="space-y-6">
              {/* Input Method Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Input Method *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setInputMethod('existing_jd')}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      inputMethod === 'existing_jd'
                        ? 'border-ai-teal bg-ai-teal/5 text-ai-teal'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5" />
                      <div>
                        <div className="font-medium">Existing Job Description</div>
                        <div className="text-sm text-gray-600">Select from saved job descriptions</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setInputMethod('upload_pdf')}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      inputMethod === 'upload_pdf'
                        ? 'border-ai-teal bg-ai-teal/5 text-ai-teal'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Upload className="h-5 w-5" />
                      <div>
                        <div className="font-medium">Upload PDF</div>
                        <div className="text-sm text-gray-600">Upload a job description PDF</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setInputMethod('manual_input')}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      inputMethod === 'manual_input'
                        ? 'border-ai-teal bg-ai-teal/5 text-ai-teal'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Type className="h-5 w-5" />
                      <div>
                        <div className="font-medium">Manual Input</div>
                        <div className="text-sm text-gray-600">Type job description manually</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setInputMethod('custom_topic')}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      inputMethod === 'custom_topic'
                        ? 'border-ai-teal bg-ai-teal/5 text-ai-teal'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <BookOpen className="h-5 w-5" />
                      <div>
                        <div className="font-medium">Custom Topic</div>
                        <div className="text-sm text-gray-600">Generate questions for a specific topic</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Input Method Specific Fields */}
              {inputMethod === 'existing_jd' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Job Description *
                  </label>
                  <select
                    value={selectedJobDescription}
                    onChange={(e) => setSelectedJobDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent"
                  >
                    <option value="">Choose a job description...</option>
                    {jobDescriptions.map(jd => (
                      <option key={jd.id} value={jd.id}>
                        {jd.title} - {jd.department}
                      </option>
                    ))}
                  </select>
                  {errors.jobDescription && (
                    <p className="mt-2 text-sm text-red-600">{errors.jobDescription}</p>
                  )}
                </div>
              )}

              {inputMethod === 'upload_pdf' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload PDF File *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="pdf-upload"
                    />
                    <label htmlFor="pdf-upload" className="cursor-pointer">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PDF files only, max 10MB
                      </p>
                    </label>
                  </div>
                  {uploadedFile && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-800">
                          {uploadedFile.name} uploaded successfully
                        </span>
                      </div>
                    </div>
                  )}
                  {extracting && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                        <span className="text-sm text-blue-800">
                          Extracting text from PDF...
                        </span>
                      </div>
                    </div>
                  )}
                  {extractedText && (
                    <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-700 font-medium mb-2">Extracted Text:</p>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">
                        {extractedText.substring(0, 200)}...
                      </p>
                    </div>
                  )}
                  {errors.file && (
                    <p className="mt-2 text-sm text-red-600">{errors.file}</p>
                  )}
                </div>
              )}

              {inputMethod === 'manual_input' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Description *
                  </label>
                  <textarea
                    value={manualJobDescription}
                    onChange={(e) => setManualJobDescription(e.target.value)}
                    placeholder="Enter the job description here..."
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent"
                  />
                  {errors.manualDescription && (
                    <p className="mt-2 text-sm text-red-600">{errors.manualDescription}</p>
                  )}
                </div>
              )}

              {inputMethod === 'custom_topic' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Topic Name *
                    </label>
                    <input
                      type="text"
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      placeholder="e.g., React Development, Machine Learning, etc."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent"
                    />
                    {errors.customTopic && (
                      <p className="mt-2 text-sm text-red-600">{errors.customTopic}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Topic Insights (Optional)
                    </label>
                    <textarea
                      value={topicInsights}
                      onChange={(e) => setTopicInsights(e.target.value)}
                      placeholder="Provide additional context or requirements for this topic..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Generation Configuration */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Generation Configuration</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Questions
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={totalQuestions}
                    onChange={(e) => setTotalQuestions(parseInt(e.target.value) || 15)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter a number between 5 and 50</p>
                  {errors.totalQuestions && (
                    <p className="mt-2 text-sm text-red-600">{errors.totalQuestions}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Technical Questions: {technicalPercentage}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={technicalPercentage}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setTechnicalPercentage(value);
                        setAptitudePercentage(100 - value);
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${technicalPercentage}%, #e5e7eb ${technicalPercentage}%, #e5e7eb 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Aptitude Questions: {aptitudePercentage}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={aptitudePercentage}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setAptitudePercentage(value);
                        setTechnicalPercentage(100 - value);
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${aptitudePercentage}%, #e5e7eb ${aptitudePercentage}%, #e5e7eb 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      MCQ Questions: {mcqPercentage}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={mcqPercentage}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setMcqPercentage(value);
                        setTextPercentage(100 - value);
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${mcqPercentage}%, #e5e7eb ${mcqPercentage}%, #e5e7eb 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Text Questions: {textPercentage}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={textPercentage}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setTextPercentage(value);
                        setMcqPercentage(100 - value);
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${textPercentage}%, #e5e7eb ${textPercentage}%, #e5e7eb 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700">Difficulty Distribution</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Easy Questions: {easyQuestions}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max={totalQuestions}
                        value={easyQuestions}
                        onChange={(e) => adjustDifficultyBalanced('easy', parseInt(e.target.value) || 0)}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, #10b981 0%, #10b981 ${(easyQuestions / totalQuestions) * 100}%, #e5e7eb ${(easyQuestions / totalQuestions) * 100}%, #e5e7eb 100%)`
                        }}
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0</span>
                        <span className="text-green-600 font-medium">{easyQuestions} Easy</span>
                        <span>{totalQuestions}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Medium Questions: {mediumQuestions}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max={totalQuestions}
                        value={mediumQuestions}
                        onChange={(e) => adjustDifficultyBalanced('medium', parseInt(e.target.value) || 0)}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${(mediumQuestions / totalQuestions) * 100}%, #e5e7eb ${(mediumQuestions / totalQuestions) * 100}%, #e5e7eb 100%)`
                        }}
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0</span>
                        <span className="text-yellow-600 font-medium">{mediumQuestions} Medium</span>
                        <span>{totalQuestions}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hard Questions: {hardQuestions}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max={totalQuestions}
                        value={hardQuestions}
                        onChange={(e) => adjustDifficultyBalanced('hard', parseInt(e.target.value) || 0)}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${(hardQuestions / totalQuestions) * 100}%, #e5e7eb ${(hardQuestions / totalQuestions) * 100}%, #e5e7eb 100%)`
                        }}
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0</span>
                        <span className="text-red-600 font-medium">{hardQuestions} Hard</span>
                        <span>{totalQuestions}</span>
                      </div>
                    </div>
                  </div>
                  {errors.difficulty && (
                    <p className="mt-2 text-sm text-red-600">{errors.difficulty}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Preview Generated Questions */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Generated Questions ({generatedQuestions.length})
                </h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-ai-teal hover:text-ai-teal/80 text-sm font-medium"
                >
                  Back to Configuration
                </button>
              </div>

              <div className="space-y-4">
                {generatedQuestions.map((question, index) => (
                  <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="bg-ai-teal text-white text-xs px-2 py-1 rounded">
                          {question.question_type?.toUpperCase()}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          question.difficulty_level === 'easy' ? 'bg-green-100 text-green-800' :
                          question.difficulty_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {question.difficulty_level?.toUpperCase()}
                        </span>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {question.question_category?.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {question.points} points • {question.time_limit_seconds}s
                      </div>
                    </div>
                    
                    <p className="text-gray-900 font-medium mb-2">
                      {question.question_text}
                    </p>
                    
                    {question.mcq_options && question.mcq_options.length > 0 && (
                      <div className="space-y-1 mb-3">
                        {question.mcq_options.map((option: any, optIndex: number) => (
                          <div key={optIndex} className="flex items-center space-x-2 text-sm">
                            <span className="font-medium">{option.option}.</span>
                            <span className={option.option === question.correct_answer ? 'text-green-600 font-medium' : 'text-gray-600'}>
                              {option.text}
                            </span>
                            {option.option === question.correct_answer && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {question.answer_explanation && (
                      <div className="text-sm text-gray-600 bg-white p-3 rounded border">
                        <strong>Explanation:</strong> {question.answer_explanation}
                      </div>
                    )}
                    
                    {question.job_relevance && (
                      <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded border mt-2">
                        <strong>Job Relevance:</strong> {question.job_relevance}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Messages */}
          {errors.general && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-sm text-red-800">{errors.general}</span>
              </div>
            </div>
          )}

          {errors.percentages && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-sm text-red-800">{errors.percentages}</span>
              </div>
            </div>
          )}

          {errors.questionTypes && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-sm text-red-800">{errors.questionTypes}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 flex-shrink-0">
          <div className="text-sm text-gray-600">
            {!showPreview ? (
              <>
                Total: {totalQuestions} questions • 
                Technical: {Math.round(totalQuestions * technicalPercentage / 100)} • 
                Aptitude: {Math.round(totalQuestions * aptitudePercentage / 100)} • 
                MCQ: {Math.round(totalQuestions * mcqPercentage / 100)} • 
                Text: {Math.round(totalQuestions * textPercentage / 100)}
              </>
            ) : (
              `${generatedQuestions.length} questions generated successfully`
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            {!showPreview ? (
              <button
                onClick={handleGenerateQuestions}
                disabled={generating || loading}
                className="px-6 py-2 bg-ai-teal text-white rounded-lg hover:bg-ai-teal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4" />
                    <span>Generate Questions</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleSaveQuestions}
                disabled={generating || loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Save Questions</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateQuestionModal;