import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  AlertCircle,
  Loader2,
  Trash2,
  Save
} from 'lucide-react';
import { questionPaperExtractionService, ExtractedQuestion, QuestionPaperExtractionRequest } from '../../services/questionPaperExtractionService';
import { questionService } from '../../services/questionService';
import { QuestionTopic } from '../../services/topicManagementService';

interface QuestionPaperUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestionsAdded: (questions: any[]) => void;
  topics: QuestionTopic[];
  loading?: boolean;
}

const QuestionPaperUploadModal: React.FC<QuestionPaperUploadModalProps> = ({
  isOpen,
  onClose,
  topics,
  onQuestionsAdded,
  loading = false
}) => {
  const [extracting, setExtracting] = useState(false);
  const [extractedQuestions, setExtractedQuestions] = useState<ExtractedQuestion[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  
  // Default values for extracted questions
  const [defaultTopic, setDefaultTopic] = useState<string>('');
  const [defaultDifficulty, setDefaultDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [defaultPoints, setDefaultPoints] = useState<number>(2);
  const [defaultTimeLimit, setDefaultTimeLimit] = useState<number>(60);


  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = questionPaperExtractionService.validateFile(file);
    if (!validation.valid) {
      setErrors({ file: validation.message || 'Invalid file' });
      return;
    }

    setExtracting(true);
    setErrors({});

    try {
      const request: QuestionPaperExtractionRequest = {
        file,
        topic_id: defaultTopic,
        default_difficulty: defaultDifficulty,
        default_points: defaultPoints,
        default_time_limit: defaultTimeLimit
      };

      const response = await questionPaperExtractionService.extractQuestions(request);
      
      if (response.extracted_questions && response.extracted_questions.length > 0) {
        setExtractedQuestions(response.extracted_questions);
        setShowPreview(true);
      } else {
        setErrors({ general: 'No questions were extracted from the PDF. Please try a different file.' });
      }
    } catch (error) {
      console.error('Error extracting questions:', error);
      setErrors({ 
        general: `Failed to extract questions: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setExtracting(false);
    }
  };

  const handleQuestionEdit = (index: number, field: string, value: any) => {
    setExtractedQuestions(prev => prev.map((question, i) => 
      i === index ? { ...question, [field]: value } : question
    ));
  };

  const handleRemoveQuestion = (index: number) => {
    setExtractedQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveQuestions = async () => {
    if (extractedQuestions.length === 0) {
      setErrors({ general: 'No questions to save' });
      return;
    }

    setSaving(true);
    setErrors({});

    try {
      // Convert extracted questions to QuestionFormData format
      const questionsToSave = questionPaperExtractionService.convertToQuestionFormData(extractedQuestions);
      
      // Save questions to database
      const savedQuestions = [];
      for (const questionData of questionsToSave) {
        const savedQuestion = await questionService.createQuestion(questionData);
        savedQuestions.push(savedQuestion);
      }

      onQuestionsAdded(savedQuestions);
      onClose();

    } catch (error) {
      console.error('Error saving questions:', error);
      setErrors({ 
        general: `Failed to save questions: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Upload Question Paper</h2>
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

              {/* Default Settings */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Default Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Topic
                    </label>
                    <select
                      value={defaultTopic}
                      onChange={(e) => setDefaultTopic(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent"
                    >
                      <option value="">Select a topic...</option>
                      {topics.map(topic => (
                        <option key={topic.id} value={topic.id}>
                          {topic.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Difficulty
                    </label>
                    <select
                      value={defaultDifficulty}
                      onChange={(e) => setDefaultDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Points
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={defaultPoints}
                      onChange={(e) => setDefaultPoints(parseInt(e.target.value) || 2)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Time Limit (seconds)
                    </label>
                    <input
                      type="number"
                      min="30"
                      max="600"
                      value={defaultTimeLimit}
                      onChange={(e) => setDefaultTimeLimit(parseInt(e.target.value) || 60)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Question Paper PDF *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="question-paper-upload"
                  />
                  <label
                    htmlFor="question-paper-upload"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    {extracting ? (
                      <>
                        <Loader2 className="h-8 w-8 text-ai-teal animate-spin" />
                        <span className="text-sm text-gray-600">Extracting questions...</span>
                        <span className="text-xs text-gray-500">This may take a few moments</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Click to upload question paper PDF or drag and drop
                        </span>
                        <span className="text-xs text-gray-500">Max file size: 10MB</span>
                      </>
                    )}
                  </label>
                </div>
                {errors.file && (
                  <p className="mt-1 text-sm text-red-600">{errors.file}</p>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Instructions</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Upload a PDF file containing exam questions</li>
                  <li>• Questions should be clearly formatted with proper numbering</li>
                  <li>• MCQ questions should have options labeled A, B, C, D, etc.</li>
                  <li>• Correct answers should be clearly marked</li>
                  <li>• The system will extract and parse questions automatically</li>
                </ul>
              </div>
            </div>
          ) : (
            /* Preview Extracted Questions */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Extracted Questions ({extractedQuestions.length})
                </h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-ai-teal hover:text-ai-teal/80 text-sm font-medium"
                >
                  ← Back to Upload
                </button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {extractedQuestions.map((question, index) => (
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
                        <span className="text-xs text-gray-500">{question.time_limit_seconds}s</span>
                      </div>
                      <button
                        onClick={() => handleRemoveQuestion(index)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Question Text</label>
                        <textarea
                          value={question.question_text}
                          onChange={(e) => handleQuestionEdit(index, 'question_text', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-ai-teal focus:border-transparent resize-none"
                          rows={2}
                        />
                      </div>

                      {question.question_type === 'mcq' && question.mcq_options && (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Options</label>
                          <div className="space-y-1">
                            {question.mcq_options.map((option, optIndex) => (
                              <div key={optIndex} className="flex items-center space-x-2">
                                <span className="text-xs font-medium text-gray-600 w-4">
                                  {option.option}.
                                </span>
                                <input
                                  type="text"
                                  value={option.text}
                                  onChange={(e) => {
                                    const newOptions = [...question.mcq_options!];
                                    newOptions[optIndex].text = e.target.value;
                                    handleQuestionEdit(index, 'mcq_options', newOptions);
                                  }}
                                  className={`flex-1 px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-ai-teal focus:border-transparent ${
                                    option.option === question.correct_answer 
                                      ? 'border-green-300 bg-green-50' 
                                      : 'border-gray-300'
                                  }`}
                                />
                                <input
                                  type="radio"
                                  name={`correct-${index}`}
                                  checked={option.option === question.correct_answer}
                                  onChange={() => handleQuestionEdit(index, 'correct_answer', option.option)}
                                  className="h-3 w-3 text-ai-teal focus:ring-ai-teal border-gray-300"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Correct Answer</label>
                        <textarea
                          value={question.correct_answer}
                          onChange={(e) => handleQuestionEdit(index, 'correct_answer', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-ai-teal focus:border-transparent resize-none"
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Difficulty</label>
                          <select
                            value={question.difficulty_level}
                            onChange={(e) => handleQuestionEdit(index, 'difficulty_level', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-ai-teal focus:border-transparent"
                          >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Points</label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={question.points}
                            onChange={(e) => handleQuestionEdit(index, 'points', parseInt(e.target.value) || 1)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-ai-teal focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Time (s)</label>
                          <input
                            type="number"
                            min="30"
                            max="600"
                            value={question.time_limit_seconds}
                            onChange={(e) => handleQuestionEdit(index, 'time_limit_seconds', parseInt(e.target.value) || 60)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-ai-teal focus:border-transparent"
                          />
                        </div>
                      </div>
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
          
          {showPreview && (
            <button
              onClick={handleSaveQuestions}
              disabled={saving || loading || extractedQuestions.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Questions ({extractedQuestions.length})</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionPaperUploadModal;
