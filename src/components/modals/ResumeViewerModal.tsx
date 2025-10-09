import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import { FileText, Download, ExternalLink, AlertCircle } from 'lucide-react';

interface ResumeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: {
    name: string;
    resume_url?: string;
    resume_text?: string;
    resume_summary?: string;
  } | null;
}

const ResumeViewerModal: React.FC<ResumeViewerModalProps> = ({
  isOpen,
  onClose,
  candidate
}) => {
  const [loading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeContent, setResumeContent] = useState<string>('');
  const [resumeUrl, setResumeUrl] = useState<string>('');

  useEffect(() => {
    if (isOpen && candidate) {
      setResumeContent(candidate.resume_text || '');
      setResumeUrl(candidate.resume_url || '');
      setError(null);
    }
  }, [isOpen, candidate]);

  const handleDownload = () => {
    if (resumeUrl) {
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = resumeUrl;
      link.download = `${candidate?.name || 'resume'}_resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (resumeContent) {
      // Download as text file
      const blob = new Blob([resumeContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${candidate?.name || 'resume'}_resume.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  };

  const handleViewExternal = () => {
    if (resumeUrl) {
      window.open(resumeUrl, '_blank');
    }
  };

  const getFileType = (url: string) => {
    if (url.includes('drive.google.com')) return 'Google Drive';
    if (url.includes('.pdf')) return 'PDF';
    if (url.includes('.doc') || url.includes('.docx')) return 'Word Document';
    if (url.includes('.txt')) return 'Text File';
    return 'Document';
  };

  const convertGoogleDriveUrl = (url: string) => {
    if (!url.includes('drive.google.com')) return url;
    
    // Extract file ID from various Google Drive URL formats
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9-_]+)/,
      /id=([a-zA-Z0-9-_]+)/,
      /\/d\/([a-zA-Z0-9-_]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        const fileId = match[1];
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }
    
    return url; // Return original if no pattern matches
  };

  const isGoogleDriveFile = (url: string) => {
    return url.includes('drive.google.com');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Resume Viewer" size="xl">
      <div className="space-y-6">
        {candidate && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{candidate.name}</h3>
                <p className="text-sm text-gray-600">Resume Document</p>
              </div>
              <div className="flex items-center space-x-2">
                {resumeUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleViewExternal}
                    className="flex items-center space-x-1"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>View External</span>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="flex items-center space-x-1"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </Button>
              </div>
            </div>

            {/* Resume Content */}
            <div className="space-y-4">
              {resumeUrl ? (
                <div className="space-y-4">
                  {/* File Info */}
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <FileText className={`h-8 w-8 ${isGoogleDriveFile(resumeUrl) ? 'text-green-600' : 'text-blue-600'}`} />
                    <div>
                      <p className="font-medium text-gray-900">
                        {getFileType(resumeUrl)} Document
                      </p>
                      <p className="text-sm text-gray-600">
                        {candidate.name} - Resume
                      </p>
                    </div>
                  </div>

                  {/* PDF/Google Drive Viewer */}
                  {(resumeUrl.includes('.pdf') || isGoogleDriveFile(resumeUrl)) ? (
                    <div className="border rounded-lg overflow-hidden">
                      <iframe
                        src={isGoogleDriveFile(resumeUrl) ? convertGoogleDriveUrl(resumeUrl) : resumeUrl}
                        width="100%"
                        height="600"
                        className="border-0"
                        title={`${candidate.name} Resume`}
                        allow="autoplay"
                      />
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">
                        This file type cannot be previewed directly.
                      </p>
                      <Button
                        variant="primary"
                        onClick={handleViewExternal}
                        className="flex items-center space-x-2 mx-auto"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>Open in New Tab</span>
                      </Button>
                    </div>
                  )}
                </div>
              ) : resumeContent ? (
                <div className="space-y-4">
                  {/* Text Content */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-medium text-gray-900 mb-2">Resume Text Content</h4>
                    <div className="max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                        {resumeContent}
                      </pre>
                    </div>
                  </div>

                  {/* AI Summary */}
                  {candidate.resume_summary && (
                    <div className="border rounded-lg p-4 bg-blue-50">
                      <h4 className="font-medium text-blue-900 mb-2">AI-Generated Summary</h4>
                      <p className="text-sm text-blue-800">{candidate.resume_summary}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No resume content available for this candidate.</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
            <span className="ml-2 text-gray-600">Loading resume...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ResumeViewerModal;
