import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Plus,
  Play,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Interview, Candidate, JobDescription, AIAgent } from '../../types';
import Button from '../ui/Button';

interface InterviewCalendarProps {
  interviews: Interview[];
  candidates: Candidate[];
  jobDescriptions: JobDescription[];
  aiAgents: AIAgent[];
  onInterviewClick: (interview: Interview) => void;
  onScheduleInterview: (date?: string) => void;
  onEditInterview: (interview: Interview) => void;
  onDeleteInterview: (interview: Interview) => void;
  onStatusChange: (interviewId: string, status: Interview['status']) => void;
}

type ViewMode = 'month' | 'week' | 'day';

const InterviewCalendar: React.FC<InterviewCalendarProps> = ({
  interviews,
  candidates,
  jobDescriptions,
  aiAgents,
  onInterviewClick,
  onScheduleInterview,
  onEditInterview,
  onDeleteInterview,
  onStatusChange
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  // Get month name and year
  const getMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Get week dates
  const getWeekDates = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    start.setDate(start.getDate() - day);
    
    const week = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(start);
      dayDate.setDate(start.getDate() + i);
      week.push(dayDate);
    }
    return week;
  };

  // Get interviews for a specific date
  const getInterviewsForDate = (date: Date) => {
    const dateStr = date.toDateString();
    return interviews.filter(interview => {
      const interviewDate = new Date(interview.scheduledAt);
      return interviewDate.toDateString() === dateStr;
    });
  };


  // Generate calendar days for month view
  const generateCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  // Navigate calendar
  const navigateCalendar = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (viewMode) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  };

  // Get status color
  const getStatusColor = (status: Interview['status']) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
      in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || colors.scheduled;
  };

  // Get status icon
  const getStatusIcon = (status: Interview['status']) => {
    const icons = {
      scheduled: Clock,
      in_progress: Play,
      completed: CheckCircle,
      cancelled: XCircle
    };
    return icons[status] || Clock;
  };

  // Format time
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get candidate name
  const getCandidateName = (candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId);
    return candidate?.name || 'Unknown Candidate';
  };

  // Get job title
  const getJobTitle = (jobId: string) => {
    const job = jobDescriptions.find(j => j.id === jobId);
    return job?.title || 'Unknown Position';
  };

  // Check if a date is in the past (before today)
  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0); // Reset time to start of day
    return compareDate < today;
  };

  // Render month view
  const renderMonthView = () => {
    const days = generateCalendarDays(currentDate);
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Calendar Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border-b border-gray-200 gap-3 sm:gap-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            {getMonthYear(currentDate)}
          </h2>
          <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateCalendar('prev')}
              className="flex-1 sm:flex-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
              className="flex-1 sm:flex-none text-xs sm:text-sm"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateCalendar('next')}
              className="flex-1 sm:flex-none"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Week Days Header */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {weekDays.map(day => (
            <div key={day} className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium text-gray-500 bg-gray-50">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.charAt(0)}</span>
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();
            const dayInterviews = getInterviewsForDate(day);
            
            return (
              <div
                key={index}
                className={`min-h-[80px] sm:min-h-[120px] border-r border-b border-gray-200 p-1 sm:p-2 relative group ${
                  isCurrentMonth 
                    ? isToday
                      ? 'bg-teal-50 border-teal-200' // Today - teal background with teal border
                      : isPastDate(day) 
                        ? 'bg-gray-100' // Past dates - light gray background
                        : 'bg-white'    // Current/future dates - white background
                    : 'bg-gray-50'    // Other month dates - very light gray
                }`}
                onMouseEnter={() => setHoveredDate(day)}
                onMouseLeave={() => setHoveredDate(null)}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className={`text-xs sm:text-sm font-medium relative ${
                    isCurrentMonth 
                      ? isToday
                        ? 'text-teal-700 font-bold' // Today - teal color and bold
                        : isPastDate(day) 
                          ? 'text-gray-500' // Past dates - muted gray
                          : 'text-gray-900' // Current/future dates - dark gray
                      : 'text-gray-400'   // Other month dates - light gray
                  }`}>
                    {day.getDate()}
                    {isToday && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-teal-500 rounded-full"></div>
                    )}
                  </div>
                  
                  {/* Hover + Button - Only show for current and future dates */}
                  {hoveredDate && hoveredDate.toDateString() === day.toDateString() && isCurrentMonth && !isPastDate(day) && (
                    <button
                      onClick={() => {
                        const selectedDate = day.toISOString().slice(0, 10); // YYYY-MM-DD format
                        onScheduleInterview(selectedDate);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-ai-teal hover:bg-ai-teal-dark text-white rounded-full p-1 shadow-sm"
                      title="Schedule interview on this date"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                </div>
                
                <div className="space-y-1">
                  {dayInterviews.slice(0, window.innerWidth < 640 ? 2 : 3).map(interview => {
                    const StatusIcon = getStatusIcon(interview.status);
                    return (
                      <div
                        key={interview.id}
                        className={`text-xs p-1 rounded border cursor-pointer hover:shadow-sm transition-shadow ${getStatusColor(interview.status)}`}
                        onClick={() => onInterviewClick(interview)}
                      >
                        <div className="flex items-center gap-1">
                          <StatusIcon className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate text-xs">{formatTime(interview.scheduledAt)}</span>
                        </div>
                        <div className="truncate font-medium text-xs">
                          {getCandidateName(interview.candidateId)}
                        </div>
                      </div>
                    );
                  })}
                  
                  {dayInterviews.length > (window.innerWidth < 640 ? 2 : 3) && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayInterviews.length - (window.innerWidth < 640 ? 2 : 3)} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render week view
  const renderWeekView = () => {
    const weekDays = getWeekDates(currentDate);
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Week Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border-b border-gray-200 gap-3 sm:gap-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            <span className="hidden sm:inline">
              {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="sm:hidden">
              {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDays[6].getDate()}
            </span>
          </h2>
          <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateCalendar('prev')}
              className="flex-1 sm:flex-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
              className="flex-1 sm:flex-none text-xs sm:text-sm"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateCalendar('next')}
              className="flex-1 sm:flex-none"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Week Days */}
        <div className="grid grid-cols-7 overflow-x-auto">
          {weekDays.map((day, index) => {
            const isToday = day.toDateString() === new Date().toDateString();
            const dayInterviews = getInterviewsForDate(day);
            
            return (
              <div key={index} className="border-r border-gray-200 last:border-r-0 min-w-[120px] sm:min-w-0">
                <div className={`p-2 sm:p-3 text-center border-b border-gray-200 relative group ${
                  isToday 
                    ? 'bg-teal-50 border-teal-200' // Today - teal background with teal border
                    : isPastDate(day) 
                      ? 'bg-gray-100' // Past dates - light gray background
                      : 'bg-gray-50'  // Current/future dates - very light gray
                }`}
                onMouseEnter={() => setHoveredDate(day)}
                onMouseLeave={() => setHoveredDate(null)}>
                  <div className={`text-xs sm:text-sm font-medium ${
                    isToday 
                      ? 'text-teal-700 font-bold' // Today - teal color and bold
                      : isPastDate(day) 
                        ? 'text-gray-500' // Past dates - muted gray
                        : 'text-gray-900' // Current/future dates - dark gray
                  }`}>
                    <span className="hidden sm:inline">{day.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                    <span className="sm:hidden">{day.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}</span>
                  </div>
                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                    <div className={`text-sm sm:text-lg font-semibold relative ${
                      isToday 
                        ? 'text-teal-700 font-bold' // Today - teal color and bold
                        : isPastDate(day) 
                          ? 'text-gray-500' // Past dates - muted gray
                          : 'text-gray-900' // Current/future dates - dark gray
                    }`}>
                      {day.getDate()}
                      {isToday && (
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-teal-500 rounded-full"></div>
                      )}
                    </div>
                    
                    {/* Hover + Button for Week View - Only show for current and future dates */}
                    {hoveredDate && hoveredDate.toDateString() === day.toDateString() && !isPastDate(day) && (
                      <button
                        onClick={() => {
                          const selectedDate = day.toISOString().slice(0, 10); // YYYY-MM-DD format
                          onScheduleInterview(selectedDate);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-ai-teal hover:bg-ai-teal-dark text-white rounded-full p-1 shadow-sm"
                        title="Schedule interview on this date"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="p-1 sm:p-2 min-h-[200px] sm:min-h-[400px] space-y-1 sm:space-y-2">
                  {dayInterviews.map(interview => {
                    const StatusIcon = getStatusIcon(interview.status);
                    return (
                      <div
                        key={interview.id}
                        className={`p-1 sm:p-2 rounded border cursor-pointer hover:shadow-sm transition-shadow ${getStatusColor(interview.status)}`}
                        onClick={() => onInterviewClick(interview)}
                      >
                        <div className="flex items-center gap-1 mb-1">
                          <StatusIcon className="w-3 h-3 flex-shrink-0" />
                          <span className="text-xs font-medium">{formatTime(interview.scheduledAt)}</span>
                        </div>
                        <div className="text-xs font-medium truncate">
                          {getCandidateName(interview.candidateId)}
                        </div>
                        <div className="text-xs text-gray-600 truncate hidden sm:block">
                          {getJobTitle(interview.jobDescriptionId)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render day view
  const renderDayView = () => {
    const dayInterviews = getInterviewsForDate(currentDate);
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Day Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border-b border-gray-200 gap-3 sm:gap-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            <span className="hidden sm:inline">
              {currentDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
            <span className="sm:hidden">
              {currentDate.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
            </span>
          </h2>
          <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateCalendar('prev')}
              className="flex-1 sm:flex-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
              className="flex-1 sm:flex-none text-xs sm:text-sm"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateCalendar('next')}
              className="flex-1 sm:flex-none"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            {!isPastDate(currentDate) && (
              <Button
                onClick={() => onScheduleInterview(currentDate.toISOString().slice(0, 10))}
                size="sm"
                className="flex-1 sm:flex-none"
              >
                <Plus className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Schedule</span>
              </Button>
            )}
          </div>
        </div>

        {/* Day Content */}
        <div className="p-3 sm:p-4">
          {dayInterviews.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <CalendarIcon className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No interviews scheduled</h3>
              <p className="text-sm sm:text-base text-gray-500 mb-4">This day is free for scheduling new interviews.</p>
              {!isPastDate(currentDate) && (
                <Button onClick={() => onScheduleInterview(currentDate.toISOString().slice(0, 10))} size="sm" className="sm:size-md">
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule Interview
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {dayInterviews
                .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                .map(interview => {
                  const StatusIcon = getStatusIcon(interview.status);
                  return (
                    <div
                      key={interview.id}
                      className={`p-3 sm:p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${getStatusColor(interview.status)}`}
                      onClick={() => onInterviewClick(interview)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <StatusIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm sm:text-base truncate">
                              {getCandidateName(interview.candidateId)}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600 truncate">
                              {getJobTitle(interview.jobDescriptionId)}
                            </div>
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <div className="font-medium text-sm sm:text-base">
                            {formatTime(interview.scheduledAt)}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600">
                            {interview.duration} min
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Calendar Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
            <button
              onClick={() => setViewMode('month')}
              className={`flex-1 sm:flex-none px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                viewMode === 'month' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`flex-1 sm:flex-none px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                viewMode === 'week' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`flex-1 sm:flex-none px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                viewMode === 'day' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Day
            </button>
          </div>
        </div>

      </div>

      {/* Calendar View */}
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'day' && renderDayView()}
    </div>
  );
};

export default InterviewCalendar;
