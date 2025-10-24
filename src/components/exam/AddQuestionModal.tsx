import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Save, 
  AlertCircle,
  CheckCircle,
  Brain,
  FileText,
  Upload,
  Type,
  BookOpen,
  FileCheck
} from 'lucide-react';
import QuestionPaperUploadModal from './QuestionPaperUploadModal';
import { QuestionTopic } from '../../services/topicManagementService';

interface MCQOption {
  option: string;
  text: string;
}

interface QuestionFormData {
  question_text: string;
  question_type: 'mcq' | 'text';
  question_category: 'technical' | 'aptitude';
  difficulty_level: 'easy' | 'medium' | 'hard';
  topic_id: string;
  subtopic: string;
  points: number;
  time_limit_seconds: number;
  mcq_options: MCQOption[];
  correct_answer: string;
  answer_explanation: string;
  tags: string[];
}

// Using QuestionTopic from topicManagementService instead of local interface

interface AddQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: QuestionFormData) => Promise<void>;
  onQuestionsAdded?: (questions: any[]) => void;
  topics: QuestionTopic[];
  loading?: boolean;
}

const AddQuestionModal: React.FC<AddQuestionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onQuestionsAdded,
  topics,
  loading = false
}) => {
  const [formData, setFormData] = useState<QuestionFormData>({
    question_text: '',
    question_type: 'mcq',
    question_category: 'technical',
    difficulty_level: 'medium',
    topic_id: '',
    subtopic: '',
    points: 1,
    time_limit_seconds: 60,
    mcq_options: [
      { option: 'A', text: '' },
      { option: 'B', text: '' },
      { option: 'C', text: '' },
      { option: 'D', text: '' }
    ],
    correct_answer: '',
    answer_explanation: '',
    tags: []
  });

  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showQuestionPaperUpload, setShowQuestionPaperUpload] = useState(false);

  // Filter topics based on selected category
  const filteredTopics = topics.filter(topic => topic.category === formData.question_category);

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        question_text: '',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        topic_id: '',
        subtopic: '',
        points: 1,
        time_limit_seconds: 60,
        mcq_options: [
          { option: 'A', text: '' },
          { option: 'B', text: '' },
          { option: 'C', text: '' },
          { option: 'D', text: '' }
        ],
        correct_answer: '',
        answer_explanation: '',
        tags: []
      });
      setErrors({});
      setTagInput('');
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof QuestionFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleMCQOptionChange = (index: number, text: string) => {
    const newOptions = [...formData.mcq_options];
    newOptions[index].text = text;
    setFormData(prev => ({
      ...prev,
      mcq_options: newOptions
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.question_text.trim()) {
      newErrors.question_text = 'Question text is required';
    }

    if (!formData.topic_id) {
      newErrors.topic_id = 'Please select a topic';
    }

    if (formData.question_type === 'mcq') {
      // Validate MCQ options
      const emptyOptions = formData.mcq_options.filter(option => !option.text.trim());
      if (emptyOptions.length > 0) {
        newErrors.mcq_options = 'All MCQ options must be filled';
      }

      if (!formData.correct_answer) {
        newErrors.correct_answer = 'Please select the correct answer';
      }
    }

    if (!formData.answer_explanation.trim()) {
      newErrors.answer_explanation = 'Answer explanation is required';
    }

    if (formData.points < 1 || formData.points > 10) {
      newErrors.points = 'Points must be between 1 and 10';
    }

    if (formData.time_limit_seconds < 30 || formData.time_limit_seconds > 300) {
      newErrors.time_limit_seconds = 'Time limit must be between 30 and 300 seconds';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving question:', error);
      setErrors({ general: 'Failed to save question. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleQuestionsAdded = (questions: any[]) => {
    if (onQuestionsAdded) {
      onQuestionsAdded(questions);
    }
    setShowQuestionPaperUpload(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add New Question</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowQuestionPaperUpload(true)}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <FileCheck className="h-4 w-4" />
              <span>Upload Question Paper</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* General Error */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-700">{errors.general}</span>
            </div>
          )}

          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Text *
            </label>
            <textarea
              value={formData.question_text}
              onChange={(e) => handleInputChange('question_text', e.target.value)}
              placeholder="Enter your question here..."
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent resize-none ${
                errors.question_text ? 'border-red-300' : 'border-gray-300'
              }`}
              rows={3}
            />
            {errors.question_text && (
              <p className="mt-1 text-sm text-red-600">{errors.question_text}</p>
            )}
          </div>

          {/* Question Type and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Type *
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="mcq"
                    checked={formData.question_type === 'mcq'}
                    onChange={(e) => handleInputChange('question_type', e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">MCQ</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="text"
                    checked={formData.question_type === 'text'}
                    onChange={(e) => handleInputChange('question_type', e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">Text</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="technical"
                    checked={formData.question_category === 'technical'}
                    onChange={(e) => {
                      handleInputChange('question_category', e.target.value);
                      handleInputChange('topic_id', ''); // Reset topic when category changes
                    }}
                    className="mr-2"
                  />
                  <Brain className="h-4 w-4 mr-1 text-blue-600" />
                  <span className="text-sm">Technical</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="aptitude"
                    checked={formData.question_category === 'aptitude'}
                    onChange={(e) => {
                      handleInputChange('question_category', e.target.value);
                      handleInputChange('topic_id', ''); // Reset topic when category changes
                    }}
                    className="mr-2"
                  />
                  <FileText className="h-4 w-4 mr-1 text-green-600" />
                  <span className="text-sm">Aptitude</span>
                </label>
              </div>
            </div>
          </div>

          {/* Topic and Difficulty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topic *
              </label>
              <select
                value={formData.topic_id}
                onChange={(e) => handleInputChange('topic_id', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent ${
                  errors.topic_id ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select a topic</option>
                {filteredTopics.map(topic => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
              {errors.topic_id && (
                <p className="mt-1 text-sm text-red-600">{errors.topic_id}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level *
              </label>
              <select
                value={formData.difficulty_level}
                onChange={(e) => handleInputChange('difficulty_level', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Subtopic */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subtopic (Optional)
            </label>
            <input
              type="text"
              value={formData.subtopic}
              onChange={(e) => handleInputChange('subtopic', e.target.value)}
              placeholder="e.g., React Hooks, Array Methods, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent"
            />
          </div>

          {/* Points and Time Limit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Points *
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.points}
                onChange={(e) => handleInputChange('points', parseInt(e.target.value) || 1)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent ${
                  errors.points ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.points && (
                <p className="mt-1 text-sm text-red-600">{errors.points}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Limit (seconds) *
              </label>
              <input
                type="number"
                min="30"
                max="300"
                value={formData.time_limit_seconds}
                onChange={(e) => handleInputChange('time_limit_seconds', parseInt(e.target.value) || 60)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent ${
                  errors.time_limit_seconds ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.time_limit_seconds && (
                <p className="mt-1 text-sm text-red-600">{errors.time_limit_seconds}</p>
              )}
            </div>
          </div>

          {/* MCQ Options */}
          {formData.question_type === 'mcq' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                MCQ Options *
              </label>
              <div className="space-y-3">
                {formData.mcq_options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <span className="w-8 text-sm font-medium text-gray-700">
                      {option.option}.
                    </span>
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => handleMCQOptionChange(index, e.target.value)}
                      placeholder={`Option ${option.option} text`}
                      className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent ${
                        errors.mcq_options ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="correct_answer"
                        value={option.option}
                        checked={formData.correct_answer === option.option}
                        onChange={(e) => handleInputChange('correct_answer', e.target.value)}
                        className="mr-1"
                      />
                      <span className="text-sm text-gray-600">Correct</span>
                    </label>
                  </div>
                ))}
              </div>
              {errors.mcq_options && (
                <p className="mt-1 text-sm text-red-600">{errors.mcq_options}</p>
              )}
              {errors.correct_answer && (
                <p className="mt-1 text-sm text-red-600">{errors.correct_answer}</p>
              )}
            </div>
          )}

          {/* Correct Answer for Text Questions */}
          {formData.question_type === 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Answer *
              </label>
              <textarea
                value={formData.correct_answer}
                onChange={(e) => handleInputChange('correct_answer', e.target.value)}
                placeholder="Enter the expected answer or key points..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent resize-none"
                rows={3}
              />
            </div>
          )}

          {/* Answer Explanation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Answer Explanation *
            </label>
            <textarea
              value={formData.answer_explanation}
              onChange={(e) => handleInputChange('answer_explanation', e.target.value)}
              placeholder="Explain why this is the correct answer..."
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent resize-none ${
                errors.answer_explanation ? 'border-red-300' : 'border-gray-300'
              }`}
              rows={3}
            />
            {errors.answer_explanation && (
              <p className="mt-1 text-sm text-red-600">{errors.answer_explanation}</p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add a tag..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-ai-teal text-white rounded-lg hover:bg-ai-teal/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-4 py-2 bg-ai-teal text-white rounded-lg hover:bg-ai-teal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Question</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Question Paper Upload Modal */}
      <QuestionPaperUploadModal
        isOpen={showQuestionPaperUpload}
        onClose={() => setShowQuestionPaperUpload(false)}
        onQuestionsAdded={handleQuestionsAdded}
        topics={topics}
        loading={saving}
      />
    </div>
  );
};

export default AddQuestionModal;
