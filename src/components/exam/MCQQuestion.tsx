// MCQ Question Component
// Displays multiple choice questions with radio button selection

import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';
import { MCQQuestionProps } from '../../types';
import { FormattedQuestionText } from './FormattedQuestionText';

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
    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200/50 p-4 sm:p-6 lg:p-8 shadow-lg">
      {/* Question Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <span className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 text-xs sm:text-sm font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-sm">
              {question.points} point{question.points !== 1 ? 's' : ''}
            </span>
          </div>
          {/* Time limit hidden per mobile UX request */}
        </div>
        
        <div className="text-lg sm:text-xl font-semibold text-gray-900 leading-relaxed">
          <FormattedQuestionText text={question.question_text} />
        </div>
      </div>

      {/* Options */}
      <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
        {question.mcq_options?.map((option, index) => {
          const isSelected = selectedAnswer === option.option;
          const isCorrect = question.correct_answer === option.option;
          
          return (
            <div
              key={option.option}
              className={`
                flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 lg:p-5 rounded-lg sm:rounded-xl border-2 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md
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
              <div className="flex-shrink-0 mt-0.5 sm:mt-1">
                {isSelected ? (
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                ) : (
                  <Circle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                )}
              </div>
              
              {/* Option content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <span className="font-bold text-gray-700 min-w-[24px] sm:min-w-[32px] text-base sm:text-lg flex-shrink-0">
                    {option.option}.
                  </span>
                  <span className="text-gray-900 leading-relaxed text-base sm:text-lg break-words">
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
        <div className="mb-4 sm:mb-6 p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg sm:rounded-xl border border-gray-200 shadow-sm">
          <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-base sm:text-lg">Explanation:</h4>
          <p className="text-gray-700 leading-relaxed text-sm sm:text-base lg:text-lg">
            {question.answer_explanation}
          </p>
        </div>
      )}
    </div>
  );
};

export default MCQQuestion;
