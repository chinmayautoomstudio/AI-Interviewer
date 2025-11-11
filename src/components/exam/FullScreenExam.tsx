import React, { useState, useEffect, useRef, useCallback } from 'react';
import { examSecurityService, SecurityViolation } from '../../services/examSecurityService';

interface FullScreenExamProps {
  children: React.ReactNode;
  onViolation?: (violation: SecurityViolation) => void;
  onExamStart?: () => void;
  onExamEnd?: () => void;
  showWarning?: boolean;
  warningMessage?: string;
  examDurationMinutes?: number; // Duration in minutes for auto-stop
}

const FullScreenExam: React.FC<FullScreenExamProps> = ({
  children,
  onViolation,
  onExamStart,
  onExamEnd,
  showWarning = true,
  warningMessage = "This exam is monitored for security purposes. Please ensure you follow all exam rules.",
  examDurationMinutes
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSecurityActive, setIsSecurityActive] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(true);
  const [violationCount, setViolationCount] = useState(0);
  const [showViolationPopup, setShowViolationPopup] = useState(false);
  const examContainerRef = useRef<HTMLDivElement>(null);

  // Cleanup effect - stop security monitoring when component unmounts
  useEffect(() => {
    return () => {
      if (examSecurityService.isSecurityActive()) {
        console.log('🧹 Component unmounting - stopping security monitoring');
        examSecurityService.stopMonitoring();
      }
    };
  }, []);

  useEffect(() => {
    // Check if already in fullscreen on mount
    setIsFullscreen(examSecurityService.isInFullscreen());

    // Listen for fullscreen changes - Firefox uses different event names
    const handleFullscreenChange = () => {
      const isFullscreenNow = examSecurityService.isInFullscreen();
      setIsFullscreen(isFullscreenNow);
      
      // If we exited fullscreen unexpectedly, show warning
      if (!isFullscreenNow && isSecurityActive) {
        console.warn('⚠️ Fullscreen exited unexpectedly');
      }
    };

    // Standard API (Chrome, Edge, Opera)
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    // Firefox-specific events
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    // Webkit API (Safari, older Chrome)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    // MS API (IE/Edge legacy)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [isSecurityActive]);

  const handleViolation = useCallback((violation: SecurityViolation) => {
    setViolationCount(prev => prev + 1);
    setShowViolationPopup(true);
    
    // Auto-dismiss violation popup after 5 seconds
    setTimeout(() => {
      setShowViolationPopup(false);
    }, 5000);
    
    if (onViolation) {
      onViolation(violation);
    }
  }, [onViolation]);

  const startExam = async () => {
    try {
      console.log('🚀 User clicked "Accept & Start Exam" - entering fullscreen...');
      
      // Enter fullscreen first
      const fullscreenSuccess = await examSecurityService.enterFullscreen();
      
      if (!fullscreenSuccess) {
        // Check if it's Firefox and provide specific instructions
        const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
        const errorMessage = isFirefox 
          ? 'Please allow fullscreen mode to start the exam. In Firefox, you may need to press F11 or click the fullscreen button. This is required for security purposes.'
          : 'Please allow fullscreen mode to start the exam. This is required for security purposes.';
        alert(errorMessage);
        console.error('❌ Fullscreen failed');
        // Keep the modal open so user can try again
        return;
      }

      // Wait a moment for fullscreen to fully activate
      await new Promise(resolve => setTimeout(resolve, 300));

      // Verify fullscreen is actually active
      const isActuallyFullscreen = examSecurityService.isInFullscreen();
      console.log('🔍 Fullscreen check:', { isActuallyFullscreen });
      
      if (!isActuallyFullscreen) {
        const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
        const errorMessage = isFirefox 
          ? 'Fullscreen mode was not activated. Please try again or use F11 to enter fullscreen manually, then refresh the page.'
          : 'Fullscreen mode was not activated. Please try again or use F11 to enter fullscreen manually.';
        alert(errorMessage);
        console.error('❌ Fullscreen verification failed');
        // Keep the modal open so user can try again
        return;
      }

      console.log('✅ Fullscreen activated, starting security monitoring...');

      // Start security monitoring with exam duration
      examSecurityService.startMonitoring(handleViolation, examDurationMinutes);
      setIsSecurityActive(true);
      setShowConsentModal(false); // Only hide modal after everything is confirmed active
      setIsFullscreen(true);

      console.log('✅ Security monitoring started:', {
        isActive: examSecurityService.isSecurityActive(),
        isFullscreen: examSecurityService.isInFullscreen()
      });

      if (onExamStart) {
        onExamStart();
      }

      console.log('✅ Exam started with full security monitoring - user consent confirmed');
    } catch (error) {
      console.error('❌ Failed to start exam:', error);
      alert(`Failed to start exam: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
      // Keep the modal open if there was an error
      setShowConsentModal(true);
    }
  };

  const endExam = async () => {
    try {
      // Stop security monitoring for exam completion
      examSecurityService.stopSecurityForExamCompletion();
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

  // NEVER auto-start the exam - it must only start when user clicks "Accept & Start Exam"
  // The consent modal must always be shown and cannot be bypassed

  if (showConsentModal && showWarning) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-lg w-full max-w-2xl mx-auto shadow-2xl p-6 sm:p-8 max-h-[85vh] overflow-y-auto">
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

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center sticky bottom-0 bg-white/80 pt-2">
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
    <>
      {/* Add CSS for animation */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
      
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
      {showViolationPopup && (
        <div className="fixed top-16 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
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
          <button
            onClick={() => setShowViolationPopup(false)}
            className="absolute top-1 right-1 text-yellow-600 hover:text-yellow-800"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      </div>
    </>
  );
};

export default FullScreenExam;
