// Exam Instructions Component
// Displays exam rules, guidelines, and instructions

import React from 'react';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  BookOpen, 
  Shield, 
  Monitor,
  Wifi,
  FileText,
  Users
} from 'lucide-react';

interface ExamInstructionsProps {
  isOpen: boolean;
  onClose: () => void;
  onStartExam: () => void;
  examDetails: {
    title: string;
    duration: number;
    totalQuestions: number;
    questionTypes: string[];
    passingScore: number;
  };
}

export const ExamInstructions: React.FC<ExamInstructionsProps> = ({
  isOpen,
  onClose,
  onStartExam,
  examDetails
}) => {
  if (!isOpen) return null;

  const instructions = [
    {
      icon: <Clock className="w-5 h-5" />,
      title: "Time Management",
      items: [
        "You have 30 minutes to complete the exam",
        "Timer will be displayed at the top of the screen",
        "Auto-submit when time expires",
        "No time extensions will be provided"
      ]
    },
    {
      icon: <FileText className="w-5 h-5" />,
      title: "Question Types",
      items: [
        "Multiple Choice Questions (MCQs) - Select one correct answer",
        "Text Questions - Type detailed answers in the text area",
        "Questions are randomly selected from the question bank",
        "Each question has a specific time limit"
      ]
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      title: "Answering Guidelines",
      items: [
        "Read each question carefully before answering",
        "For MCQs, select the most appropriate option",
        "For text questions, provide clear and detailed answers",
        "You can navigate between questions using the question navigator",
        "Answers are auto-saved every 30 seconds"
      ]
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Exam Integrity",
      items: [
        "Do not switch tabs or minimize the browser window",
        "Do not use external resources or assistance",
        "Do not communicate with others during the exam",
        "Your session is monitored for security purposes"
      ]
    },
    {
      icon: <Monitor className="w-5 h-5" />,
      title: "Technical Requirements",
      items: [
        "Ensure stable internet connection",
        "Use a desktop or laptop computer (mobile not recommended)",
        "Close unnecessary applications and browser tabs",
        "Enable JavaScript and cookies in your browser"
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Exam Instructions</h2>
              <p className="text-gray-600 mt-1">Please read all instructions carefully before starting</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Exam Details */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Exam Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">Exam Title</span>
              </div>
              <p className="text-blue-800">{examDetails.title}</p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">Duration</span>
              </div>
              <p className="text-green-800">{examDetails.duration} minutes</p>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-900">Total Questions</span>
              </div>
              <p className="text-purple-800">{examDetails.totalQuestions} questions</p>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-yellow-900">Passing Score</span>
              </div>
              <p className="text-yellow-800">{examDetails.passingScore}%</p>
            </div>
            
            <div className="bg-indigo-50 rounded-lg p-4 md:col-span-2">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span className="font-medium text-indigo-900">Question Types</span>
              </div>
              <p className="text-indigo-800">{examDetails.questionTypes.join(', ')}</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Important Instructions</h3>
          <div className="space-y-6">
            {instructions.map((section, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="text-blue-600">
                    {section.icon}
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">{section.title}</h4>
                </div>
                <ul className="space-y-2">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Important Notice */}
        <div className="p-6 bg-yellow-50 border-t border-yellow-200">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-900 mb-2">Important Notice</h4>
              <p className="text-yellow-800 text-sm leading-relaxed">
                This exam is designed to assess your knowledge and skills. Please ensure you have a stable internet connection 
                and are in a quiet environment. Any attempt to cheat or use unauthorized resources will result in immediate 
                disqualification. Your exam session is monitored for security purposes.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Wifi className="w-4 h-4" />
              <span>Ensure stable internet connection</span>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onStartExam}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Start Exam
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamInstructions;
