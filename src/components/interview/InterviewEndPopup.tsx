import React from 'react';
import { CheckCircle, XCircle, Clock, MessageSquare, ArrowLeft } from 'lucide-react';

interface InterviewEndPopupProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onBackToTest?: () => void;
  aiMessage: string;
  detectedPhrase?: string;
  confidence: number;
}

const InterviewEndPopup: React.FC<InterviewEndPopupProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  onBackToTest,
  aiMessage,
  detectedPhrase,
  confidence
}) => {
  if (!isOpen) return null;

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return 'text-green-600';
    if (conf >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceText = (conf: number) => {
    if (conf >= 0.8) return 'High';
    if (conf >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex-shrink-0">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Interview Complete
            </h3>
            <p className="text-sm text-gray-600">
              The AI has indicated the interview is ending
            </p>
          </div>
        </div>

        {/* AI Message */}
        <div className="mb-4">
          <div className="flex items-start space-x-2 mb-2">
            <MessageSquare className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-700">AI Message:</span>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-800">
            "{aiMessage}"
          </div>
        </div>

        {/* Detection Details */}
        {detectedPhrase && (
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-gray-700">Detected Phrase:</span>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 text-sm text-orange-800">
              "{detectedPhrase}"
            </div>
          </div>
        )}

        {/* Confidence Level */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Confidence Level:</span>
            <span className={`text-sm font-semibold ${getConfidenceColor(confidence)}`}>
              {getConfidenceText(confidence)} ({(confidence * 100).toFixed(0)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                confidence >= 0.8 ? 'bg-green-500' : 
                confidence >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${confidence * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Primary Actions */}
          <div className="flex space-x-3">
            <button
              onClick={onConfirm}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>End Interview</span>
            </button>
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <XCircle className="h-4 w-4" />
              <span>Continue</span>
            </button>
          </div>
          
          {/* Back to Test Interview Button */}
          {onBackToTest && (
            <button
              onClick={onBackToTest}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Test Interview</span>
            </button>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          You can always end the interview manually using the "End Interview" button
        </div>
      </div>
    </div>
  );
};

export default InterviewEndPopup;
