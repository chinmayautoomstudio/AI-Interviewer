import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Users, 
  Calendar, 
  Building, 
  DollarSign,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Pause,
  X,
  UserPlus,
  UserMinus
} from 'lucide-react';
import { JobDescription, CandidateJobApplication } from '../types';
import { getJobDescriptions, deleteJobDescription } from '../services/jobDescriptions';
import { getApplicationsForJob, updateApplicationStatus, createJobApplication, deleteJobApplication } from '../services/candidateJobApplications';
import { getCandidates } from '../services/candidates';
import { Candidate } from '../types';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const JobViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobDescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Applications state
  const [applications, setApplications] = useState<CandidateJobApplication[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);
  
  // Candidate management state
  const [isAddCandidateModalOpen, setIsAddCandidateModalOpen] = useState(false);
  const [availableCandidates, setAvailableCandidates] = useState<Candidate[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [assigningCandidate, setAssigningCandidate] = useState<string | null>(null);
  const [removingApplication, setRemovingApplication] = useState<string | null>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [applicationToRemove, setApplicationToRemove] = useState<CandidateJobApplication | null>(null);

  useEffect(() => {
    if (id) {
      loadJob();
    }
  }, [id]);

  const loadJob = async () => {
    try {
      setLoading(true);
      const jobs = await getJobDescriptions();
      const foundJob = jobs.find(j => j.id === id);
      
      if (foundJob) {
        setJob(foundJob);
        // Load applications for this job
        loadApplications(foundJob.id);
      } else {
        setError('Job not found');
      }
    } catch (err) {
      setError('Failed to load job details');
      console.error('Error loading job:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async (jobId: string) => {
    try {
      setApplicationsLoading(true);
      setApplicationsError(null);
      const applicationsData = await getApplicationsForJob(jobId);
      setApplications(applicationsData);
    } catch (err) {
      console.error('Error loading applications:', err);
      setApplicationsError(err instanceof Error ? err.message : 'Failed to load applications');
    } finally {
      setApplicationsLoading(false);
    }
  };

  const formatIndianNumber = (num: number) => {
    return num.toLocaleString('en-IN');
  };

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'INR': return '₹';
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      default: return currency;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'paused': return 'bg-orange-100 text-orange-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'draft': return <Edit className="h-4 w-4" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      case 'closed': return <X className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getEmploymentTypeColor = (type: string) => {
    switch (type) {
      case 'full-time': return 'bg-blue-100 text-blue-800';
      case 'part-time': return 'bg-purple-100 text-purple-800';
      case 'contract': return 'bg-orange-100 text-orange-800';
      case 'internship': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleDelete = async () => {
    if (!job) return;

    try {
      setIsDeleting(true);
      await deleteJobDescription(job.id);
      navigate('/job-descriptions');
    } catch (err) {
      console.error('Error deleting job:', err);
      alert('Failed to delete job');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleApplicationStatusUpdate = async (applicationId: string, newStatus: CandidateJobApplication['applicationStatus']) => {
    try {
      await updateApplicationStatus(applicationId, newStatus);
      // Reload applications to reflect the change
      if (job) {
        loadApplications(job.id);
      }
    } catch (err) {
      console.error('Error updating application status:', err);
      alert('Failed to update application status');
    }
  };

  const handleAddCandidateClick = async () => {
    setIsAddCandidateModalOpen(true);
    
    try {
      setCandidatesLoading(true);
      const candidatesData = await getCandidates();
      // Filter out candidates who are already assigned to this job
      const assignedCandidateIds = applications.map(app => app.candidateId);
      const availableCandidates = candidatesData.filter(candidate => 
        !assignedCandidateIds.includes(candidate.id)
      );
      setAvailableCandidates(availableCandidates);
    } catch (err) {
      console.error('Error loading candidates:', err);
      alert('Failed to load candidates');
    } finally {
      setCandidatesLoading(false);
    }
  };

  const handleAssignCandidate = async (candidateId: string) => {
    if (!job) return;

    try {
      setAssigningCandidate(candidateId);
      await createJobApplication(candidateId, job.id);
      
      // Reload applications to show the new assignment
      await loadApplications(job.id);
      
      // Remove the candidate from available list
      setAvailableCandidates(prev => prev.filter(c => c.id !== candidateId));
      
      alert('Candidate assigned successfully!');
    } catch (err) {
      console.error('Error assigning candidate:', err);
      alert('Failed to assign candidate');
    } finally {
      setAssigningCandidate(null);
    }
  };

  const handleRemoveCandidateClick = (application: CandidateJobApplication) => {
    setApplicationToRemove(application);
    setShowRemoveDialog(true);
  };

  const handleRemoveCandidate = async () => {
    if (!applicationToRemove) return;

    try {
      setRemovingApplication(applicationToRemove.id);
      await deleteJobApplication(applicationToRemove.id);
      
      // Reload applications to reflect the change
      if (job) {
        await loadApplications(job.id);
      }
      
      setShowRemoveDialog(false);
      setApplicationToRemove(null);
      alert('Candidate removed successfully!');
    } catch (err) {
      console.error('Error removing candidate:', err);
      alert('Failed to remove candidate');
    } finally {
      setRemovingApplication(null);
    }
  };

  const closeAddCandidateModal = () => {
    setIsAddCandidateModalOpen(false);
    setAvailableCandidates([]);
    setAssigningCandidate(null);
  };

  const getApplicationStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'shortlisted': return 'bg-purple-100 text-purple-800';
      case 'interview_scheduled': return 'bg-indigo-100 text-indigo-800';
      case 'interviewed': return 'bg-orange-100 text-orange-800';
      case 'selected': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'withdrawn': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The job you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/job-descriptions')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Job Descriptions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/job-descriptions')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Job Descriptions
          </button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {job.title || 'Untitled Job'}
              </h1>
              {job.job_description_id && (
                <div className="mb-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                    Job ID: {job.job_description_id}
                  </span>
                </div>
              )}
              <div className="flex items-center space-x-4 text-gray-600">
                <div className="flex items-center">
                  <Building className="h-4 w-4 mr-1" />
                  {job.department || 'No Department'}
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {job.location || 'No Location'}
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(job.createdAt)}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status || 'active')}`}>
                {getStatusIcon(job.status || 'active')}
                <span className="ml-1">{(job.status || 'active').toUpperCase()}</span>
              </span>
              
              <button
                onClick={() => navigate(`/job-descriptions/edit/${job.id}`)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </button>
              
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Job Overview */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Job Overview</h2>
                <p className="text-gray-700 leading-relaxed">
                  {job.description || 'No description available'}
                </p>
              </div>

              {/* Key Details */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Key Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Experience Level</p>
                      <p className="font-medium">{(job.experienceLevel || 'mid').charAt(0).toUpperCase() + (job.experienceLevel || 'mid').slice(1)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Building className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Employment Type</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEmploymentTypeColor(job.employmentType || 'full-time')}`}>
                        {(job.employmentType || 'full-time').replace('-', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Requirements */}
              {job.requirements && Array.isArray(job.requirements) && job.requirements.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Requirements</h2>
                  <ul className="space-y-2">
                    {job.requirements.map((req, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Responsibilities */}
              {job.responsibilities && Array.isArray(job.responsibilities) && job.responsibilities.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Responsibilities</h2>
                  <ul className="space-y-2">
                    {job.responsibilities.map((resp, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Skills */}
              {job.skills && Array.isArray(job.skills) && job.skills.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Required Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Qualifications */}
              {job.qualifications && Array.isArray(job.qualifications) && job.qualifications.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Qualifications</h2>
                  <ul className="space-y-2">
                    {job.qualifications.map((qual, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{qual}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Benefits */}
              {job.benefits && Array.isArray(job.benefits) && job.benefits.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Benefits</h2>
                  <ul className="space-y-2">
                    {job.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Salary Range */}
              {job.salaryRange && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Salary Range</h3>
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-2 text-sm">💰</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {getCurrencySymbol(job.salaryRange.currency)} {formatIndianNumber(job.salaryRange.min)} - {formatIndianNumber(job.salaryRange.max)}
                    </span>
                  </div>
                </div>
              )}

              {/* Job Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Job Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Job Description ID</p>
                    <p className="text-sm font-medium text-gray-900">{job.job_description_id || 'Not assigned'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Created</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(job.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Last Updated</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(job.updatedAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Created By</p>
                    <p className="text-sm font-medium text-gray-900">{job.createdBy || 'Unknown'}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => navigate(`/job-descriptions/edit/${job.id}`)}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Job
                  </button>
                  <button
                    onClick={() => setShowDeleteDialog(true)}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Job
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Applications Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Job Applications</h2>
            <p className="text-gray-600 mt-1">
              {applications.length} candidate{applications.length !== 1 ? 's' : ''} applied to this position
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddCandidateClick}
              className="flex items-center"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Candidate
            </Button>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-500">Applications</span>
            </div>
          </div>
        </div>

        {applicationsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading applications...</p>
          </div>
        ) : applicationsError ? (
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">
              <X className="h-8 w-8 mx-auto" />
            </div>
            <p className="text-red-600">{applicationsError}</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <Users className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No applications yet</h3>
            <p className="text-gray-600">Candidates who apply to this job will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <div key={application.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {application.candidate?.name || 'Unknown Candidate'}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{application.candidate?.email || 'No email'}</span>
                        <span>•</span>
                        <span>Applied {formatDate(application.appliedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getApplicationStatusColor(application.applicationStatus)}`}>
                      {application.applicationStatus.replace('_', ' ').toUpperCase()}
                    </span>
                    <select
                      value={application.applicationStatus}
                      onChange={(e) => handleApplicationStatusUpdate(application.id, e.target.value as CandidateJobApplication['applicationStatus'])}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="applied">Applied</option>
                      <option value="under_review">Under Review</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="interview_scheduled">Interview Scheduled</option>
                      <option value="interviewed">Interviewed</option>
                      <option value="selected">Selected</option>
                      <option value="rejected">Rejected</option>
                      <option value="withdrawn">Withdrawn</option>
                    </select>
                    <button
                      onClick={() => application.candidate?.id && navigate(`/candidates/${application.candidate.id}`)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => handleRemoveCandidateClick(application)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center"
                      title="Remove candidate from this job"
                    >
                      <UserMinus className="h-4 w-4 mr-1" />
                      Remove
                    </button>
                  </div>
                </div>
                {application.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Notes:</span> {application.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Candidate Modal */}
      <Modal
        isOpen={isAddCandidateModalOpen}
        onClose={closeAddCandidateModal}
        title="Add Candidate to Job"
        size="lg"
      >
        <div className="p-6">
          {job && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Add candidates to: {job.title}
              </h3>
              <p className="text-sm text-gray-600">
                {job.companyName && `${job.companyName} • `}
                {job.location}
              </p>
            </div>
          )}

          {candidatesLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="md" />
              <span className="ml-2 text-gray-600">Loading candidates...</span>
            </div>
          ) : availableCandidates.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No available candidates to assign.</p>
              <p className="text-sm text-gray-500 mt-2">All candidates are already assigned to this job.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {availableCandidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{candidate.name}</h4>
                    <p className="text-sm text-gray-600">{candidate.email}</p>
                    {candidate.phone && (
                      <p className="text-sm text-gray-500">{candidate.phone}</p>
                    )}
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleAssignCandidate(candidate.id)}
                    disabled={assigningCandidate === candidate.id}
                    className="ml-4"
                  >
                    {assigningCandidate === candidate.id ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Assigning...
                      </>
                    ) : (
                      'Assign'
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={closeAddCandidateModal}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Remove Candidate Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showRemoveDialog}
        onClose={() => {
          setShowRemoveDialog(false);
          setApplicationToRemove(null);
        }}
        onConfirm={handleRemoveCandidate}
        title="Remove Candidate"
        message={`Are you sure you want to remove "${applicationToRemove?.candidate?.name || 'this candidate'}" from this job? This action cannot be undone.`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
        isLoading={removingApplication === applicationToRemove?.id}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Job Description"
        message={`Are you sure you want to delete "${job.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default JobViewPage;
