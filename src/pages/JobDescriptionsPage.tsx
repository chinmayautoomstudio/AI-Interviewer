import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  MapPin, 
  Clock, 
  DollarSign,
  Users,
  Calendar,
  RefreshCw,
  AlertCircle,
  UserPlus,
  MoreVertical
} from 'lucide-react';
import { JobDescription, CreateJobDescriptionRequest, Candidate } from '../types';
import { getJobDescriptions, deleteJobDescription, createJobDescription, updateJobDescription } from '../services/jobDescriptions';
import { getJobApplicationStats, createJobApplication, getApplicationsForJob } from '../services/candidateJobApplications';
import { getCandidates } from '../services/candidates';
import JDParserService from '../services/jdParser';
import AdvancedAddJobDescriptionModal from '../components/modals/AdvancedAddJobDescriptionModal';

const JobDescriptionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = id && window.location.pathname.includes('/edit/');
  const [isAddModalOpen, setIsAddModalOpen] = useState(!!isEditMode);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedJobForEdit, setSelectedJobForEdit] = useState<JobDescription | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Job descriptions data state
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [jobDescriptionsLoading, setJobDescriptionsLoading] = useState(true);
  const [jobDescriptionsError, setJobDescriptionsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Application counts state
  const [applicationCounts, setApplicationCounts] = useState<Record<string, number>>({});
  
  // Candidate assignment modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedJobForAssignment, setSelectedJobForAssignment] = useState<JobDescription | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [assigningCandidate, setAssigningCandidate] = useState<string | null>(null);
  
  // Delete confirmation state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<JobDescription | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState<CreateJobDescriptionRequest>({
    title: '',
    department: '',
    location: '',
    employmentType: 'full-time',
    experienceLevel: 'mid',
    salaryRange: undefined,
    description: '',
    requirements: [],
    responsibilities: [],
    benefits: [],
    skills: [],
    qualifications: [],
    status: 'active'
  });

  // Additional form fields
  const [companyName, setCompanyName] = useState('');
  const [workMode, setWorkMode] = useState('on-site');
  const [jobCategory, setJobCategory] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [applicationDeadline, setApplicationDeadline] = useState('');
  
  // Auto-parsing fields
  const [rawJobDescription, setRawJobDescription] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  const [requirementsInput, setRequirementsInput] = useState('');
  const [responsibilitiesInput, setResponsibilitiesInput] = useState('');
  const [benefitsInput, setBenefitsInput] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [, setQualificationsInput] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [salaryCurrency, setSalaryCurrency] = useState('INR');

  useEffect(() => {
    loadJobDescriptions();
  }, []);

  // Load job data for edit mode
  useEffect(() => {
    if (isEditMode && id) {
      loadJobForEdit(id);
    }
  }, [isEditMode, id]);

  const loadJobDescriptions = async () => {
    try {
      setJobDescriptionsLoading(true);
      setJobDescriptionsError(null);
      const data = await getJobDescriptions();
      setJobDescriptions(data);
      
      // Load application counts for each job
      await loadApplicationCounts(data);
    } catch (err) {
      console.error('Error loading job descriptions:', err);
      setJobDescriptionsError(err instanceof Error ? err.message : 'Failed to load job descriptions');
    } finally {
      setJobDescriptionsLoading(false);
    }
  };

  const loadApplicationCounts = async (jobs: JobDescription[]) => {
    try {
      const counts: Record<string, number> = {};
      
      // Load counts for each job in parallel
      const countPromises = jobs.map(async (job) => {
        try {
          const stats = await getJobApplicationStats(job.id);
          counts[job.id] = stats.total;
        } catch (err) {
          console.error(`Error loading application count for job ${job.id}:`, err);
          counts[job.id] = 0;
        }
      });
      
      await Promise.all(countPromises);
      setApplicationCounts(counts);
    } catch (err) {
      console.error('Error loading application counts:', err);
    }
  };

  const handleInputChange = (field: keyof CreateJobDescriptionRequest, value: string | string[]) => {
    setFormData((prev: CreateJobDescriptionRequest) => ({ ...prev, [field]: value }));
  };

  const handleArrayInput = (field: 'requirements' | 'responsibilities' | 'benefits' | 'skills' | 'qualifications', input: string, setInput: (value: string) => void) => {
    if (input.trim()) {
      const newItem = input.trim();
      setFormData((prev: CreateJobDescriptionRequest) => ({
        ...prev,
        [field]: [...(prev[field] || []), newItem]
      }));
      setInput('');
    }
  };

  const removeArrayItem = (field: 'requirements' | 'responsibilities' | 'benefits' | 'skills' | 'qualifications', index: number) => {
    setFormData((prev: CreateJobDescriptionRequest) => ({
      ...prev,
      [field]: prev[field].filter((_: string, i: number) => i !== index)
    }));
  };

  // Auto-parsing function
  const parseJobDescription = async () => {
    if (!rawJobDescription.trim()) {
      setError('Please paste a job description to parse');
      return;
    }

    setIsParsing(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await JDParserService.parseJobDescription(rawJobDescription);
      
      if (!result.success) {
        setError(result.error || 'Failed to parse job description');
        return;
      }

      if (!result.data) {
        setError('No data returned from AI parser');
        return;
      }

      const data = result.data;

      // Update form data with parsed information
      setFormData(prev => ({
        ...prev,
        title: data.job_title || '',
        department: data.department || '',
        location: data.location || '',
        employmentType: data.employment_type || 'full-time',
        experienceLevel: data.experience_level || 'mid',
        description: data.job_summary || '',
        requirements: data.required_skills || [],
        responsibilities: data.key_responsibilities || [],
        skills: data.technical_stack || [],
        qualifications: data.qualifications?.minimum || [],
        benefits: data.benefits || []
      }));

      // Update additional fields
      if (data.salary_range) {
        // Parse salary range from text (e.g., "₹2.5L - ₹4L per annum")
        // For now, just set the salary range text - you can add parsing logic later
        setSalaryMin('0');
        setSalaryMax('0');
        setSalaryCurrency('INR');
      }

      // Note: The enhanced parser doesn't include these fields in the current structure
      // You may need to add them to the prompt or handle them separately
      // if (data.companyName) {
      //   setCompanyName(data.companyName);
      // }

      // if (data.workMode) {
      //   setWorkMode(data.workMode);
      // }

      // if (data.jobCategory) {
      //   setJobCategory(data.jobCategory);
      // }

      // if (data.contactEmail) {
      //   setContactEmail(data.contactEmail);
      // }

      // if (data.applicationDeadline && data.applicationDeadline.trim() !== '') {
      //   setApplicationDeadline(data.applicationDeadline);
      // }

      setSuccess('Job description parsed successfully using AI! Please review and adjust the fields as needed.');
    } catch (error) {
      console.error('Error parsing job description:', error);
      setError('Failed to parse job description. Please try again or fill the form manually.');
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
      if (!formData.title || !formData.department || !formData.location || !formData.description || !companyName || !contactEmail) {
        setError('Please fill in all required fields (marked with *)');
        return;
      }

      // Prepare job data with salary range and additional fields
      const jobData = {
        ...formData,
        salaryRange: (salaryMin && salaryMax) ? {
          min: parseInt(salaryMin),
          max: parseInt(salaryMax),
          currency: salaryCurrency
        } : undefined,
        // Include additional fields
        companyName,
        workMode: workMode as 'on-site' | 'remote' | 'hybrid',
        jobCategory,
        contactEmail,
        applicationDeadline: applicationDeadline && applicationDeadline.trim() !== '' ? applicationDeadline : undefined
      };

      // Create or update job description
      if (isEditMode && id) {
        await updateJobDescription(id, jobData);
        setSuccess('Job description updated successfully!');
      } else {
        await createJobDescription(jobData);
        setSuccess('Job description created successfully!');
      }

      closeModal();
      await loadJobDescriptions();
    } catch (err) {
      console.error('Error creating job description:', err);
      setError(err instanceof Error ? err.message : (isEditMode ? 'Failed to update job description' : 'Failed to create job description'));
    } finally {
      setLoading(false);
    }
  };

  const loadJobForEdit = async (jobId: string) => {
    try {
      setLoading(true);
      const jobs = await getJobDescriptions();
      const job = jobs.find(j => j.id === jobId);
      
      if (job) {
        // Map old experience level format to new format
        const mapExperienceLevel = (level: string): 'entry' | 'mid' | 'senior' | 'lead' | 'executive' => {
          switch (level) {
            case 'entry-level': return 'entry';
            case 'mid-level': return 'mid';
            case 'senior-level': return 'senior';
            case 'entry': return 'entry';
            case 'mid': return 'mid';
            case 'senior': return 'senior';
            case 'lead': return 'lead';
            case 'executive': return 'executive';
            default: return level as 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
          }
        };

        setFormData({
          title: job.title,
          department: job.department,
          location: job.location,
          employmentType: job.employmentType,
          experienceLevel: mapExperienceLevel(job.experienceLevel),
          salaryRange: job.salaryRange,
          description: job.description,
          requirements: job.requirements || [],
          responsibilities: job.responsibilities || [],
          benefits: job.benefits || [],
          skills: job.skills || [],
          qualifications: job.qualifications || [],
          status: job.status
        });
        
        // Set additional fields
        setCompanyName(job.companyName || '');
        setWorkMode(job.workMode || 'on-site');
        setJobCategory(job.jobCategory || '');
        setContactEmail(job.contactEmail || '');
        setApplicationDeadline(job.applicationDeadline || '');
        
        // Set salary fields
        if (job.salaryRange) {
          setSalaryMin(job.salaryRange.min.toString());
          setSalaryMax(job.salaryRange.max.toString());
          setSalaryCurrency(job.salaryRange.currency);
        }
      }
    } catch (err) {
      setError('Failed to load job for editing');
      console.error('Error loading job for edit:', err);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setError(null);
    setSuccess(null);
    setFormData({
      title: '',
      department: '',
      location: '',
      employmentType: 'full-time',
      experienceLevel: 'mid',
      salaryRange: undefined,
      description: '',
      requirements: [],
      responsibilities: [],
      benefits: [],
      skills: [],
      qualifications: [],
      status: 'active'
    });
    setRequirementsInput('');
    setResponsibilitiesInput('');
    setBenefitsInput('');
    setSkillsInput('');
    setQualificationsInput('');
    setSalaryMin('');
    setSalaryMax('');
    setSalaryCurrency('INR');
    setCompanyName('');
    setWorkMode('on-site');
    setJobCategory('');
    setContactEmail('');
    setApplicationDeadline('');
    setRawJobDescription('');
    setIsParsing(false);
    
    // Navigate back to job descriptions list if in edit mode
    if (isEditMode) {
      navigate('/job-descriptions');
    }
  };

  const handleDeleteClick = (job: JobDescription) => {
    setJobToDelete(job);
    setShowDeleteDialog(true);
  };

  const handleAssignClick = async (job: JobDescription) => {
    setSelectedJobForAssignment(job);
    setIsAssignModalOpen(true);
    
    // Load candidates and filter out already assigned ones
    try {
      setCandidatesLoading(true);
      const [candidatesData, applicationsData] = await Promise.all([
        getCandidates(),
        getApplicationsForJob(job.id)
      ]);
      
      // Filter out candidates who are already assigned to this job
      const assignedCandidateIds = applicationsData.map(app => app.candidateId);
      const availableCandidates = candidatesData.filter(candidate => 
        !assignedCandidateIds.includes(candidate.id)
      );
      
      setCandidates(availableCandidates);
    } catch (err) {
      console.error('Error loading candidates:', err);
      setError('Failed to load candidates');
    } finally {
      setCandidatesLoading(false);
    }
  };

  const handleAssignCandidate = async (candidateId: string) => {
    if (!selectedJobForAssignment) return;

    try {
      setAssigningCandidate(candidateId);
      await createJobApplication(candidateId, selectedJobForAssignment.id);
      
      // Update application counts
      setApplicationCounts(prev => ({
        ...prev,
        [selectedJobForAssignment.id]: (prev[selectedJobForAssignment.id] || 0) + 1
      }));
      
      setSuccess(`Candidate assigned to ${selectedJobForAssignment.title} successfully!`);
    } catch (err) {
      console.error('Error assigning candidate:', err);
      setError('Failed to assign candidate');
    } finally {
      setAssigningCandidate(null);
    }
  };

  const closeAssignModal = () => {
    setIsAssignModalOpen(false);
    setSelectedJobForAssignment(null);
    setCandidates([]);
    setAssigningCandidate(null);
  };

  const handleEditClick = (job: JobDescription) => {
    setSelectedJobForEdit(job);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedJobForEdit(null);
  };

  const handleDeleteConfirm = async () => {
    if (!jobToDelete?.id) return;

    try {
      setIsDeleting(true);
      await deleteJobDescription(jobToDelete.id);
      setShowDeleteDialog(false);
      setJobToDelete(null);
      await loadJobDescriptions();
    } catch (err) {
      console.error('Error deleting job description:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete job description');
    } finally {
      setIsDeleting(false);
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

  const getEmploymentTypeColor = (type: string) => {
    switch (type) {
      case 'full-time': return 'bg-blue-100 text-blue-800';
      case 'part-time': return 'bg-purple-100 text-purple-800';
      case 'contract': return 'bg-orange-100 text-orange-800';
      case 'internship': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatIndianNumber = (num: number) => {
    // Format number in Indian style: 1,50,000
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

  const filteredJobs = jobDescriptions.filter(job =>
    (job.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (job.department || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (job.location || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (jobDescriptionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Job Descriptions</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage job postings and descriptions</p>
        </div>
        
        {/* Desktop: Full header with buttons */}
        <div className="hidden lg:flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={loadJobDescriptions} 
            disabled={jobDescriptionsLoading} 
            className="bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700 hover:text-gray-800"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${jobDescriptionsLoading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </Button>
          <Button 
            variant="primary" 
            onClick={() => setIsUploadModalOpen(true)} 
            className="shadow-lg hover:shadow-xl"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Add Job Description</span>
          </Button>
        </div>

        {/* Mobile: Just refresh icon */}
        <button 
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          onClick={loadJobDescriptions}
          disabled={jobDescriptionsLoading}
        >
          <RefreshCw className={`w-5 h-5 text-gray-600 ${jobDescriptionsLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search job descriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 lg:bg-white rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-700 placeholder-gray-400 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 lg:focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {/* Desktop: Full filter button */}
        <Button 
          variant="outline" 
          className="hidden lg:flex bg-white hover:bg-gray-50 border-gray-300 text-gray-700 hover:text-gray-800"
        >
          <Filter className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">Filter</span>
        </Button>
        
        {/* Mobile: Icon-only filter button */}
        <button className="lg:hidden p-2.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
          <Filter className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Error State */}
      {jobDescriptionsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="text-red-600 mb-3 sm:mb-0">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="ml-0 sm:ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">Error loading job descriptions</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">{jobDescriptionsError}</p>
              <Button variant="primary" onClick={loadJobDescriptions} className="w-full sm:w-auto">
                <RefreshCw className="h-4 w-4 mr-2" />
                <span className="text-sm sm:text-base">Try Again</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Job Descriptions List */}
      {!jobDescriptionsError && (
        <div className="space-y-4">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Briefcase className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
              <h3 className="mt-2 text-sm sm:text-base font-medium text-gray-900">No job descriptions</h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 px-4">
                {searchQuery ? 'No job descriptions match your search.' : 'Get started by creating a new job description.'}
              </p>
              {!searchQuery && (
                <div className="mt-4 flex justify-center">
                  <Button variant="primary" onClick={() => setIsUploadModalOpen(true)} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="text-sm sm:text-base">Add First Job Description</span>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 lg:pb-0 pb-24">
              {filteredJobs.map((job) => (
                <div key={job.id}>
                  {/* Mobile Card View */}
                  <div className="lg:hidden bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    {/* Card Header */}
                    <div className="p-4 pb-3">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-teal-100 text-teal-700 text-xs font-semibold px-2 py-1 rounded">
                              NEW
                            </span>
                            <span className="text-xs text-gray-500 font-medium">{job.job_description_id || job.id}</span>
                          </div>
                          <h3 className="text-base font-semibold text-gray-900 leading-tight mb-1">
                            {job.title || 'Untitled Job'}
                          </h3>
                        </div>
                        <button 
                          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                          onClick={() => handleEditClick(job)}
                        >
                          <MoreVertical className="w-5 h-5 text-gray-400" />
                        </button>
                      </div>

                      {/* Status Badges */}
                      <div className="flex gap-2 mb-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getStatusColor(job.status || 'active')}`}>
                          {(job.status || 'active').toUpperCase()}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getEmploymentTypeColor(job.employmentType || 'full-time')}`}>
                          {(job.employmentType || 'full-time').replace('-', ' ').toUpperCase()}
                        </span>
                      </div>

                      {/* Candidate Count - Prominent */}
                      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-3 mb-3 border border-teal-100">
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-teal-600" />
                          <span className="text-2xl font-bold text-teal-700">{applicationCounts[job.id] || 0}</span>
                          <span className="text-sm text-teal-600 font-medium">candidate{(applicationCounts[job.id] || 0) !== 1 ? 's' : ''}</span>
                        </div>
                      </div>

                      {/* Job Details Grid */}
                      <div className="space-y-2.5">
                        <div className="flex items-start gap-2">
                          <Briefcase className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{job.department || 'No Department'}</span>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700 leading-snug">{job.location || 'No Location'}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{(job.experienceLevel || 'mid').charAt(0).toUpperCase() + (job.experienceLevel || 'mid').slice(1)}</span>
                        </div>
                        
                        {job.salaryRange && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm font-semibold text-gray-900">
                              {getCurrencySymbol(job.salaryRange.currency)} {formatIndianNumber(job.salaryRange.min)} - {formatIndianNumber(job.salaryRange.max)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                          {job.description || 'No description available'}
                        </p>
                      </div>

                      {/* Created Date */}
                      <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Created {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Unknown date'}</span>
                      </div>
                    </div>

                    {/* Card Footer - Action Button */}
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                      <button 
                        className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-lg transition-colors"
                        onClick={() => navigate(`/job-descriptions/${job.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </div>
                  </div>

                  {/* Desktop Card View */}
                  <Card className="hidden lg:block">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0 mb-3">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{job.title || 'Untitled Job'}</h3>
                          <div className="flex flex-wrap gap-2">
                            {job.job_description_id && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                {job.job_description_id}
                              </span>
                            )}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status || 'active')}`}>
                              {(job.status || 'active').toUpperCase()}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEmploymentTypeColor(job.employmentType || 'full-time')}`}>
                              {(job.employmentType || 'full-time').replace('-', ' ').toUpperCase()}
                            </span>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {applicationCounts[job.id] || 0} candidate{(applicationCounts[job.id] || 0) !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-2 sm:space-y-0 text-xs sm:text-sm text-gray-600 mb-3">
                          <div className="flex items-center">
                            <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            <span className="truncate">{job.department || 'No Department'}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            <span className="truncate">{job.location || 'No Location'}</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            <span className="truncate">{(job.experienceLevel || 'mid').charAt(0).toUpperCase() + (job.experienceLevel || 'mid').slice(1)}</span>
                          </div>
                          {job.salaryRange && (
                            <div className="flex items-center text-xs sm:text-sm">
                              <span className="text-gray-500 mr-1">💰</span>
                              <span className="font-medium text-gray-900 truncate">
                                {getCurrencySymbol(job.salaryRange.currency)} {formatIndianNumber(job.salaryRange.min)} - {formatIndianNumber(job.salaryRange.max)}
                              </span>
                            </div>
                          )}
                        </div>

                        <p className="text-gray-700 text-xs sm:text-sm mb-3 line-clamp-2">
                          {job.description || 'No description available'}
                        </p>

                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          Created {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Unknown date'}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center lg:ml-4 space-y-3 sm:space-y-0 sm:space-x-3">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/job-descriptions/${job.id}`)}
                          className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 hover:text-blue-800"
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="text-xs sm:text-sm">View</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleAssignClick(job)}
                          className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700 hover:text-green-800"
                        >
                          <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="text-xs sm:text-sm">Assign</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditClick(job)}
                          className="bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700 hover:text-amber-800"
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteClick(job)}
                          className="bg-red-50 hover:bg-red-100 border-red-200 text-red-700 hover:text-red-800"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Indeed-Style Job Posting Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={closeModal}
        title=""
        size="xl"
      >
        <div className="bg-white">
          {/* Header */}
          <div className="border-b border-gray-200 px-4 sm:px-6 py-4">
            <div className="flex items-start sm:items-center justify-between">
              <div className="flex-1 pr-4">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900">{isEditMode ? 'Edit Job Post' : 'Post a Job'}</h2>
                <p className="text-sm sm:text-base text-gray-600 mt-1">{isEditMode ? 'Update your job posting details' : 'Create a job posting to attract the best candidates'}</p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>


          {/* Content */}
          <div className="px-4 sm:px-6 py-4 sm:py-6">
            {/* Error/Success Messages */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}
            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-800">{success}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Import Section - Hidden in Edit Mode */}
            {!isEditMode && (
            <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
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
                      className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Paste your job description here... We'll extract the title, company, location, salary, requirements, and more automatically."
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-blue-600">
                        🤖 AI will extract: Job title, company, location, salary, requirements, responsibilities, skills, and benefits
                      </p>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={parseJobDescription}
                        disabled={isParsing || !rawJobDescription.trim()}
                        className="ml-4"
                      >
                        {isParsing ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Parsing...
                          </>
                        ) : (
                          '🤖 AI Parse & Auto-Fill'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Job Details Form */}
            <div className="space-y-6 sm:space-y-8">
              {/* Basic Information */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Job Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-lg"
                      placeholder="e.g., Senior Software Engineer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-lg"
                      placeholder="e.g., Autoom Studio OPC Pvt. Ltd."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      placeholder="e.g., Bhubaneswar, Odisha"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employment Type
                    </label>
                    <select
                      value={formData.employmentType}
                      onChange={(e) => handleInputChange('employmentType', e.target.value as any)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    >
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Experience Level
                    </label>
                    <select
                      value={formData.experienceLevel}
                      onChange={(e) => handleInputChange('experienceLevel', e.target.value as any)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    >
                      <option value="entry">Entry Level (0-2 years)</option>
                      <option value="mid">Mid Level (3-5 years)</option>
                      <option value="senior">Senior Level (6-10 years)</option>
                      <option value="lead">Lead Level (10+ years)</option>
                      <option value="executive">Executive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Work Mode
                    </label>
                    <select
                      value={workMode}
                      onChange={(e) => setWorkMode(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    >
                      <option value="on-site">On-site</option>
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Salary Information */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Salary & Benefits</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Salary (Per Annum)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-lg">₹</span>
                      </div>
                      <input
                        type="number"
                        value={salaryMin}
                        onChange={(e) => setSalaryMin(e.target.value)}
                        className="w-full pl-6 sm:pl-8 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                        placeholder="300000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Salary (Per Annum)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-lg">₹</span>
                      </div>
                      <input
                        type="number"
                        value={salaryMax}
                        onChange={(e) => setSalaryMax(e.target.value)}
                        className="w-full pl-6 sm:pl-8 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                        placeholder="600000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <select
                      value={salaryCurrency}
                      onChange={(e) => setSalaryCurrency(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Job Description */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Job Description</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Describe the role and what makes it unique *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={6}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm sm:text-base"
                    placeholder="Tell candidates about the role, company culture, growth opportunities, and what makes this position special..."
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    💡 Tip: Include information about your company culture, team, and growth opportunities to attract better candidates.
                  </p>
                </div>
              </div>

              {/* Requirements */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Requirements</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What skills and experience are required?
                  </label>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mb-3">
                    <input
                      type="text"
                      value={requirementsInput}
                      onChange={(e) => setRequirementsInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleArrayInput('requirements', requirementsInput, setRequirementsInput)}
                      className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      placeholder="e.g., 3+ years of React experience"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleArrayInput('requirements', requirementsInput, setRequirementsInput)}
                      className="px-4 sm:px-6 w-full sm:w-auto"
                    >
                      <span className="text-sm sm:text-base">Add</span>
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.requirements.map((req: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {req}
                        <button
                          type="button"
                          onClick={() => removeArrayItem('requirements', index)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Responsibilities */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Responsibilities</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What will the candidate be doing day-to-day?
                  </label>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mb-3">
                    <input
                      type="text"
                      value={responsibilitiesInput}
                      onChange={(e) => setResponsibilitiesInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleArrayInput('responsibilities', responsibilitiesInput, setResponsibilitiesInput)}
                      className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      placeholder="e.g., Develop and maintain web applications"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleArrayInput('responsibilities', responsibilitiesInput, setResponsibilitiesInput)}
                      className="px-4 sm:px-6 w-full sm:w-auto"
                    >
                      <span className="text-sm sm:text-base">Add</span>
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.responsibilities.map((resp: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                      >
                        {resp}
                        <button
                          type="button"
                          onClick={() => removeArrayItem('responsibilities', index)}
                          className="ml-2 text-green-600 hover:text-green-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Required Skills</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What technical skills are needed?
                  </label>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mb-3">
                    <input
                      type="text"
                      value={skillsInput}
                      onChange={(e) => setSkillsInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleArrayInput('skills', skillsInput, setSkillsInput)}
                      className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      placeholder="e.g., React, Node.js, TypeScript"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleArrayInput('skills', skillsInput, setSkillsInput)}
                      className="px-4 sm:px-6 w-full sm:w-auto"
                    >
                      <span className="text-sm sm:text-base">Add</span>
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeArrayItem('skills', index)}
                          className="ml-2 text-purple-600 hover:text-purple-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Benefits & Perks</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What benefits do you offer?
                  </label>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mb-3">
                    <input
                      type="text"
                      value={benefitsInput}
                      onChange={(e) => setBenefitsInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleArrayInput('benefits', benefitsInput, setBenefitsInput)}
                      className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      placeholder="e.g., Health insurance, Flexible hours"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleArrayInput('benefits', benefitsInput, setBenefitsInput)}
                      className="px-4 sm:px-6 w-full sm:w-auto"
                    >
                      <span className="text-sm sm:text-base">Add</span>
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.benefits.map((benefit: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800"
                      >
                        {benefit}
                        <button
                          type="button"
                          onClick={() => removeArrayItem('benefits', index)}
                          className="ml-2 text-yellow-600 hover:text-yellow-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Email *
                    </label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      placeholder="hr@company.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Application Deadline
                    </label>
                    <input
                      type="date"
                      value={applicationDeadline}
                      onChange={(e) => setApplicationDeadline(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-200 px-4 sm:px-6 py-4 bg-gray-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <Button variant="outline" onClick={closeModal} disabled={loading} className="w-full sm:w-auto">
                  <span className="text-sm sm:text-base">Cancel</span>
                </Button>
                <Button variant="outline" disabled={loading} className="w-full sm:w-auto">
                  <span className="text-sm sm:text-base">Save as Draft</span>
                </Button>
              </div>
              <div className="flex items-center">
                <Button variant="primary" onClick={handleSubmit} disabled={loading} className="w-full sm:w-auto px-6 sm:px-8">
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-sm sm:text-base">{isEditMode ? 'Updating...' : 'Creating...'}</span>
                    </>
                  ) : (
                    <span className="text-sm sm:text-base">{isEditMode ? 'Update Job Post' : 'Create Job Post'}</span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>


      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setJobToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Job Description"
        message={`Are you sure you want to delete "${jobToDelete?.title || 'this job description'}"? This action cannot be undone and will permanently remove all job description data.`}
        confirmText="Delete Job Description"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Candidate Assignment Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={closeAssignModal}
        title="Assign Candidates"
        size="lg"
      >
        <div className="p-6">
          {selectedJobForAssignment && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Assign candidates to: {selectedJobForAssignment.title}
              </h3>
              <p className="text-sm text-gray-600">
                {selectedJobForAssignment.companyName && `${selectedJobForAssignment.companyName} • `}
                {selectedJobForAssignment.location}
              </p>
            </div>
          )}

          {candidatesLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="md" />
              <span className="ml-2 text-gray-600">Loading candidates...</span>
            </div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No available candidates to assign.</p>
              <p className="text-sm text-gray-500 mt-2">
                All candidates may already be assigned to this job.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {candidates.map((candidate) => (
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
            <Button variant="outline" onClick={closeAssignModal}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Upload JD Modal */}
      <AdvancedAddJobDescriptionModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => {
          setIsUploadModalOpen(false);
          loadJobDescriptions();
        }}
      />

      {/* Edit JD Modal */}
      <AdvancedAddJobDescriptionModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSuccess={() => {
          closeEditModal();
          loadJobDescriptions();
        }}
        editJobDescription={selectedJobForEdit || undefined}
      />

      {/* Floating Add Button - Mobile Only */}
      <button 
        className="lg:hidden fixed bottom-6 right-4 bg-teal-600 hover:bg-teal-700 text-white pl-5 pr-6 py-3.5 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-medium z-50"
        onClick={() => setIsUploadModalOpen(true)}
      >
        <Plus className="w-5 h-5" />
        <span>Add Job Description</span>
      </button>
    </div>
  );
};

export default JobDescriptionsPage;