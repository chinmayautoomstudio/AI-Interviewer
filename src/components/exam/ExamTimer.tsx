// Exam Timer Component
// Displays countdown timer with warnings and auto-submit functionality

import React, { useState, useEffect, useCallback } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { ExamTimerProps } from '../../types';

export const ExamTimer: React.FC<ExamTimerProps> = ({
  duration_minutes,
  onTimeUp,
  onWarning,
  isActive
}) => {
  const [timeRemaining, setTimeRemaining] = useState(duration_minutes * 60); // Convert to seconds
  const [isWarning, setIsWarning] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Get timer color based on remaining time
  const getTimerColor = (): string => {
    if (isCritical) return 'text-red-600';
    if (isWarning) return 'text-yellow-600';
    return 'text-blue-600';
  };

  // Get timer background color
  const getTimerBgColor = (): string => {
    if (isCritical) return 'bg-red-50 border-red-200';
    if (isWarning) return 'bg-yellow-50 border-yellow-200';
    return 'bg-blue-50 border-blue-200';
  };

  // Update timer
  const updateTimer = useCallback(() => {
    if (!isActive || timeRemaining <= 0) return;

    setTimeRemaining(prev => {
      const newTime = prev - 1;
      
      // Check for warnings
      if (newTime === 300) { // 5 minutes remaining
        setIsWarning(true);
        onWarning?.(300);
      } else if (newTime === 60) { // 1 minute remaining
        setIsCritical(true);
        onWarning?.(60);
      }

      // Time's up
      if (newTime <= 0) {
        onTimeUp();
        return 0;
      }

      return newTime;
    });
  }, [isActive, timeRemaining, onTimeUp, onWarning]);

  // Timer effect
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isActive, updateTimer]);

  // Reset timer when duration changes
  useEffect(() => {
    setTimeRemaining(duration_minutes * 60);
    setIsWarning(false);
    setIsCritical(false);
  }, [duration_minutes]);

  // Calculate progress percentage
  const progressPercentage = ((duration_minutes * 60 - timeRemaining) / (duration_minutes * 60)) * 100;

  return (
    <div className={`flex items-center space-x-2 sm:space-x-4 p-3 sm:p-6 rounded-lg sm:rounded-xl border-2 ${getTimerBgColor()} shadow-sm`}>
      <Clock className={`w-5 h-5 sm:w-8 sm:h-8 ${getTimerColor()}`} />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1 sm:mb-3">
          <span className={`text-lg sm:text-2xl font-bold ${getTimerColor()} font-mono`}>
            {formatTime(timeRemaining)}
          </span>
          <span className="text-xs sm:text-sm text-gray-600 font-medium hidden sm:inline">
            {isActive ? 'Time Remaining' : 'Timer Paused'}
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-3 shadow-inner">
          <div
            className={`h-1.5 sm:h-3 rounded-full transition-all duration-1000 shadow-sm ${
              isCritical ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Warning indicators */}
      {isWarning && (
        <div className="flex items-center space-x-1 sm:space-x-2 text-yellow-600 bg-yellow-50 px-2 sm:px-4 py-1 sm:py-2 rounded-lg border border-yellow-200">
          <AlertTriangle className="w-3 h-3 sm:w-6 sm:h-6" />
          <span className="text-xs sm:text-sm font-semibold">
            {timeRemaining <= 60 ? '1 min!' : '5 min!'}
          </span>
        </div>
      )}
    </div>
  );
};

export default ExamTimer;
