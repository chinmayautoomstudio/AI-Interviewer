// Exam Progress Bar Component
// Shows overall exam progress with time and question statistics

import React from 'react';
import { Clock, Target, TrendingUp } from 'lucide-react';
import { ExamProgressProps } from '../../types';

export const ExamProgressBar: React.FC<ExamProgressProps> = ({
  currentQuestion,
  totalQuestions,
  answeredQuestions,
  timeRemaining,
  totalDuration
}) => {
  const progressPercentage = (answeredQuestions / totalQuestions) * 100;
  const timeProgressPercentage = ((totalDuration - timeRemaining) / totalDuration) * 100;

  const formatTime = (minutes: number): string => {
    const mins = Math.floor(minutes);
    const secs = Math.floor((minutes % 1) * 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
    <div className="bg-white rounded-2xl border border-gray-200/50 p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-semibold text-gray-900">Exam Progress</h3>
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-3 px-4 py-2 rounded-xl border ${getTimeBgColor()} shadow-sm`}>
            <Clock className={`w-5 h-5 ${getTimeColor()}`} />
            <span className={`text-sm font-semibold ${getTimeColor()}`}>
              {formatTime(timeRemaining)}
            </span>
          </div>
        </div>
      </div>

      {/* Main progress section */}
      <div className="space-y-6">
        {/* Questions progress */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Target className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900">Questions Progress</span>
            </div>
            <span className="text-sm text-gray-600 font-medium">
              {answeredQuestions} of {totalQuestions} completed
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span className="font-medium">Progress</span>
              <span className="font-semibold">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
              <div
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-3 shadow-sm">
              <div className="text-lg font-bold text-green-800">
                {answeredQuestions}
              </div>
              <div className="text-xs text-green-600 font-medium">Answered</div>
            </div>
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-3 shadow-sm">
              <div className="text-lg font-bold text-yellow-800">
                {totalQuestions - answeredQuestions}
              </div>
              <div className="text-xs text-yellow-600 font-medium">Remaining</div>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 shadow-sm">
              <div className="text-lg font-bold text-blue-800">
                {currentQuestion}
              </div>
              <div className="text-xs text-blue-600 font-medium">Current</div>
            </div>
          </div>
        </div>

        {/* Time progress */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-gray-900">Time Progress</span>
            </div>
            <span className="text-sm text-gray-600 font-medium">
              {formatTime(totalDuration - timeRemaining)} elapsed
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span className="font-medium">Time Used</span>
              <span className="font-semibold">{Math.round(timeProgressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
              <div
                className={`h-3 rounded-full transition-all duration-500 ease-out shadow-sm ${
                  timeRemaining <= 5 ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                  timeRemaining <= 10 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 'bg-gradient-to-r from-green-500 to-green-600'
                }`}
                style={{ width: `${timeProgressPercentage}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-3 shadow-sm">
              <div className="text-lg font-bold text-green-800">
                {formatTime(timeRemaining)}
              </div>
              <div className="text-xs text-green-600 font-medium">Remaining</div>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 shadow-sm">
              <div className="text-lg font-bold text-blue-800">
                {formatTime(totalDuration - timeRemaining)}
              </div>
              <div className="text-xs text-blue-600 font-medium">Elapsed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance indicators */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-gray-900">Performance Indicators</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 shadow-sm">
            <div className="text-sm text-gray-600 font-medium mb-1">Avg. Time/Question</div>
            <div className="text-base font-bold text-gray-900">
              {answeredQuestions > 0 ? Math.round((30 - timeRemaining) / answeredQuestions) : 0}m
            </div>
          </div>
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 shadow-sm">
            <div className="text-sm text-gray-600 font-medium mb-1">Completion Rate</div>
            <div className="text-base font-bold text-gray-900">
              {Math.round(progressPercentage)}%
            </div>
          </div>
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 shadow-sm">
            <div className="text-sm text-gray-600 font-medium mb-1">Time Efficiency</div>
            <div className={`text-base font-bold ${
              timeProgressPercentage < 50 ? 'text-green-600' : 
              timeProgressPercentage < 80 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {timeProgressPercentage < 50 ? 'Good' : 
               timeProgressPercentage < 80 ? 'Moderate' : 'Slow'}
            </div>
          </div>
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 shadow-sm">
            <div className="text-sm text-gray-600 font-medium mb-1">Pace</div>
            <div className={`text-base font-bold ${
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
