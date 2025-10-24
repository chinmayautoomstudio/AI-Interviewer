// Exam Completion Page
// Shows thank you message after exam completion with no back option

import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, Award, Users, BookOpen } from 'lucide-react';

interface ExamCompletionPageProps {
  examSessionId?: string;
}

const ExamCompletionPage: React.FC<ExamCompletionPageProps> = ({ examSessionId }) => {
  const [countdown, setCountdown] = useState(30);

  // Countdown timer and auto-redirect
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Auto-close the page
          window.close();
          // If that doesn't work, redirect to blank page
          setTimeout(() => {
            window.location.href = 'about:blank';
          }, 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Prevent back navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      // Push the current state back to prevent navigation
      window.history.pushState(null, '', window.location.href);
    };

    // Disable back button
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);

    // Disable keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable F5, Ctrl+R, Ctrl+F5, Backspace, Alt+Left Arrow
      if (
        e.key === 'F5' ||
        (e.ctrlKey && e.key === 'r') ||
        (e.ctrlKey && e.key === 'R') ||
        (e.ctrlKey && e.shiftKey && e.key === 'R') ||
        e.key === 'Backspace' ||
        (e.altKey && e.key === 'ArrowLeft')
      ) {
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Main Completion Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center border border-gray-100">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                <Award className="w-5 h-5 text-yellow-800" />
              </div>
            </div>
          </div>

          {/* Thank You Message */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Thank You!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your exam has been successfully submitted
          </p>

          {/* Completion Details */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-sm text-gray-600">Exam Completed</div>
                <div className="font-semibold text-gray-900">Successfully</div>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-sm text-gray-600">Time Taken</div>
                <div className="font-semibold text-gray-900">Completed</div>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-sm text-gray-600">Status</div>
                <div className="font-semibold text-gray-900">Submitted</div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              What happens next?
            </h3>
            <div className="text-left space-y-2 text-blue-800">
              <p>• Your exam responses have been automatically saved</p>
              <p>• Our team will review your answers and evaluate your performance</p>
              <p>• You will receive an email with your results within 24-48 hours</p>
              <p>• Please check your email for further instructions</p>
            </div>
          </div>

          {/* Close Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-center justify-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-yellow-900">
                Please Close This Page
              </h3>
            </div>
            <p className="text-yellow-800 mb-4">
              For security reasons, please close this browser tab or window now.
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => {
                  // Try to close the tab/window
                  window.close();
                  // If that doesn't work, redirect to a blank page
                  setTimeout(() => {
                    window.location.href = 'about:blank';
                  }, 1000);
                }}
                className="px-8 py-3 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-colors font-semibold shadow-lg hover:shadow-xl"
              >
                Close Page
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Thank you for taking the time to complete this assessment.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              This page will automatically redirect after 30 seconds for security.
            </p>
          </div>
        </div>
      </div>

      {/* Auto-redirect timer */}
      <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm">
        Auto-close in: <span>{countdown}</span>s
      </div>
    </div>
  );
};

export default ExamCompletionPage;
