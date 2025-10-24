// Create Question Modal
// Modal for manually creating exam questions

import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Save, AlertCircle } from 'lucide-react';
import { JobDescription } from '../../types';
import { JobDescriptionsService } from '../../services/jobDescriptions';
import { questionService } from '../../services/questionService';

interface CreateQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface MCQOption {
  option: string;
  text: string;
}

const CreateQuestionModal: React.FC<CreateQuestionModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    job_description_id: '',
    question_text: '',
    question_type: 'mcq' as 'mcq' | 'text',
    question_category: 'technical' as 'technical' | 'aptitude',
    difficulty_level: 'medium' as 'easy' | 'medium' | 'hard',
    correct_answer: '',
    answer_explanation: '',
    points: 1,
    time_limit_seconds: 60,
    tags: [] as string[],
    subtopic: '',
    hr_notes: ''
  });

  const [mcqOptions, setMcqOptions] = useState<MCQOption[]>([
    { option: 'A', text: '' },
    { option: 'B', text: '' },
    { option: 'C', text: '' },
    { option: 'D', text: '' }
  ]);

  const [newTag, setNewTag] = useState('');

  // Load job descriptions
  useEffect(() => {
    if (isOpen) {
      loadJobDescriptions();
    }
  }, [isOpen]);

  const loadJobDescriptions = async () => {
    try {
      setLoading(true);
      const result = await JobDescriptionsService.getJobDescriptions();
      if (result.data) {
        setJobDescriptions(result.data);
      }
    } catch (error) {
      console.error('Error loading job descriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.question_text.trim()) {
      setError('Question text is required');
      return;
    }

    if (formData.question_type === 'mcq') {
      const validOptions = mcqOptions.filter(opt => opt.text.trim());
      if (validOptions.length < 2) {
        setError('At least 2 MCQ options are required');
        return;
      }
      if (!formData.correct_answer) {
        setError('Correct answer is required for MCQ questions');
        return;
      }
    }

    try {
      setSubmitting(true);
      setError(null);

      const questionData = {
        ...formData,
        mcq_options: formData.question_type === 'mcq' ? mcqOptions.filter(opt => opt.text.trim()) : undefined,
        status: 'draft' as const,
        created_by: 'hr' as const
      };

      const result = await questionService.createQuestion(questionData);
      
      if (result.success) {
        onSuccess();
        resetForm();
        onClose();
      } else {
        setError(result.error || 'Failed to create question');
      }
    } catch (error) {
      console.error('Error creating question:', error);
      setError('Failed to create question');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      job_description_id: '',
      question_text: '',
      question_type: 'mcq',
      question_category: 'technical',
      difficulty_level: 'medium',
      correct_answer: '',
      answer_explanation: '',
      points: 1,
      time_limit_seconds: 60,
      tags: [],
      subtopic: '',
      hr_notes: ''
    });
    setMcqOptions([
      { option: 'A', text: '' },
      { option: 'B', text: '' },
      { option: 'C', text: '' },
      { option: 'D', text: '' }
    ]);
    setNewTag('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const addMcqOption = () => {
    const nextOption = String.fromCharCode(65 + mcqOptions.length);
    setMcqOptions([...mcqOptions, { option: nextOption, text: '' }]);
  };

  const removeMcqOption = (index: number) => {
    if (mcqOptions.length > 2) {
      setMcqOptions(mcqOptions.filter((_, i) => i !== index));
    }
  };

  const updateMcqOption = (index: number, text: string) => {
    const updated = [...mcqOptions];
    updated[index].text = text;
    setMcqOptions(updated);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Plus className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Create New Question</h2>
              <p className="text-sm text-gray-600">Add a new question to the question bank</p>
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
          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Job Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Job Description</label>
              <select
                value={formData.job_description_id}
                onChange={(e) => setFormData(prev => ({ ...prev, job_description_id: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a job description...</option>
                {jobDescriptions.map(job => (
                  <option key={job.id} value={job.id}>
                    {job.title} - {job.department}
                  </option>
                ))}
              </select>
            </div>

            {/* Question Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Question Type</label>
              <select
                value={formData.question_type}
                onChange={(e) => setFormData(prev => ({ ...prev, question_type: e.target.value as 'mcq' | 'text' }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="mcq">Multiple Choice</option>
                <option value="text">Text Answer</option>
              </select>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Category</label>
              <select
                value={formData.question_category}
                onChange={(e) => setFormData(prev => ({ ...prev, question_category: e.target.value as 'technical' | 'aptitude' }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="technical">Technical</option>
                <option value="aptitude">Aptitude</option>
              </select>
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Difficulty Level</label>
              <select
                value={formData.difficulty_level}
                onChange={(e) => setFormData(prev => ({ ...prev, difficulty_level: e.target.value as 'easy' | 'medium' | 'hard' }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Question Text</label>
            <textarea
              value={formData.question_text}
              onChange={(e) => setFormData(prev => ({ ...prev, question_text: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Enter the question text..."
              required
            />
          </div>

          {/* MCQ Options */}
          {formData.question_type === 'mcq' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Answer Options</label>
                <button
                  type="button"
                  onClick={addMcqOption}
                  className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Option</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {mcqOptions.map((option, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <span className="w-8 text-sm font-medium text-gray-700">{option.option}.</span>
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => updateMcqOption(index, e.target.value)}
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`Option ${option.option}`}
                    />
                    {mcqOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeMcqOption(index)}
                        className="p-2 text-red-600 hover:text-red-800"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Correct Answer */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Correct Answer</label>
                <select
                  value={formData.correct_answer}
                  onChange={(e) => setFormData(prev => ({ ...prev, correct_answer: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select correct answer...</option>
                  {mcqOptions.map(option => (
                    <option key={option.option} value={option.option}>
                      {option.option} - {option.text || 'Empty option'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Answer Explanation */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Answer Explanation</label>
            <textarea
              value={formData.answer_explanation}
              onChange={(e) => setFormData(prev => ({ ...prev, answer_explanation: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Explain why this is the correct answer..."
            />
          </div>

          {/* Additional Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Points */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Points</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.points}
                onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Time Limit */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Time Limit (seconds)</label>
              <input
                type="number"
                min="30"
                max="300"
                value={formData.time_limit_seconds}
                onChange={(e) => setFormData(prev => ({ ...prev, time_limit_seconds: parseInt(e.target.value) || 60 }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Subtopic */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Subtopic</label>
              <input
                type="text"
                value={formData.subtopic}
                onChange={(e) => setFormData(prev => ({ ...prev, subtopic: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., React Hooks, Data Structures"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tags</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add a tag..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* HR Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">HR Notes</label>
            <textarea
              value={formData.hr_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, hr_notes: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="Additional notes or comments..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
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
              disabled={submitting || loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Create Question</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateQuestionModal;
