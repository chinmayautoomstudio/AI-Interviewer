// Email Invitation Modal
// Modal for sending exam invitations via email

import React, { useState, useEffect } from 'react';
import { X, Mail, Send, Users, Clock, Calendar, Link, Copy, ExternalLink } from 'lucide-react';
import { ExamSession, Candidate, JobDescription } from '../../types';
import { emailService } from '../../services/emailService';

interface EmailInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  examSessions: ExamSession[];
  onSuccess: () => void;
}

interface InvitationPreview {
  exam_session_id: string;
  candidate_id: string;
  exam_token: string;
  candidate_name: string;
  candidate_email: string;
  job_title: string;
  exam_duration_minutes: number;
  expires_at: string;
}

const EmailInvitationModal: React.FC<EmailInvitationModalProps> = ({
  isOpen,
  onClose,
  examSessions,
  onSuccess
}) => {
  const [invitations, setInvitations] = useState<InvitationPreview[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [copiedLinks, setCopiedLinks] = useState<Set<string>>(new Set());

  // Generate invitations from exam sessions
  useEffect(() => {
    if (isOpen && examSessions.length > 0) {
      const generatedInvitations = examSessions.map(session => ({
        exam_session_id: session.id,
        candidate_id: session.candidate_id,
        exam_token: session.exam_token,
        candidate_name: session.candidate?.name || 'Candidate',
        candidate_email: session.candidate?.email || '',
        job_title: session.job_description?.title || 'Position',
        exam_duration_minutes: session.duration_minutes,
        expires_at: session.expires_at
      }));
      setInvitations(generatedInvitations);
    }
  }, [isOpen, examSessions]);

  const handleSendInvitations = async () => {
    try {
      setSending(true);
      setErrors([]);

      const result = await emailService.sendBulkInvitations({
        exam_sessions: invitations,
        custom_message: customMessage
      });

      setSentCount(result.sent);
      setFailedCount(result.failed);
      setErrors(result.errors);

      if (result.success) {
        onSuccess();
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Error sending invitations:', error);
      setErrors(['Failed to send invitations']);
    } finally {
      setSending(false);
    }
  };

  const copyExamLink = async (token: string) => {
    const examUrl = `${window.location.origin}/candidate/exam/${token}`;
    try {
      await navigator.clipboard.writeText(examUrl);
      setCopiedLinks(prev => {
        const newSet = new Set(prev);
        newSet.add(token);
        return newSet;
      });
      setTimeout(() => {
        setCopiedLinks(prev => {
          const newSet = new Set(prev);
          newSet.delete(token);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const openExamLink = (token: string) => {
    const examUrl = `${window.location.origin}/candidate/exam/${token}`;
    window.open(examUrl, '_blank');
  };

  const formatExpiryDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Send Exam Invitations</h2>
              <p className="text-sm text-gray-600">
                {invitations.length} invitation{invitations.length !== 1 ? 's' : ''} ready to send
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Custom Message */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Custom Message (Optional)</label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Add a personalized message for all candidates..."
            />
          </div>

          {/* Invitations Preview */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Invitation Preview</h3>
            
            <div className="grid gap-4">
              {invitations.map((invitation, index) => (
                <div key={invitation.exam_session_id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      {/* Candidate Info */}
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{invitation.candidate_name}</div>
                          <div className="text-sm text-gray-600">{invitation.candidate_email}</div>
                        </div>
                      </div>

                      {/* Exam Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-11">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{invitation.job_title}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{invitation.exam_duration_minutes} minutes</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>Expires: {formatExpiryDate(invitation.expires_at)}</span>
                        </div>
                      </div>

                      {/* Exam Link */}
                      <div className="ml-11">
                        <div className="flex items-center space-x-2">
                          <Link className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Exam Link:</span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <code className="flex-1 text-xs bg-white border border-gray-300 rounded px-2 py-1 text-gray-700">
                            {window.location.origin}/candidate/exam/{invitation.exam_token}
                          </code>
                          <button
                            onClick={() => copyExamLink(invitation.exam_token)}
                            className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
                            title="Copy link"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openExamLink(invitation.exam_token)}
                            className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
                            title="Open in new tab"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                        {copiedLinks.has(invitation.exam_token) && (
                          <div className="text-xs text-green-600 mt-1">Link copied!</div>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="text-right">
                      <div className="text-sm text-gray-500">#{index + 1}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Results */}
          {(sentCount > 0 || failedCount > 0) && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Sending Results</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-green-600">
                  ✓ {sentCount} invitation{sentCount !== 1 ? 's' : ''} sent successfully
                </div>
                {failedCount > 0 && (
                  <div className="text-red-600">
                    ✗ {failedCount} invitation{failedCount !== 1 ? 's' : ''} failed
                  </div>
                )}
              </div>
              {errors.length > 0 && (
                <div className="mt-3 space-y-1">
                  {errors.map((error, index) => (
                    <div key={index} className="text-xs text-red-600">• {error}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={sending}
            >
              {sentCount > 0 ? 'Close' : 'Cancel'}
            </button>
            <button
              onClick={handleSendInvitations}
              disabled={sending || invitations.length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send {invitations.length} Invitation{invitations.length !== 1 ? 's' : ''}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailInvitationModal;
