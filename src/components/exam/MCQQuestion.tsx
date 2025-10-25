// MCQ Question Component
// Displays multiple choice questions with radio button selection

import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';
import { MCQQuestionProps } from '../../types';

export const MCQQuestion: React.FC<MCQQuestionProps> = ({
  question,
  selectedAnswer,
  onAnswerSelect,
  disabled = false
}) => {
  const handleOptionSelect = (option: string) => {
    if (!disabled) {
      onAnswerSelect(option);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/50 p-8 shadow-lg">
      {/* Question Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <span className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 text-sm font-semibold px-3 py-1.5 rounded-full shadow-sm">
              {question.points} point{question.points !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
            Time limit: {question.time_limit_seconds}s
          </div>
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 leading-relaxed">
          {question.question_text}
        </h3>
      </div>

      {/* Options */}
      <div className="space-y-4">
        {question.mcq_options?.map((option, index) => {
          const isSelected = selectedAnswer === option.option;
          const isCorrect = question.correct_answer === option.option;
          
          return (
            <div
              key={option.option}
              className={`
                flex items-start space-x-4 p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md
                ${disabled 
                  ? 'cursor-not-allowed opacity-60' 
                  : 'hover:bg-gray-50 hover:border-gray-300'
                }
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-gray-200'
                }
                ${disabled && isCorrect 
                  ? 'border-green-500 bg-green-50' 
                  : ''
                }
              `}
              onClick={() => handleOptionSelect(option.option)}
            >
              {/* Option indicator */}
              <div className="flex-shrink-0 mt-1">
                {isSelected ? (
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-400" />
                )}
              </div>
              
              {/* Option content */}
              <div className="flex-1">
                <div className="flex items-center space-x-4">
                  <span className="font-bold text-gray-700 min-w-[32px] text-lg">
                    {option.option}.
                  </span>
                  <span className="text-gray-900 leading-relaxed text-lg">
                    {option.text}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Answer explanation (show when disabled and answer is selected) */}
      {disabled && selectedAnswer && question.answer_explanation && (
        <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 shadow-sm">
          <h4 className="font-semibold text-gray-900 mb-3 text-lg">Explanation:</h4>
          <p className="text-gray-700 leading-relaxed text-lg">
            {question.answer_explanation}
          </p>
        </div>
      )}

      {/* Topic and tags */}
      {(question.topic || question.tags.length > 0) && (
        <div className="mt-6 flex flex-wrap gap-3">
          {question.topic && (
            <span className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 text-sm font-semibold px-3 py-1.5 rounded-full shadow-sm">
              {question.topic.name}
            </span>
          )}
          {question.tags.map((tag, index) => (
            <span
              key={index}
              className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 text-sm font-semibold px-3 py-1.5 rounded-full shadow-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default MCQQuestion;
