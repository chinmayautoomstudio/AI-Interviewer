import React from 'react';
import { FileText, File, Eye } from 'lucide-react';

interface ResumeThumbnailProps {
  candidate: {
    name: string;
    resume_url?: string;
    resume_text?: string;
  };
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const ResumeThumbnail: React.FC<ResumeThumbnailProps> = ({
  candidate,
  onClick,
  size = 'md'
}) => {
  const getFileType = (url?: string) => {
    if (!url) return 'text';
    if (url.includes('drive.google.com')) return 'gdrive';
    if (url.includes('.pdf')) return 'pdf';
    if (url.includes('.doc') || url.includes('.docx')) return 'word';
    if (url.includes('.txt')) return 'text';
    return 'document';
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-600" />;
      case 'word':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'gdrive':
        return <FileText className="h-4 w-4 text-green-600" />;
      default:
        return <File className="h-4 w-4 text-gray-600" />;
    }
  };

  const getResumePreviewUrl = (url?: string) => {
    if (!url) return null;
    
    if (url.includes('drive.google.com')) {
      // Convert Google Drive URL to clean thumbnail image
      const patterns = [
        /\/file\/d\/([a-zA-Z0-9-_]+)/,
        /id=([a-zA-Z0-9-_]+)/,
        /\/d\/([a-zA-Z0-9-_]+)/
      ];
      
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          const fileId = match[1];
          // Use Google Drive direct image URL for clean thumbnail
          return `https://drive.google.com/uc?export=view&id=${fileId}`;
        }
      }
    }
    
    return null;
  };


  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-32 h-44';
      case 'lg':
        return 'w-48 h-64';
      default:
        return 'w-40 h-56';
    }
  };

  const fileType = getFileType(candidate.resume_url);
  const previewUrl = getResumePreviewUrl(candidate.resume_url);

  return (
    <button
      onClick={onClick}
      className={`
        ${getSizeClasses()}
        group relative border-2 border-gray-200 rounded-lg 
        hover:border-ai-teal hover:shadow-md transition-all duration-200
        bg-white overflow-hidden
        cursor-pointer
      `}
      title={`View ${candidate.name}'s Resume`}
    >
      {/* Resume Preview Image or Fallback Icon */}
      {previewUrl ? (
        <div className="w-full h-full relative">
          <img 
            src={previewUrl} 
            alt={`${candidate.name} Resume Preview`}
            className="w-full h-full object-cover rounded-lg"
            onError={(e) => {
              // If image fails, show icon fallback
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `
                  <div class="flex flex-col items-center justify-center h-full p-2">
                    <div class="mb-2">
                      <svg class="h-8 w-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                    </div>
                    <div class="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      ${fileType}
                    </div>
                  </div>
                `;
              }
            }}
          />
          {/* Clean overlay with file type */}
          <div className="absolute bottom-2 left-2 right-2">
            <div className="bg-black/80 text-white text-xs font-medium text-center py-1 px-2 rounded">
              {fileType.toUpperCase()}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full p-2">
          {/* File Icon */}
          <div className="mb-2">
            {getFileIcon(fileType)}
          </div>
          
          {/* File Type Label */}
          <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            {fileType}
          </div>
        </div>
      )}
      
      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-ai-teal/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
        <div className="text-ai-teal">
          <Eye className="h-6 w-6" />
        </div>
      </div>
      
      {/* Status Indicator */}
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
    </button>
  );
};

export default ResumeThumbnail;
