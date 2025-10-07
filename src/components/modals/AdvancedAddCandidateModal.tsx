import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Upload, UserPlus, X, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { N8nService } from '../../services/n8n';
import { getJobDescriptions } from '../../services/jobDescriptions';
import { AddCandidateRequest, ResumeUploadResponse, JobDescription } from '../../types';

interface AdvancedAddCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AdvancedAddCandidateModal: React.FC<AdvancedAddCandidateModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [addMethod, setAddMethod] = useState<'upload' | 'manual' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Job descriptions state
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [jobDescriptionsLoading, setJobDescriptionsLoading] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState<AddCandidateRequest>({
    name: '',
    email: '',
    phone: '',
    skills: [],
    experience: '',
    education: '',
    primaryJobDescriptionId: '',
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [skillsInput, setSkillsInput] = useState('');
  const [selectedJobDescriptionId, setSelectedJobDescriptionId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadJobDescriptions();
    }
  }, [isOpen]);

  const loadJobDescriptions = async () => {
    try {
      setJobDescriptionsLoading(true);
      const jobDescriptionsData = await getJobDescriptions();
      setJobDescriptions(jobDescriptionsData);
    } catch (err) {
      console.error('Error loading job descriptions:', err);
    } finally {
      setJobDescriptionsLoading(false);
    }
  };

  const handleMethodSelect = (method: 'upload' | 'manual') => {
    setAddMethod(method);
    setError(null);
    setSuccess(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setResumeFile(file);
      setError(null);
    }
  };

  const handleInputChange = (field: keyof AddCandidateRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSkillsChange = (value: string) => {
    setSkillsInput(value);
    const skillsArray = value.split(',').map(skill => skill.trim()).filter(skill => skill);
    setFormData(prev => ({ ...prev, skills: skillsArray }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (addMethod === 'upload') {
        if (!resumeFile) {
          setError('Please select a resume file');
          return;
        }

        // Upload resume and extract data
        const uploadResponse: ResumeUploadResponse = await N8nService.processResumeUpload(resumeFile);
        
        if (!uploadResponse.success) {
          setError(uploadResponse.error || 'Failed to process resume');
          return;
        }

        // Here you would call the actual candidate creation service with extracted data
        // For now, we'll simulate success
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setSuccess('Candidate added successfully from resume!');
        
        // If job description is selected, create application
        if (selectedJobDescriptionId) {
          // Here you would call createJobApplication
          console.log('Creating job application for:', selectedJobDescriptionId);
        }

      } else {
        // Manual entry validation
        if (!formData.name || !formData.email) {
          setError('Name and email are required');
          return;
        }

        // Here you would call the actual candidate creation service
        // For now, we'll simulate success
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setSuccess('Candidate added successfully!');
      }

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        skills: [],
        experience: '',
        education: '',
        primaryJobDescriptionId: '',
      });
      setResumeFile(null);
      setSkillsInput('');
      setSelectedJobDescriptionId('');
      setAddMethod(null);

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

      // Close modal after delay
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 1500);

    } catch (err) {
      console.error('Error adding candidate:', err);
      setError(err instanceof Error ? err.message : 'Failed to add candidate');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setAddMethod(null);
    setError(null);
    setSuccess(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      skills: [],
      experience: '',
      education: '',
      primaryJobDescriptionId: '',
    });
    setResumeFile(null);
    setSkillsInput('');
    setSelectedJobDescriptionId('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={closeModal} title="Add New Candidate" size="lg">
      <div className="space-y-6">
        {/* Method Selection */}
        {!addMethod && (
          <div className="space-y-4">
            <p className="text-gray-600">Choose how you'd like to add the candidate:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => handleMethodSelect('upload')}
                className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <Upload className="h-8 w-8 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Upload Resume</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Upload a resume file and we'll automatically extract candidate information using AI.
                </p>
              </button>
              
              <button
                onClick={() => handleMethodSelect('manual')}
                className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <UserPlus className="h-8 w-8 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Manual Entry</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Manually enter candidate information in the form fields.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Upload Resume Form */}
        {addMethod === 'upload' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <button
                onClick={() => setAddMethod(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
              <h3 className="font-semibold text-gray-900">Upload Resume</h3>
            </div>

            {/* File Upload */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Resume File *</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    {resumeFile ? (
                      <div className="space-y-2">
                        <FileText className="h-8 w-8 text-green-600 mx-auto" />
                        <p className="text-sm text-green-600 font-medium">{resumeFile.name}</p>
                        <p className="text-xs text-gray-500">Click to change file</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                        <p className="text-sm text-gray-600">Click to upload resume</p>
                        <p className="text-xs text-gray-500">PDF, DOC, DOCX (max 5MB)</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Job Description Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Assign to Job Description (Optional)</label>
                <select
                  value={selectedJobDescriptionId}
                  onChange={(e) => setSelectedJobDescriptionId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ai-teal focus:border-transparent"
                  disabled={jobDescriptionsLoading}
                >
                  <option value="">Select a job description</option>
                  {jobDescriptions.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title}
                    </option>
                  ))}
                </select>
                {jobDescriptionsLoading && (
                  <p className="text-sm text-gray-500">Loading job descriptions...</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Manual Entry Form */}
        {addMethod === 'manual' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <button
                onClick={() => setAddMethod(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
              <h3 className="font-semibold text-gray-900">Manual Entry</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={formData.name}
                onChange={(value) => handleInputChange('name', value)}
                required
                placeholder="e.g., John Smith"
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(value) => handleInputChange('email', value)}
                required
                placeholder="e.g., john@example.com"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Phone Number"
                value={formData.phone || ''}
                onChange={(value) => handleInputChange('phone', value)}
                placeholder="e.g., +1 (555) 123-4567"
              />
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Skills</label>
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => handleSkillsChange(e.target.value)}
                  placeholder="e.g., React, Node.js, Python (comma-separated)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ai-teal focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
              <textarea
                value={formData.experience}
                onChange={(e) => handleInputChange('experience', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ai-teal focus:border-transparent"
                placeholder="Describe the candidate's work experience and background..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
              <textarea
                value={formData.education}
                onChange={(e) => handleInputChange('education', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ai-teal focus:border-transparent"
                placeholder="List educational background, degrees, certifications..."
              />
            </div>

            {/* Job Description Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Assign to Job Description (Optional)</label>
              <select
                value={selectedJobDescriptionId}
                onChange={(e) => setSelectedJobDescriptionId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ai-teal focus:border-transparent"
                disabled={jobDescriptionsLoading}
              >
                <option value="">Select a job description</option>
                {jobDescriptions.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
              {jobDescriptionsLoading && (
                <p className="text-sm text-gray-500">Loading job descriptions...</p>
              )}
            </div>
          </div>
        )}

        {/* Success/Error Messages */}
        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {/* Action Buttons */}
        {addMethod && (
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={closeModal} disabled={loading}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSubmit} 
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Add Candidate'}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AdvancedAddCandidateModal;
