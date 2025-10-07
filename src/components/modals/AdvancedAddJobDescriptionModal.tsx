import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import { FileText, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import JDParserService from '../../services/jdParser';

interface AdvancedAddJobDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AdvancedAddJobDescriptionModal: React.FC<AdvancedAddJobDescriptionModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    location: '',
    employmentType: 'full-time',
    salaryRange: '',
    department: '',
    experienceLevel: 'mid-level',
    workMode: 'on-site',
    companyName: '',
    contactEmail: ''
  });

  // Auto-parsing fields
  const [rawJobDescription, setRawJobDescription] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const parseJobDescription = async () => {
    if (!rawJobDescription.trim()) {
      setError('Please paste a job description to parse');
      return;
    }

    try {
      setIsParsing(true);
      setError(null);
      
      const result = await JDParserService.parseJobDescription(rawJobDescription);
      
      if (result.success && result.data) {
        const data = result.data;
        
        // Auto-fill form with parsed data
        setFormData(prev => ({
          ...prev,
          title: data.job_title || prev.title,
          description: data.job_summary || prev.description,
          requirements: data.required_skills ? data.required_skills.join(', ') : prev.requirements,
          location: data.location || prev.location,
          employmentType: data.employment_type || prev.employmentType,
          salaryRange: data.salary_range || prev.salaryRange,
          department: data.department || prev.department,
          experienceLevel: data.experience_level || prev.experienceLevel,
          workMode: data.work_mode || prev.workMode,
        }));
        
        setSuccess('Job description parsed successfully! Form has been auto-filled.');
        setRawJobDescription(''); // Clear the input
      } else {
        setError(result.error || 'Failed to parse job description');
      }
    } catch (err) {
      console.error('Error parsing job description:', err);
      setError('Failed to parse job description. Please try again.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Validate required fields
      if (!formData.title || !formData.description) {
        setError('Job title and description are required');
        return;
      }

      // Here you would call the actual job description creation service
      // For now, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Job description created successfully!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        requirements: '',
        location: '',
        employmentType: 'full-time',
        salaryRange: '',
        department: '',
        experienceLevel: 'mid-level',
        workMode: 'on-site',
        companyName: '',
        contactEmail: ''
      });
      setRawJobDescription('');

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
      console.error('Error creating job description:', err);
      setError(err instanceof Error ? err.message : 'Failed to create job description');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setError(null);
    setSuccess(null);
    setFormData({
      title: '',
      description: '',
      requirements: '',
      location: '',
      employmentType: 'full-time',
      salaryRange: '',
      department: '',
      experienceLevel: 'mid-level',
      workMode: 'on-site',
      companyName: '',
      contactEmail: ''
    });
    setRawJobDescription('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={closeModal} title="Add New Job Description" size="xl">
      <div className="space-y-6">
        {/* Quick Import Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Import</h3>
              <p className="text-gray-600 mb-4">Paste an existing job description and we'll automatically fill in the details for you.</p>
              <div className="space-y-3">
                <textarea
                  value={rawJobDescription}
                  onChange={(e) => setRawJobDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ai-teal focus:border-transparent"
                  placeholder="Paste your job description here..."
                />
                <Button
                  variant="outline"
                  onClick={parseJobDescription}
                  disabled={isParsing || !rawJobDescription.trim()}
                  className="w-full"
                >
                  {isParsing ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Parsing...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Parse & Auto-Fill
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Job Title"
              value={formData.title}
              onChange={(value) => handleInputChange('title', value)}
              required
              placeholder="e.g., Senior Developer"
            />
            <Input
              label="Location"
              value={formData.location}
              onChange={(value) => handleInputChange('location', value)}
              placeholder="e.g., New York, NY"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employment Type
              </label>
              <select
                value={formData.employmentType}
                onChange={(e) => handleInputChange('employmentType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ai-teal focus:border-transparent"
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Experience Level
              </label>
              <select
                value={formData.experienceLevel}
                onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ai-teal focus:border-transparent"
              >
                <option value="entry-level">Entry Level</option>
                <option value="mid-level">Mid Level</option>
                <option value="senior-level">Senior Level</option>
                <option value="executive">Executive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Work Mode
              </label>
              <select
                value={formData.workMode}
                onChange={(e) => handleInputChange('workMode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ai-teal focus:border-transparent"
              >
                <option value="on-site">On-site</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Department"
              value={formData.department}
              onChange={(value) => handleInputChange('department', value)}
              placeholder="e.g., Engineering"
            />
            <Input
              label="Salary Range"
              value={formData.salaryRange}
              onChange={(value) => handleInputChange('salaryRange', value)}
              placeholder="e.g., $80,000 - $120,000"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Company Name"
              value={formData.companyName}
              onChange={(value) => handleInputChange('companyName', value)}
              placeholder="e.g., Tech Corp"
            />
            <Input
              label="Contact Email"
              type="email"
              value={formData.contactEmail}
              onChange={(value) => handleInputChange('contactEmail', value)}
              placeholder="e.g., hr@techcorp.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              required
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ai-teal focus:border-transparent"
              placeholder="Describe the role, responsibilities, and what the candidate will be doing..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Requirements
            </label>
            <textarea
              value={formData.requirements}
              onChange={(e) => handleInputChange('requirements', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ai-teal focus:border-transparent"
              placeholder="List the required skills, experience, and qualifications..."
            />
          </div>
        </div>

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
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={closeModal} disabled={loading}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit} 
            disabled={loading}
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Creating...
              </>
            ) : (
              'Create Job Description'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AdvancedAddJobDescriptionModal;
