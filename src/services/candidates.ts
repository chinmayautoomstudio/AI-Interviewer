import { supabase } from './supabase';
import { Candidate } from '../types';

export interface CandidatesResponse {
  data: Candidate[];
  error?: string;
}

export class CandidatesService {
  // Get all candidates
  static async getCandidates(): Promise<CandidatesResponse> {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching candidates:', error);
        return { data: [], error: error.message };
      }

      // Transform data to match our Candidate interface
      const candidates: Candidate[] = data.map(candidate => ({
        id: candidate.id,
        candidate_id: candidate.candidate_id,
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        contact_number: candidate.contact_number,
        resume: candidate.resume_url,
        resumeUrl: candidate.resume_url,
        resume_url: candidate.resume_url,
        resumeText: candidate.resume_text,
        resume_text: candidate.resume_text,
        summary: candidate.summary,
        skills: candidate.skills,
        experience: candidate.experience,
        education: candidate.education,
        projects: candidate.projects,
        status: candidate.status,
        interviewId: candidate.interview_id,
        interview_id: candidate.interview_id,
        primaryJobDescriptionId: candidate.primary_job_description_id,
        createdAt: candidate.created_at,
        created_at: candidate.created_at,
        updatedAt: candidate.updated_at,
        updated_at: candidate.updated_at,
      }));

      return { data: candidates };
    } catch (error) {
      console.error('Error fetching candidates:', error);
      return { 
        data: [], 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get enhanced candidate data with statistics
  static async getCandidatesWithStats(): Promise<CandidatesResponse> {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching candidates:', error);
        return { data: [], error: error.message };
      }

      if (!data) return { data: [] };

      // Transform candidates and add statistics
      const candidates = await Promise.all(
        data.map(async (candidateData) => {
          const candidate: Candidate = {
            id: candidateData.id,
            candidate_id: candidateData.candidate_id,
            name: candidateData.name,
            email: candidateData.email,
            phone: candidateData.phone,
            contact_number: candidateData.contact_number,
            resume: candidateData.resume_url,
            resumeUrl: candidateData.resume_url,
            resume_url: candidateData.resume_url,
            resumeText: candidateData.resume_text,
            resume_text: candidateData.resume_text,
            summary: candidateData.summary,
            skills: candidateData.skills,
            experience: candidateData.experience,
            education: candidateData.education,
            projects: candidateData.projects,
            status: candidateData.status,
            interviewId: candidateData.interview_id,
            interview_id: candidateData.interview_id,
            primaryJobDescriptionId: candidateData.primary_job_description_id,
            createdAt: candidateData.created_at,
            created_at: candidateData.created_at,
            updatedAt: candidateData.updated_at,
            updated_at: candidateData.updated_at,
          };

          // Get job applications for this candidate
          const { data: applications } = await supabase
            .from('candidate_job_applications')
            .select(`
              *,
              job_description:job_descriptions(title, department, location)
            `)
            .eq('candidate_id', candidate.id);

          // Get interview sessions for this candidate
          const { data: interviews } = await supabase
            .from('interview_sessions')
            .select('*')
            .eq('candidate_id', candidate.id);

          // Get interview reports for this candidate
          const { data: reports } = await supabase
            .from('interview_reports')
            .select(`
              overall_score, 
              created_at,
              interview_sessions!inner(candidate_id)
            `)
            .eq('interview_sessions.candidate_id', candidate.id)
            .order('created_at', { ascending: false });

          // Calculate statistics
          const appliedJobs = applications?.map(app => app.job_description?.title).filter(Boolean) || [];
          const interviewCount = interviews?.length || 0;
          const averageScore = reports && reports.length > 0 
            ? reports.reduce((sum, report) => sum + (report.overall_score || 0), 0) / reports.length / 10 // Convert from percentage to score out of 10
            : null;
          const lastInterviewDate = reports && reports.length > 0 ? reports[0].created_at : null;

          // Debug logging
          if (candidate.name && reports && reports.length > 0) {
            console.log(`📊 Candidate ${candidate.name}:`, {
              reportsCount: reports.length,
              rawScores: reports.map(r => r.overall_score),
              averageScore: averageScore,
              interviewCount: interviewCount
            });
          }

          // Add statistics to candidate object
          return {
            ...candidate,
            appliedJobs,
            interviewCount,
            averageScore,
            lastInterviewDate,
            applicationCount: applications?.length || 0,
            hasInterviews: interviewCount > 0,
            latestApplicationStatus: applications && applications.length > 0 ? applications[0].application_status : null
          };
        })
      );

      return { data: candidates };
    } catch (error) {
      console.error('Error in getCandidatesWithStats:', error);
      return { 
        data: [], 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get candidate by ID
  static async getCandidateById(id: string): Promise<{ data: Candidate | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching candidate:', error);
        return { data: null, error: error.message };
      }

      const candidate: Candidate = {
        id: data.id,
        candidate_id: data.candidate_id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        contact_number: data.contact_number,
        resume: data.resume_url,
        resumeUrl: data.resume_url,
        resume_url: data.resume_url,
        resumeText: data.resume_text,
        resume_text: data.resume_text,
        summary: data.summary,
        skills: data.skills,
        experience: data.experience,
        education: data.education,
        projects: data.projects,
        status: data.status,
        interviewId: data.interview_id,
        interview_id: data.interview_id,
        primaryJobDescriptionId: data.primary_job_description_id,
        createdAt: data.created_at,
        created_at: data.created_at,
        updatedAt: data.updated_at,
        updated_at: data.updated_at,
      };

      return { data: candidate };
    } catch (error) {
      console.error('Error fetching candidate:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Update candidate status
  static async updateCandidateStatus(id: string, status: Candidate['status']): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('candidates')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating candidate status:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating candidate status:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Update candidate's primary job description ID
  static async updateCandidatePrimaryJob(id: string, jobDescriptionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('candidates')
        .update({ 
          primary_job_description_id: jobDescriptionId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating candidate primary job:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in updateCandidatePrimaryJob:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update candidate primary job' 
      };
    }
  }

  // Update candidate details
  static async updateCandidate(id: string, updates: Partial<Candidate>): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Map frontend fields to database fields
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.phone !== undefined) {
        updateData.phone = updates.phone;
        updateData.contact_number = updates.phone; // Also update contact_number
      }
      if (updates.summary !== undefined) updateData.summary = updates.summary;
      if (updates.skills !== undefined) updateData.skills = updates.skills;
      if (updates.experience !== undefined) updateData.experience = updates.experience;
      if (updates.education !== undefined) updateData.education = updates.education;
      if (updates.projects !== undefined) updateData.projects = updates.projects;
      if (updates.status !== undefined) updateData.status = updates.status;

      const { error } = await supabase
        .from('candidates')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating candidate:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating candidate:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Search candidates
  static async searchCandidates(query: string): Promise<CandidatesResponse> {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .or(`name.ilike.%${query}%, email.ilike.%${query}%, phone.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching candidates:', error);
        return { data: [], error: error.message };
      }

      const candidates: Candidate[] = data.map(candidate => ({
        id: candidate.id,
        candidate_id: candidate.candidate_id,
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        contact_number: candidate.contact_number,
        resume: candidate.resume_url,
        resumeUrl: candidate.resume_url,
        resume_url: candidate.resume_url,
        resumeText: candidate.resume_text,
        resume_text: candidate.resume_text,
        summary: candidate.summary,
        skills: candidate.skills,
        experience: candidate.experience,
        education: candidate.education,
        projects: candidate.projects,
        status: candidate.status,
        interviewId: candidate.interview_id,
        interview_id: candidate.interview_id,
        createdAt: candidate.created_at,
        created_at: candidate.created_at,
        updatedAt: candidate.updated_at,
        updated_at: candidate.updated_at,
      }));

      return { data: candidates };
    } catch (error) {
      console.error('Error searching candidates:', error);
      return { 
        data: [], 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Delete candidate
  static async deleteCandidate(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting candidate:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting candidate:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete candidate' 
      };
    }
  }
}

// Export individual functions for easier use
export const getCandidateById = async (id: string): Promise<Candidate> => {
  // First try to find by custom candidate_id
  try {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('candidate_id', id)
      .single();

    if (!error && data) {
      const candidate: Candidate = {
        id: data.id,
        candidate_id: data.candidate_id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        contact_number: data.contact_number,
        resume: data.resume_url,
        resumeUrl: data.resume_url,
        resume_url: data.resume_url,
        resumeText: data.resume_text,
        resume_text: data.resume_text,
        summary: data.summary,
        skills: data.skills,
        experience: data.experience,
        education: data.education,
        projects: data.projects,
        status: data.status,
        interviewId: data.interview_id,
        interview_id: data.interview_id,
        primaryJobDescriptionId: data.primary_job_description_id,
        createdAt: data.created_at,
        created_at: data.created_at,
        updatedAt: data.updated_at,
        updated_at: data.updated_at,
      };
      return candidate;
    }
  } catch (error) {
    console.log('Not found by candidate_id, trying by Supabase ID...');
  }

  // If not found by custom ID, try by Supabase UUID
  const result = await CandidatesService.getCandidateById(id);
  if (result.error || !result.data) {
    throw new Error(result.error || 'Candidate not found');
  }
  return result.data;
};

export const getCandidates = async (): Promise<Candidate[]> => {
  const result = await CandidatesService.getCandidates();
  if (result.error) {
    throw new Error(result.error);
  }
  return result.data;
};

export const deleteCandidate = async (id: string): Promise<void> => {
  const result = await CandidatesService.deleteCandidate(id);
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete candidate');
  }
};