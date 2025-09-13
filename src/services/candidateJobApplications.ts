import { supabase } from './supabase';
import { CandidateJobApplication, Candidate, JobDescription } from '../types';
import { CandidatesService } from './candidates';

// Helper function to ensure array fields are properly handled
const ensureArray = (field: any): any[] => {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field);
      return Array.isArray(parsed) ? parsed : [field];
    } catch {
      return [field];
    }
  }
  return [];
};

// Transform candidate data from Supabase format to frontend format
const transformCandidateData = (data: any): Candidate => ({
  id: data.id,
  candidate_id: data.candidate_id,
  email: data.email || '',
  name: data.name || '',
  phone: data.phone,
  contact_number: data.contact_number,
  resume: data.resume,
  resumeUrl: data.resume_url,
  resume_url: data.resume_url,
  resumeText: data.resume_text,
  resume_text: data.resume_text,
  summary: data.summary,
  skills: ensureArray(data.skills),
  experience: ensureArray(data.experience),
  education: ensureArray(data.education),
  projects: data.projects,
  status: data.status || 'active',
  interviewId: data.interview_id,
  interview_id: data.interview_id,
  primaryJobDescriptionId: data.primary_job_description_id,
  createdAt: data.created_at,
  created_at: data.created_at,
  updatedAt: data.updated_at,
  updated_at: data.updated_at,
});

// Transform job description data from Supabase format to frontend format
const transformJobDescriptionData = (data: any): JobDescription => ({
  id: data.id,
  job_description_id: data.job_description_id,
  title: data.title || '',
  department: data.department || '',
  location: data.location || '',
  employmentType: data.employment_type || 'full-time',
  experienceLevel: data.experience_level || 'entry',
  salaryRange: data.salary_range ? {
    min: data.salary_range.min || 0,
    max: data.salary_range.max || 0,
    currency: data.salary_range.currency || 'INR'
  } : undefined,
  description: data.description || '',
  requirements: ensureArray(data.requirements),
  responsibilities: ensureArray(data.responsibilities),
  benefits: ensureArray(data.benefits),
  skills: ensureArray(data.skills),
  qualifications: ensureArray(data.qualifications),
  status: data.status || 'active',
  createdBy: data.created_by || '',
  createdAt: data.created_at,
  updatedAt: data.updated_at,
  publishedAt: data.published_at,
  companyName: data.company_name,
  workMode: data.work_mode,
  jobCategory: data.job_category,
  contactEmail: data.contact_email,
  applicationDeadline: data.application_deadline,
});

// Transform application data from Supabase format to frontend format
const transformApplicationData = (data: any): CandidateJobApplication => ({
  id: data.id,
  candidateId: data.candidate_id,
  jobDescriptionId: data.job_description_id,
  applicationStatus: data.application_status || 'applied',
  appliedAt: data.applied_at,
  notes: data.notes,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
  candidate: data.candidate ? transformCandidateData(data.candidate) : undefined,
  jobDescription: data.job_description ? transformJobDescriptionData(data.job_description) : undefined,
});

// Get all applications for a specific job description
export const getApplicationsForJob = async (jobDescriptionId: string): Promise<CandidateJobApplication[]> => {
  try {
    const { data, error } = await supabase
      .from('candidate_job_applications')
      .select(`
        *,
        candidate:candidates(*),
        job_description:job_descriptions(*)
      `)
      .eq('job_description_id', jobDescriptionId)
      .order('applied_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications for job:', error);
      throw error;
    }

    return data ? data.map(transformApplicationData) : [];
  } catch (error) {
    console.error('Error in getApplicationsForJob:', error);
    throw error;
  }
};

// Get all applications for a specific candidate
export const getApplicationsForCandidate = async (candidateId: string): Promise<CandidateJobApplication[]> => {
  try {
    const { data, error } = await supabase
      .from('candidate_job_applications')
      .select(`
        *,
        candidate:candidates(*),
        job_description:job_descriptions(*)
      `)
      .eq('candidate_id', candidateId)
      .order('applied_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications for candidate:', error);
      throw error;
    }

    return data ? data.map(transformApplicationData) : [];
  } catch (error) {
    console.error('Error in getApplicationsForCandidate:', error);
    throw error;
  }
};

// Create a new job application
export const createJobApplication = async (
  candidateId: string,
  jobDescriptionId: string,
  notes?: string
): Promise<CandidateJobApplication> => {
  try {
    // Create the job application record
    const { data, error } = await supabase
      .from('candidate_job_applications')
      .insert({
        candidate_id: candidateId,
        job_description_id: jobDescriptionId,
        application_status: 'applied',
        notes: notes || null,
      })
      .select(`
        *,
        candidate:candidates(*),
        job_description:job_descriptions(*)
      `)
      .single();

    if (error) {
      console.error('Error creating job application:', error);
      throw error;
    }

    // Update the candidate's primary job description ID
    try {
      await CandidatesService.updateCandidatePrimaryJob(candidateId, jobDescriptionId);
    } catch (updateError) {
      console.warn('Failed to update candidate primary job description ID:', updateError);
      // Don't throw here as the application was created successfully
    }

    return transformApplicationData(data);
  } catch (error) {
    console.error('Error in createJobApplication:', error);
    throw error;
  }
};

// Update application status
export const updateApplicationStatus = async (
  applicationId: string,
  status: CandidateJobApplication['applicationStatus'],
  notes?: string
): Promise<CandidateJobApplication> => {
  try {
    const updateData: any = {
      application_status: status,
      updated_at: new Date().toISOString(),
    };

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const { data, error } = await supabase
      .from('candidate_job_applications')
      .update(updateData)
      .eq('id', applicationId)
      .select(`
        *,
        candidate:candidates(*),
        job_description:job_descriptions(*)
      `)
      .single();

    if (error) {
      console.error('Error updating application status:', error);
      throw error;
    }

    return transformApplicationData(data);
  } catch (error) {
    console.error('Error in updateApplicationStatus:', error);
    throw error;
  }
};

// Delete a job application
export const deleteJobApplication = async (applicationId: string): Promise<void> => {
  try {
    // First, get the application to find the candidate ID
    const { data: application, error: fetchError } = await supabase
      .from('candidate_job_applications')
      .select('candidate_id')
      .eq('id', applicationId)
      .single();

    if (fetchError) {
      console.error('Error fetching application for deletion:', fetchError);
      throw fetchError;
    }

    // Delete the job application
    const { error } = await supabase
      .from('candidate_job_applications')
      .delete()
      .eq('id', applicationId);

    if (error) {
      console.error('Error deleting job application:', error);
      throw error;
    }

    // Clear the candidate's primary job description ID
    if (application?.candidate_id) {
      try {
        await CandidatesService.updateCandidatePrimaryJob(application.candidate_id, '');
      } catch (updateError) {
        console.warn('Failed to clear candidate primary job description ID:', updateError);
        // Don't throw here as the application was deleted successfully
      }
    }
  } catch (error) {
    console.error('Error in deleteJobApplication:', error);
    throw error;
  }
};

// Check if a candidate has already applied to a job
export const hasCandidateApplied = async (candidateId: string, jobDescriptionId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('candidate_job_applications')
      .select('id')
      .eq('candidate_id', candidateId)
      .eq('job_description_id', jobDescriptionId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking application status:', error);
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('Error in hasCandidateApplied:', error);
    throw error;
  }
};

// Get application statistics for a job
export const getJobApplicationStats = async (jobDescriptionId: string) => {
  try {
    const { data, error } = await supabase
      .from('candidate_job_applications')
      .select('application_status')
      .eq('job_description_id', jobDescriptionId);

    if (error) {
      console.error('Error fetching application stats:', error);
      throw error;
    }

    const stats = {
      total: data?.length || 0,
      applied: 0,
      under_review: 0,
      shortlisted: 0,
      interview_scheduled: 0,
      interviewed: 0,
      selected: 0,
      rejected: 0,
      withdrawn: 0,
    };

    data?.forEach((app: any) => {
      if (stats.hasOwnProperty(app.application_status)) {
        stats[app.application_status as keyof typeof stats]++;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error in getJobApplicationStats:', error);
    throw error;
  }
};
