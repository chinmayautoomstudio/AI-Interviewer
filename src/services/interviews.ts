import { supabase } from './supabase';
import { Interview, InterviewForm } from '../types';

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

// Transform interview data from Supabase format to frontend format
const transformInterviewData = (data: any): Interview => ({
  id: data.id,
  candidateId: data.candidate_id,
  jobDescriptionId: data.job_description_id,
  aiAgentId: data.ai_agent_id,
  interviewType: data.interview_type || 'general',
  duration: data.interview_duration || data.duration || 30,
  status: data.status || 'scheduled',
  scheduledAt: data.scheduled_at,
  startedAt: data.started_at,
  completedAt: data.completed_at,
  interviewNotes: data.interview_notes,
  results: data.results,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
  candidate: data.candidate ? {
    id: data.candidate.id,
    candidate_id: data.candidate.candidate_id,
    email: data.candidate.email || '',
    name: data.candidate.name || '',
    phone: data.candidate.phone,
    contact_number: data.candidate.contact_number,
    resume: data.candidate.resume_url,
    resumeUrl: data.candidate.resume_url,
    resume_url: data.candidate.resume_url,
    resumeText: data.candidate.resume_text,
    resume_text: data.candidate.resume_text,
    summary: data.candidate.summary,
    skills: ensureArray(data.candidate.skills),
    experience: ensureArray(data.candidate.experience),
    education: ensureArray(data.candidate.education),
    projects: data.candidate.projects,
    status: data.candidate.status || 'active',
    interviewId: data.candidate.interview_id,
    interview_id: data.candidate.interview_id,
    primaryJobDescriptionId: data.candidate.primary_job_description_id,
    createdAt: data.candidate.created_at,
    created_at: data.candidate.created_at,
    updatedAt: data.candidate.updated_at,
    updated_at: data.candidate.updated_at,
  } : undefined,
  jobDescription: data.job_description ? {
    id: data.job_description.id,
    job_description_id: data.job_description.job_description_id,
    title: data.job_description.title || '',
    department: data.job_description.department || '',
    location: data.job_description.location || '',
    employmentType: data.job_description.employment_type || 'full-time',
    experienceLevel: data.job_description.experience_level || 'entry',
    salaryRange: data.job_description.salary_range ? {
      min: data.job_description.salary_range.min || 0,
      max: data.job_description.salary_range.max || 0,
      currency: data.job_description.salary_range.currency || 'INR'
    } : undefined,
    description: data.job_description.description || '',
    requirements: ensureArray(data.job_description.requirements),
    responsibilities: ensureArray(data.job_description.responsibilities),
    benefits: ensureArray(data.job_description.benefits),
    skills: ensureArray(data.job_description.skills),
    qualifications: ensureArray(data.job_description.qualifications),
    status: data.job_description.status || 'active',
    createdBy: data.job_description.created_by || '',
    createdAt: data.job_description.created_at,
    updatedAt: data.job_description.updated_at,
    publishedAt: data.job_description.published_at,
    companyName: data.job_description.company_name,
    workMode: data.job_description.work_mode,
    jobCategory: data.job_description.job_category,
    contactEmail: data.job_description.contact_email,
    applicationDeadline: data.job_description.application_deadline,
  } : undefined,
  aiAgent: data.ai_agent ? {
    id: data.ai_agent.id,
    name: data.ai_agent.name || '',
    description: data.ai_agent.description,
    agentType: data.ai_agent.agent_type || 'general',
    jobCategories: ensureArray(data.ai_agent.job_categories),
    n8nWebhookUrl: data.ai_agent.n8n_webhook_url || '',
    isActive: data.ai_agent.is_active !== false,
    createdAt: data.ai_agent.created_at,
    updatedAt: data.ai_agent.updated_at,
    createdBy: data.ai_agent.created_by || '',
  } : undefined,
});

// Get all interviews
export const getInterviews = async (): Promise<Interview[]> => {
  try {
    const { data, error } = await supabase
      .from('interviews')
      .select(`
        *,
        candidate:candidates(*),
        job_description:job_descriptions(*),
        ai_agent:ai_agents(*)
      `)
      .order('scheduled_at', { ascending: false });

    if (error) {
      console.error('Error fetching interviews:', error);
      throw error;
    }

    return data ? data.map(transformInterviewData) : [];
  } catch (error) {
    console.error('Error in getInterviews:', error);
    throw error;
  }
};

// Get interview by ID
export const getInterviewById = async (id: string): Promise<Interview | null> => {
  try {
    const { data, error } = await supabase
      .from('interviews')
      .select(`
        *,
        candidate:candidates(*),
        job_description:job_descriptions(*),
        ai_agent:ai_agents(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching interview:', error);
      throw error;
    }

    return data ? transformInterviewData(data) : null;
  } catch (error) {
    console.error('Error in getInterviewById:', error);
    throw error;
  }
};

// Get interviews for a specific candidate
export const getInterviewsForCandidate = async (candidateId: string): Promise<Interview[]> => {
  try {
    const { data, error } = await supabase
      .from('interviews')
      .select(`
        *,
        candidate:candidates(*),
        job_description:job_descriptions(*),
        ai_agent:ai_agents(*)
      `)
      .eq('candidate_id', candidateId)
      .order('scheduled_at', { ascending: false });

    if (error) {
      console.error('Error fetching interviews for candidate:', error);
      throw error;
    }

    return data ? data.map(transformInterviewData) : [];
  } catch (error) {
    console.error('Error in getInterviewsForCandidate:', error);
    throw error;
  }
};

// Get interviews for a specific job description
export const getInterviewsForJob = async (jobDescriptionId: string): Promise<Interview[]> => {
  try {
    const { data, error } = await supabase
      .from('interviews')
      .select(`
        *,
        candidate:candidates(*),
        job_description:job_descriptions(*),
        ai_agent:ai_agents(*)
      `)
      .eq('job_description_id', jobDescriptionId)
      .order('scheduled_at', { ascending: false });

    if (error) {
      console.error('Error fetching interviews for job:', error);
      throw error;
    }

    return data ? data.map(transformInterviewData) : [];
  } catch (error) {
    console.error('Error in getInterviewsForJob:', error);
    throw error;
  }
};

// Create a new interview
export const createInterview = async (interviewData: InterviewForm): Promise<Interview> => {
  try {
    const { data, error } = await supabase
      .from('interviews')
      .insert({
        candidate_id: interviewData.candidateId,
        job_description_id: interviewData.jobDescriptionId,
        ai_agent_id: interviewData.aiAgentId,
        interview_type: interviewData.interviewType,
        interview_duration: interviewData.duration,
        scheduled_at: interviewData.scheduledAt,
        interview_notes: interviewData.interviewNotes || null,
        status: 'scheduled',
      })
      .select(`
        *,
        candidate:candidates(*),
        job_description:job_descriptions(*),
        ai_agent:ai_agents(*)
      `)
      .single();

    if (error) {
      console.error('Error creating interview:', error);
      throw error;
    }

    return transformInterviewData(data);
  } catch (error) {
    console.error('Error in createInterview:', error);
    throw error;
  }
};

// Update interview status
export const updateInterviewStatus = async (id: string, status: Interview['status']): Promise<Interview> => {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    // Set started_at when interview starts
    if (status === 'in_progress') {
      updateData.started_at = new Date().toISOString();
    }

    // Set completed_at when interview completes
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('interviews')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        candidate:candidates(*),
        job_description:job_descriptions(*),
        ai_agent:ai_agents(*)
      `)
      .single();

    if (error) {
      console.error('Error updating interview status:', error);
      throw error;
    }

    return transformInterviewData(data);
  } catch (error) {
    console.error('Error in updateInterviewStatus:', error);
    throw error;
  }
};

// Update interview details
export const updateInterview = async (id: string, interviewData: Partial<InterviewForm>): Promise<Interview> => {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (interviewData.candidateId !== undefined) updateData.candidate_id = interviewData.candidateId;
    if (interviewData.jobDescriptionId !== undefined) updateData.job_description_id = interviewData.jobDescriptionId;
    if (interviewData.aiAgentId !== undefined) updateData.ai_agent_id = interviewData.aiAgentId;
    if (interviewData.interviewType !== undefined) updateData.interview_type = interviewData.interviewType;
    if (interviewData.duration !== undefined) updateData.interview_duration = interviewData.duration;
    if (interviewData.scheduledAt !== undefined) updateData.scheduled_at = interviewData.scheduledAt;
    if (interviewData.interviewNotes !== undefined) updateData.interview_notes = interviewData.interviewNotes;

    const { data, error } = await supabase
      .from('interviews')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        candidate:candidates(*),
        job_description:job_descriptions(*),
        ai_agent:ai_agents(*)
      `)
      .single();

    if (error) {
      console.error('Error updating interview:', error);
      throw error;
    }

    return transformInterviewData(data);
  } catch (error) {
    console.error('Error in updateInterview:', error);
    throw error;
  }
};

// Delete an interview
export const deleteInterview = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('interviews')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting interview:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteInterview:', error);
    throw error;
  }
};

// Get interview statistics
export const getInterviewStats = async () => {
  try {
    const { data, error } = await supabase
      .from('interviews')
      .select('status');

    if (error) {
      console.error('Error fetching interview stats:', error);
      throw error;
    }

    const stats = {
      total: data?.length || 0,
      scheduled: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
    };

    data?.forEach((interview: any) => {
      if (stats.hasOwnProperty(interview.status)) {
        stats[interview.status as keyof typeof stats]++;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error in getInterviewStats:', error);
    throw error;
  }
};