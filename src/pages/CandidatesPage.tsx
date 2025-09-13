import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Users, Plus, Filter, Search, Mail, Phone, Upload, FileText, UserPlus, X, CheckCircle, AlertCircle, Eye, RefreshCw, Trash2 } from 'lucide-react';
import { N8nService } from '../services/n8n';
import { getCandidates, deleteCandidate } from '../services/candidates';
import { getJobDescriptions } from '../services/jobDescriptions';
import { createJobApplication } from '../services/candidateJobApplications';
import { AddCandidateRequest, ResumeUploadResponse, Candidate, JobDescription } from '../types';

const CandidatesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assignToJobId = searchParams.get('assignToJob');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addMethod, setAddMethod] = useState<'upload' | 'manual' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Candidates data state
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(true);
  const [candidatesError, setCandidatesError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Job descriptions state
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [jobDescriptionsLoading, setJobDescriptionsLoading] = useState(false);
  
  // Delete confirmation state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
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
  const [selectedJobDescriptionId, setSelectedJobDescriptionId] = useState<string>(assignToJobId || '');

  // Fetch candidates data on component mount
  useEffect(() => {
    loadCandidates();
    loadJobDescriptions();
  }, []);

  const loadCandidates = async () => {
    try {
      setCandidatesLoading(true);
      setCandidatesError(null);
      const candidatesData = await getCandidates();
      setCandidates(candidatesData);
    } catch (err) {
      console.error('Error loading candidates:', err);
      setCandidatesError(err instanceof Error ? err.message : 'Failed to load candidates');
    } finally {
      setCandidatesLoading(false);
    }
  };

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

  // Filter candidates based on search query
  const filteredCandidates = candidates.filter(candidate => {
    if (!searchQuery || !candidate) return true;
    const query = searchQuery.toLowerCase();
    return (
      (candidate.name && candidate.name.toLowerCase().includes(query)) ||
      (candidate.email && candidate.email.toLowerCase().includes(query)) ||
      (candidate.phone && candidate.phone.toLowerCase().includes(query)) ||
      (candidate.contact_number && candidate.contact_number.toLowerCase().includes(query))
    );
  });

  const handleAddCandidate = () => {
    setIsAddModalOpen(true);
    setAddMethod(null);
    setError(null);
    setSuccess(null);
  };

  const handleMethodSelect = (method: 'upload' | 'manual') => {
    setAddMethod(method);
    setError(null);
    setSuccess(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a PDF or Word document');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      
      setResumeFile(file);
      setError(null);
    }
  };

  const handleSkillsChange = (value: string) => {
    setSkillsInput(value);
    const skills = value.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);
    setFormData(prev => ({ ...prev, skills }));
  };

  const handleInputChange = (field: keyof AddCandidateRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (addMethod === 'upload') {
      if (!resumeFile) {
        setError('Please upload a resume file');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const result: ResumeUploadResponse = await N8nService.processResumeUpload(resumeFile);
        
        if (result.success && result.candidateId) {
          // Create job application if a job is selected
          if (selectedJobDescriptionId) {
            try {
              await createJobApplication(result.candidateId, selectedJobDescriptionId, 'Applied via resume upload');
            } catch (appError) {
              console.error('Error creating job application:', appError);
              // Don't fail the entire process if job application creation fails
            }
          }
          
          setSuccess('Candidate added successfully! Resume processed and data extracted automatically.');
          // Reset form
          setFormData({ name: '', email: '', phone: '', skills: [], experience: '', education: '', primaryJobDescriptionId: '' });
          setResumeFile(null);
          setSkillsInput('');
          setSelectedJobDescriptionId('');
          // Refresh candidates list
          loadCandidates();
          setTimeout(() => {
            setIsAddModalOpen(false);
            setSuccess(null);
          }, 2000);
        } else {
          setError(result.error || 'Failed to process resume');
        }
      } catch (error) {
        setError('Failed to upload resume. Please try again.');
      } finally {
        setLoading(false);
      }
    } else if (addMethod === 'manual') {
      if (!formData.name || !formData.email) {
        setError('Please provide at least name and email');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const result = await N8nService.addCandidateManually(formData);
        
        if (result.success && result.candidateId) {
          // Create job application if a job is selected
          if (selectedJobDescriptionId) {
            try {
              await createJobApplication(result.candidateId, selectedJobDescriptionId, 'Applied via manual entry');
            } catch (appError) {
              console.error('Error creating job application:', appError);
              // Don't fail the entire process if job application creation fails
            }
          }
          
          setSuccess('Candidate added successfully!');
          // Reset form
          setFormData({ name: '', email: '', phone: '', skills: [], experience: '', education: '', primaryJobDescriptionId: '' });
          setSkillsInput('');
          setSelectedJobDescriptionId('');
          // Refresh candidates list
          loadCandidates();
          setTimeout(() => {
            setIsAddModalOpen(false);
            setSuccess(null);
          }, 2000);
        } else {
          setError(result.error || 'Failed to add candidate');
        }
      } catch (error) {
        setError('Failed to add candidate. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setAddMethod(null);
    setError(null);
    setSuccess(null);
    setFormData({ name: '', email: '', phone: '', skills: [], experience: '', education: '', primaryJobDescriptionId: '' });
    setResumeFile(null);
    setSkillsInput('');
    setSelectedJobDescriptionId('');
  };

  const handleDeleteClick = (candidate: Candidate) => {
    setCandidateToDelete(candidate);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!candidateToDelete?.id) return;

    try {
      setIsDeleting(true);
      await deleteCandidate(candidateToDelete.id);
      setShowDeleteDialog(false);
      setCandidateToDelete(null);
      await loadCandidates(); // Refresh the list
    } catch (err) {
      console.error('Error deleting candidate:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete candidate');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
          <p className="text-gray-600">Manage candidate profiles and information</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={loadCandidates} disabled={candidatesLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${candidatesLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="primary" onClick={handleAddCandidate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Candidate
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </Card>

      {/* Candidates List */}
      {candidatesLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : candidatesError ? (
        <Card>
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">
              <AlertCircle className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Candidates</h3>
            <p className="text-gray-600 mb-4">{candidatesError}</p>
            <Button variant="primary" onClick={loadCandidates}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </Card>
      ) : filteredCandidates.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <Users className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No candidates found' : 'No candidates yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery 
                ? 'Try adjusting your search criteria' 
                : 'Get started by adding your first candidate'
              }
            </p>
            {!searchQuery && (
              <Button variant="primary" onClick={handleAddCandidate}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Candidate
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCandidates.map((candidate) => (
            <Card key={candidate.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{candidate.name || 'Unknown Name'}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Mail className="h-3 w-3" />
                        <span>{candidate.email || 'No email'}</span>
                      </div>
                      {(candidate.phone || candidate.contact_number) && (
                        <div className="flex items-center space-x-1">
                          <Phone className="h-3 w-3" />
                          <span>{candidate.phone || candidate.contact_number}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    candidate.status === 'active' ? 'bg-green-100 text-green-800' :
                    candidate.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                    candidate.status === 'archived' ? 'bg-red-100 text-red-800' :
                    candidate.status === 'completed' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {(candidate.status || 'unknown').replace('_', ' ').toUpperCase()}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => (candidate.candidate_id || candidate.id) && navigate(`/candidates/${candidate.candidate_id || candidate.id}`)}
                    disabled={!candidate.candidate_id && !candidate.id}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Profile
                  </Button>
                  <Button variant="ghost" size="sm">
                    Schedule Interview
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteClick(candidate)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Candidate Modal */}
      <Modal isOpen={isAddModalOpen} onClose={closeModal} title="Add New Candidate" size="lg">
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
                  {assignToJobId && (
                    <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Pre-selected:</strong> This candidate will be assigned to the job you selected from the job descriptions page.
                      </p>
                    </div>
                  )}
                  <select
                    value={selectedJobDescriptionId}
                    onChange={(e) => setSelectedJobDescriptionId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a job description...</option>
                    {jobDescriptions.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.title} - {job.companyName || job.department}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500">
                    This will automatically create an application for the selected job when the candidate is added.
                  </p>
                </div>

                {/* Information Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-blue-800">Automatic Data Extraction</h3>
                      <p className="text-sm text-blue-700 mt-1">
                        The system will automatically extract candidate information including name, email, phone number, 
                        skills, experience, and education from the uploaded resume using AI processing.
                      </p>
                    </div>
                  </div>
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
                  label="Full Name *"
                  value={formData.name}
                  onChange={(value) => handleInputChange('name', value)}
                  placeholder="Enter candidate's full name"
                />
                <Input
                  label="Email Address *"
                  type="email"
                  value={formData.email}
                  onChange={(value) => handleInputChange('email', value)}
                  placeholder="Enter email address"
                />
                <Input
                  label="Phone Number"
                  value={formData.phone || ''}
                  onChange={(value) => handleInputChange('phone', value)}
                  placeholder="Enter phone number"
                />
                <Input
                  label="Skills"
                  value={skillsInput}
                  onChange={(value) => handleSkillsChange(value)}
                  placeholder="Enter skills separated by commas"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
                  <textarea
                    value={formData.experience || ''}
                    onChange={(e) => handleInputChange('experience', e.target.value)}
                    placeholder="Describe candidate's work experience"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Education</label>
                  <textarea
                    value={formData.education || ''}
                    onChange={(e) => handleInputChange('education', e.target.value)}
                    placeholder="Describe candidate's education background"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>
                
                {/* Job Description Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assign to Job Description (Optional)</label>
                  <select
                    value={selectedJobDescriptionId}
                    onChange={(e) => setSelectedJobDescriptionId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a job description...</option>
                    {jobDescriptions.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.title} - {job.companyName || job.department}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    This will automatically create an application for the selected job when the candidate is added.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error/Success Messages */}
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setCandidateToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Candidate"
        message={`Are you sure you want to delete ${candidateToDelete?.name || 'this candidate'}? This action cannot be undone and will permanently remove all candidate data including resume, interview history, and notes.`}
        confirmText="Delete Candidate"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default CandidatesPage;
