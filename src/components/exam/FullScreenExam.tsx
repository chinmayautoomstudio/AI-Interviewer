import React, { useState, useEffect, useRef } from 'react';
import { examSecurityService, SecurityViolation } from '../../services/examSecurityService';

interface FullScreenExamProps {
  children: React.ReactNode;
  onViolation?: (violation: SecurityViolation) => void;
  onExamStart?: () => void;
  onExamEnd?: () => void;
  showWarning?: boolean;
  warningMessage?: string;
}

const FullScreenExam: React.FC<FullScreenExamProps> = ({
  children,
  onViolation,
  onExamStart,
  onExamEnd,
  showWarning = true,
  warningMessage = "This exam is monitored for security purposes. Please ensure you follow all exam rules."
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSecurityActive, setIsSecurityActive] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(true);
  const [violationCount, setViolationCount] = useState(0);
  const examContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if already in fullscreen
    setIsFullscreen(examSecurityService.isInFullscreen());

    // Listen for fullscreen changes
    const handleFullscreenChange = () => {
      setIsFullscreen(examSecurityService.isInFullscreen());
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const handleViolation = (violation: SecurityViolation) => {
    setViolationCount(prev => prev + 1);
    if (onViolation) {
      onViolation(violation);
    }
  };

  const startExam = async () => {
    try {
      // Enter fullscreen first
      const fullscreenSuccess = await examSecurityService.enterFullscreen();
      
      if (!fullscreenSuccess) {
        alert('Please allow fullscreen mode to start the exam. This is required for security purposes.');
        return;
      }

      // Start security monitoring
      examSecurityService.startMonitoring(handleViolation);
      setIsSecurityActive(true);
      setShowConsentModal(false);

      if (onExamStart) {
        onExamStart();
      }

      console.log('✅ Exam started with full security monitoring');
    } catch (error) {
      console.error('❌ Failed to start exam:', error);
      alert('Failed to start exam. Please try again.');
    }
  };

  const endExam = async () => {
    try {
      // Stop security monitoring
      examSecurityService.stopMonitoring();
      setIsSecurityActive(false);

      // Exit fullscreen
      await examSecurityService.exitFullscreen();

      if (onExamEnd) {
        onExamEnd();
      }

      console.log('✅ Exam ended successfully');
    } catch (error) {
      console.error('❌ Error ending exam:', error);
    }
  };

  const handleConsentAccept = () => {
    startExam();
  };

  const handleConsentDecline = () => {
    alert('You must accept the exam terms to proceed. The exam cannot be started without fullscreen mode and security monitoring.');
  };

  // Show consent modal if exam hasn't started
  if (showConsentModal && showWarning) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-2xl mx-4 shadow-2xl">
          <div className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Exam Security Notice</h2>
              <p className="text-gray-700 mb-6">{warningMessage}</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-yellow-800 mb-2">Security Measures:</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Fullscreen mode will be activated</li>
                <li>• Functional keys (F1-F12, Ctrl+C, Alt+Tab, etc.) will be disabled</li>
                <li>• Right-click context menu will be disabled</li>
                <li>• Tab switching and window resizing will be prevented</li>
                <li>• Developer tools detection will be active</li>
                <li>• All security violations will be logged</li>
              </ul>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-red-800 mb-2">Important:</h3>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Do not attempt to switch tabs or minimize the window</li>
                <li>• Do not use keyboard shortcuts or functional keys</li>
                <li>• Do not open developer tools or inspect elements</li>
                <li>• Violations may result in exam termination</li>
              </ul>
            </div>

            <div className="flex space-x-4 justify-center">
              <button
                onClick={handleConsentDecline}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Decline
              </button>
              <button
                onClick={handleConsentAccept}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Accept & Start Exam
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={examContainerRef}
      className={`exam-container ${isFullscreen ? 'fullscreen' : ''}`}
      style={{
        width: isFullscreen ? '100vw' : '100%',
        height: isFullscreen ? '100vh' : '100%',
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 9999 : 'auto',
        backgroundColor: isFullscreen ? '#ffffff' : 'transparent',
        overflow: isFullscreen ? 'hidden' : 'auto'
      }}
    >
      {/* Security Status Bar */}
      {isSecurityActive && (
        <div className="bg-red-600 text-white px-4 py-2 text-sm font-medium flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Security Monitoring Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Fullscreen Mode</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {violationCount > 0 && (
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>Violations: {violationCount}</span>
              </div>
            )}
            <button
              onClick={endExam}
              className="px-3 py-1 bg-red-700 hover:bg-red-800 rounded text-sm transition-colors"
            >
              End Exam
            </button>
          </div>
        </div>
      )}

      {/* Exam Content */}
      <div className={`exam-content ${isFullscreen ? 'p-6' : ''}`}>
        {children}
      </div>

      {/* Violation Warning */}
      {violationCount > 0 && (
        <div className="fixed top-16 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="font-medium">Security Violation Detected</span>
          </div>
          <p className="text-sm mt-1">
            {violationCount === 1 
              ? 'This is your first warning. Please follow exam rules.'
              : `You have ${violationCount} violations. Continued violations may result in exam termination.`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default FullScreenExam;
