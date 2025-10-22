// Exam Progress Bar Component
// Shows overall exam progress with time and question statistics

import React from 'react';
import { Clock, CheckCircle, Target, TrendingUp } from 'lucide-react';
import { ExamProgressProps } from '../../types';

export const ExamProgressBar: React.FC<ExamProgressProps> = ({
  currentQuestion,
  totalQuestions,
  answeredQuestions,
  timeRemaining
}) => {
  const progressPercentage = (answeredQuestions / totalQuestions) * 100;
  const timeProgressPercentage = ((30 - timeRemaining) / 30) * 100; // Assuming 30 min exam

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.floor((minutes % 1) * 60);
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = (): string => {
    if (timeRemaining <= 5) return 'text-red-600';
    if (timeRemaining <= 10) return 'text-yellow-600';
    return 'text-blue-600';
  };

  const getTimeBgColor = (): string => {
    if (timeRemaining <= 5) return 'bg-red-50 border-red-200';
    if (timeRemaining <= 10) return 'bg-yellow-50 border-yellow-200';
    return 'bg-blue-50 border-blue-200';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Exam Progress</h3>
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg border ${getTimeBgColor()}`}>
            <Clock className={`w-4 h-4 ${getTimeColor()}`} />
            <span className={`text-sm font-medium ${getTimeColor()}`}>
              {formatTime(timeRemaining)}
            </span>
          </div>
        </div>
      </div>

      {/* Main progress section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Questions progress */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">Questions Progress</span>
            </div>
            <span className="text-sm text-gray-600">
              {answeredQuestions} of {totalQuestions} completed
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-lg font-semibold text-green-800">
                {answeredQuestions}
              </div>
              <div className="text-xs text-green-600">Answered</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3">
              <div className="text-lg font-semibold text-yellow-800">
                {totalQuestions - answeredQuestions}
              </div>
              <div className="text-xs text-yellow-600">Remaining</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-lg font-semibold text-blue-800">
                {currentQuestion}
              </div>
              <div className="text-xs text-blue-600">Current</div>
            </div>
          </div>
        </div>

        {/* Time progress */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-green-600" />
              <span className="font-medium text-gray-900">Time Progress</span>
            </div>
            <span className="text-sm text-gray-600">
              {formatTime(30 - timeRemaining)} elapsed
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Time Used</span>
              <span>{Math.round(timeProgressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ease-out ${
                  timeRemaining <= 5 ? 'bg-red-500' : 
                  timeRemaining <= 10 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${timeProgressPercentage}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-lg font-semibold text-green-800">
                {formatTime(timeRemaining)}
              </div>
              <div className="text-xs text-green-600">Remaining</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-lg font-semibold text-blue-800">
                {formatTime(30 - timeRemaining)}
              </div>
              <div className="text-xs text-blue-600">Elapsed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance indicators */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span className="font-medium text-gray-900">Performance Indicators</span>
          </div>
        </div>
        
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center">
            <div className="text-sm text-gray-600">Avg. Time/Question</div>
            <div className="text-lg font-semibold text-gray-900">
              {answeredQuestions > 0 ? Math.round((30 - timeRemaining) / answeredQuestions) : 0}m
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Completion Rate</div>
            <div className="text-lg font-semibold text-gray-900">
              {Math.round(progressPercentage)}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Time Efficiency</div>
            <div className={`text-lg font-semibold ${
              timeProgressPercentage < 50 ? 'text-green-600' : 
              timeProgressPercentage < 80 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {timeProgressPercentage < 50 ? 'Good' : 
               timeProgressPercentage < 80 ? 'Moderate' : 'Slow'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Pace</div>
            <div className={`text-lg font-semibold ${
              progressPercentage > timeProgressPercentage ? 'text-green-600' : 
              progressPercentage > timeProgressPercentage * 0.8 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {progressPercentage > timeProgressPercentage ? 'Ahead' : 
               progressPercentage > timeProgressPercentage * 0.8 ? 'On Track' : 'Behind'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamProgressBar;
