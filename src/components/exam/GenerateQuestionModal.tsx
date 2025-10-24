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
  Loader2,
  Download,
  Eye,
  Trash2
} from 'lucide-react';
import { n8nExamWorkflows, buildQuestionGenerationRequest } from '../../services/n8nExamWorkflows';
import { questionService, QuestionFormData } from '../../services/questionService';
import { JobDescription } from '../../types';
import './GenerateQuestionModal.css';

// Using the global JobDescription interface from types

interface Topic {
  id: string;
  name: string;
  category: 'technical' | 'aptitude';
}

interface GenerateQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestionsGenerated: (questions: any[]) => void;
  jobDescriptions: JobDescription[];
  topics: Topic[];
  loading?: boolean;
}

type InputMethod = 'existing_jd' | 'upload_pdf' | 'manual_input' | 'custom_topic';

const GenerateQuestionModal: React.FC<GenerateQuestionModalProps> = ({
  isOpen,
  onClose,
  onQuestionsGenerated,
  jobDescriptions,
  topics,
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
  
  // Selected topics
  const [selectedTopics, setSelectedTopics] = useState<Array<{
    topic_id: string;
    weight: number;
    min_questions: number;
    max_questions: number;
  }>>([]);
  
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
  }, [easyQuestions, mediumQuestions, hardQuestions]);

  // Helper functions for balanced difficulty adjustment
  const adjustDifficultyBalanced = (changedType: 'easy' | 'medium' | 'hard', newValue: number) => {
    const currentTotal = easyQuestions + mediumQuestions + hardQuestions;
    const increase = newValue - (changedType === 'easy' ? easyQuestions : changedType === 'medium' ? mediumQuestions : hardQuestions);
    
    if (increase === 0) return; // No change needed
    
    // Get current values of other types
    const otherTypes = ['easy', 'medium', 'hard'].filter(type => type !== changedType) as ('easy' | 'medium' | 'hard')[];
    const otherValues = otherTypes.map(type => ({
      type,
      value: type === 'easy' ? easyQuestions : type === 'medium' ? mediumQuestions : hardQuestions
    }));
    
    // Sort by value (highest first)
    otherValues.sort((a, b) => b.value - a.value);
    
    // Reduce from highest values first
    let remainingToReduce = Math.abs(increase);
    const newOtherValues = [...otherValues];
    
    for (let i = 0; i < newOtherValues.length && remainingToReduce > 0; i++) {
      const canReduce = Math.min(newOtherValues[i].value, remainingToReduce);
      newOtherValues[i].value -= canReduce;
      remainingToReduce -= canReduce;
    }
    
    // Update all values
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
    setSelectedTopics([]);
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

  const handleTopicSelection = (topicId: string, checked: boolean) => {
    if (checked) {
      const topic = topics.find(t => t.id === topicId);
      if (topic) {
        setSelectedTopics(prev => [...prev, {
          topic_id: topicId,
          weight: 10, // Default weight
          min_questions: 1,
          max_questions: 3
        }]);
      }
    } else {
      setSelectedTopics(prev => prev.filter(t => t.topic_id !== topicId));
    }
  };

  // Auto-select topics based on job description when existing_jd is selected
  const autoSelectTopicsFromJobDescription = (jobDescriptionId: string) => {
    const selectedJD = jobDescriptions.find(jd => jd.id === jobDescriptionId);
    if (!selectedJD) return;

    // Map job description skills to topics
    const relevantTopics: string[] = [];
    
    // Check technical skills against technical topics
    const allSkills = [
      ...(selectedJD.required_skills || []),
      ...(selectedJD.preferred_skills || []),
      ...(selectedJD.skills || [])
    ].map(skill => skill.toLowerCase());

    topics.forEach(topic => {
      const topicName = topic.name.toLowerCase();
      const isRelevant = allSkills.some(skill => 
        topicName.includes(skill) || 
        skill.includes(topicName) ||
        // Specific skill mappings
        (skill.includes('react') && topicName.includes('web development')) ||
        (skill.includes('javascript') && topicName.includes('web development')) ||
        (skill.includes('python') && topicName.includes('programming')) ||
        (skill.includes('java') && topicName.includes('programming')) ||
        (skill.includes('sql') && topicName.includes('database')) ||
        (skill.includes('aws') && topicName.includes('cloud')) ||
        (skill.includes('docker') && topicName.includes('cloud')) ||
        (skill.includes('kubernetes') && topicName.includes('cloud'))
      );

      if (isRelevant) {
        relevantTopics.push(topic.id);
      }
    });

    // Always include some aptitude topics
    const aptitudeTopics = topics.filter(t => t.category === 'aptitude').slice(0, 2);
    aptitudeTopics.forEach(topic => {
      if (!relevantTopics.includes(topic.id)) {
        relevantTopics.push(topic.id);
      }
    });

    // Set selected topics with appropriate weights
    const newSelectedTopics = relevantTopics.map(topicId => ({
      topic_id: topicId,
      weight: 15, // Higher weight for auto-selected topics
      min_questions: 1,
      max_questions: 4
    }));

    setSelectedTopics(newSelectedTopics);
  };

  const updateTopicConfig = (topicId: string, field: string, value: number) => {
    setSelectedTopics(prev => prev.map(topic => 
      topic.topic_id === topicId 
        ? { ...topic, [field]: value }
        : topic
    ));
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

    if (selectedTopics.length === 0) {
      if (inputMethod === 'existing_jd') {
        newErrors.topics = 'Please select a job description to auto-select topics';
      } else {
        newErrors.topics = 'Please select at least one topic';
      }
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
          sourceInfo = { extracted_text: extractedText };
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
        },
        topics: selectedTopics.map(topic => ({
          name: topics.find(t => t.id === topic.topic_id)?.name || '',
          weight: topic.weight,
          min_questions: topic.min_questions,
          max_questions: topic.max_questions
        }))
      };

      // Build request for N8N workflow
      const request = buildQuestionGenerationRequest(
        jobDescriptionData,
        generationConfig,
        inputMethod,
        sourceInfo
      );

      // Debug: Log the request being sent to n8n
      // Send request to n8n workflow

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
    try {
      setGenerating(true);
      
      // Convert generated questions to the format expected by questionService
      const questionsToSave = generatedQuestions.map(q => ({
        question_text: q.question_text,
        question_type: q.question_type,
        question_category: q.question_category,
        difficulty_level: q.difficulty_level,
        topic_id: topics.find(t => t.name === q.topic)?.id || '',
        subtopic: q.subtopic || '',
        points: q.points,
        time_limit_seconds: q.time_limit_seconds,
        mcq_options: q.mcq_options || [],
        correct_answer: q.correct_answer,
        answer_explanation: q.answer_explanation,
        tags: q.tags || []
      }));

      // Save questions to database
      const savedQuestions = [];
      for (const questionData of questionsToSave) {
        const savedQuestion = await questionService.createQuestion(questionData);
        savedQuestions.push(savedQuestion);
      }

      onQuestionsGenerated(savedQuestions);
      onClose();

    } catch (error) {
      console.error('Error saving questions:', error);
      setErrors({ 
        general: `Failed to save questions: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Generate Questions</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {!showPreview ? (
            <div className="space-y-6">
              {/* General Error */}
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-700">{errors.general}</span>
                </div>
              )}

              {/* Input Method Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Input Method *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button
                    onClick={() => setInputMethod('existing_jd')}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      inputMethod === 'existing_jd'
                        ? 'border-ai-teal bg-ai-teal/10 text-ai-teal'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <BookOpen className="h-6 w-6 mx-auto mb-2" />
                    <span className="text-sm font-medium">Existing JD</span>
                  </button>

                  <button
                    onClick={() => setInputMethod('upload_pdf')}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      inputMethod === 'upload_pdf'
                        ? 'border-ai-teal bg-ai-teal/10 text-ai-teal'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Upload className="h-6 w-6 mx-auto mb-2" />
                    <span className="text-sm font-medium">Upload JD</span>
                  </button>

                  <button
                    onClick={() => setInputMethod('manual_input')}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      inputMethod === 'manual_input'
                        ? 'border-ai-teal bg-ai-teal/10 text-ai-teal'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Type className="h-6 w-6 mx-auto mb-2" />
                    <span className="text-sm font-medium">Type Manually</span>
                  </button>

                  <button
                    onClick={() => setInputMethod('custom_topic')}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      inputMethod === 'custom_topic'
                        ? 'border-ai-teal bg-ai-teal/10 text-ai-teal'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Brain className="h-6 w-6 mx-auto mb-2" />
                    <span className="text-sm font-medium">Custom Topic</span>
                  </button>
                </div>
              </div>

              {/* Input Method Content */}
              {inputMethod === 'existing_jd' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Job Description *
                  </label>
                  <select
                    value={selectedJobDescription}
          onChange={(e) => {
            const selectedId = e.target.value;
            setSelectedJobDescription(selectedId);
            if (selectedId) {
              autoSelectTopicsFromJobDescription(selectedId);
            }
          }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent ${
                      errors.jobDescription ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Choose a job description...</option>
                    {jobDescriptions.length === 0 ? (
                      <option value="" disabled>No job descriptions available</option>
                    ) : (
                      jobDescriptions.map(jd => (
                        <option key={jd.id} value={jd.id}>
                          {jd.title || 'Untitled Job Description'}
                        </option>
                      ))
                    )}
                  </select>
                  {errors.jobDescription && (
                    <p className="mt-1 text-sm text-red-600">{errors.jobDescription}</p>
                  )}
                </div>
              )}

              {inputMethod === 'upload_pdf' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Job Description PDF *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="pdf-upload"
                    />
                    <label
                      htmlFor="pdf-upload"
                      className="cursor-pointer flex flex-col items-center space-y-2"
                    >
                      {extracting ? (
                        <>
                          <Loader2 className="h-8 w-8 text-ai-teal animate-spin" />
                          <span className="text-sm text-gray-600">Extracting text...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            Click to upload PDF or drag and drop
                          </span>
                          <span className="text-xs text-gray-500">Max file size: 10MB</span>
                        </>
                      )}
                    </label>
                  </div>
                  {errors.file && (
                    <p className="mt-1 text-sm text-red-600">{errors.file}</p>
                  )}
                  
                  {extractedText && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Extracted Text Preview
                      </label>
                      <div className="bg-gray-50 border rounded-lg p-4 max-h-40 overflow-y-auto">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                          {extractedText.substring(0, 500)}
                          {extractedText.length > 500 && '...'}
                        </pre>
                      </div>
                    </div>
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
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent resize-none ${
                      errors.manualDescription ? 'border-red-300' : 'border-gray-300'
                    }`}
                    rows={6}
                  />
                  {errors.manualDescription && (
                    <p className="mt-1 text-sm text-red-600">{errors.manualDescription}</p>
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
                      placeholder="e.g., Machine Learning, Data Structures, etc."
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent ${
                        errors.customTopic ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.customTopic && (
                      <p className="mt-1 text-sm text-red-600">{errors.customTopic}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Topic Insights (Optional)
                    </label>
                    <textarea
                      value={topicInsights}
                      onChange={(e) => setTopicInsights(e.target.value)}
                      placeholder="Provide additional context or specific areas to focus on..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent resize-none"
                      rows={4}
                    />
                  </div>
                </div>
              )}

              {/* Generation Configuration */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Generation Configuration</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Questions *
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="50"
                      value={totalQuestions}
                      onChange={(e) => setTotalQuestions(parseInt(e.target.value) || 15)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent ${
                        errors.totalQuestions ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.totalQuestions && (
                      <p className="mt-1 text-sm text-red-600">{errors.totalQuestions}</p>
                    )}
                  </div>

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

                {/* Difficulty Summary */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Difficulty Distribution:</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-green-600 font-medium">{easyQuestions} Easy</span>
                      <span className="text-yellow-600 font-medium">{mediumQuestions} Medium</span>
                      <span className="text-red-600 font-medium">{hardQuestions} Hard</span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Questions:</span>
                    <span className="font-medium text-green-600">
                      {easyQuestions + mediumQuestions + hardQuestions} (Auto-balanced)
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-blue-600">
                    💡 Adjust any slider to automatically balance the others
                  </div>
                </div>

                {errors.percentages && (
                  <p className="mt-2 text-sm text-red-600">{errors.percentages}</p>
                )}
                {errors.questionTypes && (
                  <p className="mt-2 text-sm text-red-600">{errors.questionTypes}</p>
                )}
                {errors.difficulty && (
                  <p className="mt-2 text-sm text-red-600">{errors.difficulty}</p>
                )}
              </div>

              {/* Topic Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {inputMethod === 'existing_jd' ? 'Auto-Selected Topics (Based on Job Description)' : 'Select Topics *'}
                </label>
                {inputMethod === 'existing_jd' && selectedJobDescription && (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Topics automatically selected based on the job description skills and requirements.</strong> 
                      You can modify the selection below if needed.
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {topics.map(topic => (
                    <div key={topic.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <input
                        type="checkbox"
                        id={`topic-${topic.id}`}
                        checked={selectedTopics.some(t => t.topic_id === topic.id)}
                        onChange={(e) => handleTopicSelection(topic.id, e.target.checked)}
                        className="h-4 w-4 text-ai-teal focus:ring-ai-teal border-gray-300 rounded"
                      />
                      <label htmlFor={`topic-${topic.id}`} className="flex-1">
                        <div className="flex items-center space-x-2">
                          {topic.category === 'technical' ? (
                            <Brain className="h-4 w-4 text-blue-600" />
                          ) : (
                            <FileText className="h-4 w-4 text-green-600" />
                          )}
                          <span className="text-sm font-medium text-gray-900">{topic.name}</span>
                          <span className="text-xs text-gray-500 capitalize">({topic.category})</span>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
                {errors.topics && (
                  <p className="mt-2 text-sm text-red-600">{errors.topics}</p>
                )}

                {/* Topic Configuration */}
                {selectedTopics.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Topic Configuration</h4>
                    {selectedTopics.map(topic => {
                      const topicInfo = topics.find(t => t.id === topic.topic_id);
                      return (
                        <div key={topic.topic_id} className="bg-white border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-900">
                              {topicInfo?.name}
                            </span>
                            <button
                              onClick={() => handleTopicSelection(topic.topic_id, false)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Weight (%)</label>
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={topic.weight}
                                onChange={(e) => updateTopicConfig(topic.topic_id, 'weight', parseInt(e.target.value) || 10)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-ai-teal focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Min Questions</label>
                              <input
                                type="number"
                                min="1"
                                value={topic.min_questions}
                                onChange={(e) => updateTopicConfig(topic.topic_id, 'min_questions', parseInt(e.target.value) || 1)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-ai-teal focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Max Questions</label>
                              <input
                                type="number"
                                min="1"
                                value={topic.max_questions}
                                onChange={(e) => updateTopicConfig(topic.topic_id, 'max_questions', parseInt(e.target.value) || 3)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-ai-teal focus:border-transparent"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
                  ← Back to Configuration
                </button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {generatedQuestions.map((question, index) => (
                  <div key={index} className="bg-gray-50 border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-600">Q{index + 1}</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          question.question_type === 'mcq' 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-green-100 text-green-600'
                        }`}>
                          {question.question_type.toUpperCase()}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          question.difficulty_level === 'easy' 
                            ? 'bg-green-100 text-green-600'
                            : question.difficulty_level === 'medium'
                            ? 'bg-yellow-100 text-yellow-600'
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {question.difficulty_level}
                        </span>
                        <span className="text-xs text-gray-500">{question.points} pts</span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-900 mb-3">{question.question_text}</p>

                    {question.question_type === 'mcq' && question.mcq_options && (
                      <div className="space-y-1 mb-3">
                        {question.mcq_options.map((option: any) => (
                          <div key={option.option} className="flex items-center space-x-2">
                            <span className="text-xs font-medium text-gray-600 w-4">
                              {option.option}.
                            </span>
                            <span className={`text-xs ${
                              option.option === question.correct_answer 
                                ? 'text-green-600 font-medium' 
                                : 'text-gray-700'
                            }`}>
                              {option.text}
                            </span>
                            {option.option === question.correct_answer && (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      <span>Topic: {question.topic}</span>
                      {question.subtopic && <span> • Subtopic: {question.subtopic}</span>}
                      {question.tags && question.tags.length > 0 && (
                        <span> • Tags: {question.tags.join(', ')}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          
          {!showPreview ? (
            <button
              onClick={handleGenerateQuestions}
              disabled={generating || loading}
              className="px-4 py-2 bg-ai-teal text-white rounded-lg hover:bg-ai-teal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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
              disabled={generating}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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
  );
};

export default GenerateQuestionModal;
