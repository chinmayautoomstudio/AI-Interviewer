import { supabase } from './supabase';
import { JobDescription, CreateJobDescriptionRequest } from '../types';

export interface JobDescriptionResponse {
  data: JobDescription[];
  error?: string;
}


export class JobDescriptionsService {
  // Get job descriptions that have approved questions
  static async getJobDescriptionsWithQuestions(): Promise<JobDescriptionResponse> {
    try {
      // First, get all job descriptions
      const { data: allJobs, error: jobsError } = await supabase
        .from('job_descriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (jobsError) {
        console.error('❌ JobDescriptionsService: Error fetching job descriptions:', jobsError);
        return { data: [], error: jobsError.message };
      }

      // Get job description IDs that have approved questions
      const { data: jobsWithQuestions, error: questionsError } = await supabase
        .from('exam_questions')
        .select('job_description_id')
        .eq('status', 'approved')
        .eq('is_active', true);

      if (questionsError) {
        console.error('❌ JobDescriptionsService: Error fetching questions:', questionsError);
        return { data: [], error: questionsError.message };
      }

      // Create a set of job description IDs that have questions
      const jobIdsWithQuestions = new Set(
        jobsWithQuestions?.map(q => q.job_description_id) || []
      );

      // Filter job descriptions to only include those with questions
      const filteredJobs = allJobs?.filter(job => jobIdsWithQuestions.has(job.id)) || [];

      // Helper function to ensure array fields are properly formatted
      const ensureArray = (field: any): string[] => {
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

      // Transform data to match our JobDescription interface
      const jobDescriptions: JobDescription[] = filteredJobs.map(job => ({
        id: job.id,
        job_description_id: job.job_description_id,
        title: job.title,
        department: job.department,
        location: job.location,
        employmentType: job.employment_type,
        experienceLevel: job.experience_level,
        salaryRange: (job.salary_min !== null && job.salary_min !== undefined && job.salary_max !== null && job.salary_max !== undefined) ? {
          min: job.salary_min,
          max: job.salary_max,
          currency: job.currency || 'INR'
        } : undefined,
        description: job.description,
        requirements: ensureArray(job.requirements),
        responsibilities: ensureArray(job.responsibilities),
        benefits: ensureArray(job.benefits),
        skills: ensureArray(job.skills),
        qualifications: ensureArray(job.qualifications),
        status: job.status,
        createdBy: job.created_by,
        createdAt: job.created_at,
        updatedAt: job.updated_at,
        publishedAt: job.published_at,
        // Additional fields
        companyName: job.company_name,
        workMode: job.work_mode,
        jobCategory: job.job_category,
        contactEmail: job.contact_email,
        applicationDeadline: job.application_deadline,
      }));

      console.log(`✅ JobDescriptionsService: Found ${jobDescriptions.length} job descriptions with questions`);
      return { data: jobDescriptions };
    } catch (error) {
      console.error('❌ JobDescriptionsService: Unexpected error:', error);
      return { data: [], error: 'An unexpected error occurred' };
    }
  }

  // Get all job descriptions
  static async getJobDescriptions(): Promise<JobDescriptionResponse> {
    try {
      const { data, error } = await supabase
        .from('job_descriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ JobDescriptionsService: Error fetching job descriptions:', error);
        return { data: [], error: error.message };
      }

      // Helper function to ensure array fields are properly formatted
      const ensureArray = (field: any): string[] => {
        if (!field) return [];
        if (Array.isArray(field)) return field;
        if (typeof field === 'string') {
          // If it's a string, try to parse as JSON first
          try {
            const parsed = JSON.parse(field);
            return Array.isArray(parsed) ? parsed : [field];
          } catch {
            // If not JSON, treat as single item array
            return [field];
          }
        }
        return [];
      };

      // Transform data to match our JobDescription interface
      const jobDescriptions: JobDescription[] = data.map(job => ({
        id: job.id,
        job_description_id: job.job_description_id,
        title: job.title,
        department: job.department,
        location: job.location,
        employmentType: job.employment_type,
        experienceLevel: job.experience_level,
        salaryRange: (job.salary_min !== null && job.salary_min !== undefined && job.salary_max !== null && job.salary_max !== undefined) ? {
          min: job.salary_min,
          max: job.salary_max,
          currency: job.currency || 'INR'
        } : undefined,
        description: job.description,
        requirements: ensureArray(job.requirements),
        responsibilities: ensureArray(job.responsibilities),
        benefits: ensureArray(job.benefits),
        skills: ensureArray(job.skills),
        qualifications: ensureArray(job.qualifications),
        status: job.status,
        createdBy: job.created_by,
        createdAt: job.created_at,
        updatedAt: job.updated_at,
        publishedAt: job.published_at,
        // Additional fields
        companyName: job.company_name,
        workMode: job.work_mode,
        jobCategory: job.job_category,
        contactEmail: job.contact_email,
        applicationDeadline: job.application_deadline,
      }));

      // Return transformed job descriptions

      return { data: jobDescriptions };
    } catch (error) {
      console.error('Error fetching job descriptions:', error);
      return { 
        data: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch job descriptions' 
      };
    }
  }

  // Get job description by ID
  static async getJobDescriptionById(id: string): Promise<{ data: JobDescription | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('job_descriptions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching job description:', error);
        return { data: null, error: error.message };
      }

      // Helper function to ensure array fields are properly formatted
      const ensureArray = (field: any): string[] => {
        if (!field) return [];
        if (Array.isArray(field)) return field;
        if (typeof field === 'string') {
          // If it's a string, try to parse as JSON first
          try {
            const parsed = JSON.parse(field);
            return Array.isArray(parsed) ? parsed : [field];
          } catch {
            // If not JSON, treat as single item array
            return [field];
          }
        }
        return [];
      };

      const jobDescription: JobDescription = {
        id: data.id,
        job_description_id: data.job_description_id,
        title: data.title,
        department: data.department,
        location: data.location,
        employmentType: data.employment_type,
        experienceLevel: data.experience_level,
        salaryRange: (data.salary_min !== null && data.salary_min !== undefined && data.salary_max !== null && data.salary_max !== undefined) ? {
          min: data.salary_min,
          max: data.salary_max,
          currency: data.currency || 'INR'
        } : undefined,
        description: data.description,
        requirements: ensureArray(data.requirements),
        responsibilities: ensureArray(data.responsibilities),
        benefits: ensureArray(data.benefits),
        skills: ensureArray(data.skills),
        qualifications: ensureArray(data.qualifications),
        status: data.status,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        publishedAt: data.published_at,
        // Additional fields
        companyName: data.company_name,
        workMode: data.work_mode,
        jobCategory: data.job_category,
        contactEmail: data.contact_email,
        applicationDeadline: data.application_deadline,
      };

      return { data: jobDescription };
    } catch (error) {
      console.error('Error fetching job description:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to fetch job description' 
      };
    }
  }

  // Create new job description
  static async createJobDescription(jobData: CreateJobDescriptionRequest): Promise<{ data: JobDescription | null; error?: string }> {
    try {
      // Generate job description ID in format AS-WDT-7019
      const generateJobDescriptionId = (title: string): string => {
        // Extract abbreviation from title (e.g., "Web Developer Trainee" -> "WDT")
        const words = title.split(' ').filter(word => word.length > 0);
        let abbreviation = '';
        
        if (words.length >= 2) {
          // Take first letter of first two words
          abbreviation = words.slice(0, 2).map(word => word.charAt(0).toUpperCase()).join('');
        } else if (words.length === 1) {
          // Take first 3 letters if only one word
          abbreviation = words[0].substring(0, 3).toUpperCase();
        } else {
          abbreviation = 'JD';
        }
        
        // Generate timestamp-based number (last 4 digits)
        const timestamp = Date.now().toString().slice(-4);
        return `AS-${abbreviation}-${timestamp}`;
      };

      const jobDescriptionId = generateJobDescriptionId(jobData.title);

      const { data, error } = await supabase
        .from('job_descriptions')
        .insert({
          job_description_id: jobDescriptionId,
          title: jobData.title,
          department: jobData.department,
          location: jobData.location,
          employment_type: jobData.employmentType,
          experience_level: jobData.experienceLevel,
          salary_min: jobData.salaryRange?.min,
          salary_max: jobData.salaryRange?.max,
          currency: jobData.salaryRange?.currency || 'INR',
          description: jobData.description,
          requirements: jobData.requirements,
          responsibilities: jobData.responsibilities,
          benefits: jobData.benefits,
          skills: jobData.skills,
          qualifications: jobData.qualifications,
          status: jobData.status || 'active',
          created_by: (await supabase.auth.getUser()).data.user?.id || null,
          // Additional fields
          company_name: jobData.companyName,
          work_mode: jobData.workMode,
          job_category: jobData.jobCategory,
          contact_email: jobData.contactEmail,
          application_deadline: jobData.applicationDeadline && jobData.applicationDeadline.trim() !== '' ? jobData.applicationDeadline : null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating job description:', error);
        return { data: null, error: error.message };
      }

      const jobDescription: JobDescription = {
        id: data.id,
        job_description_id: data.job_description_id,
        title: data.title,
        department: data.department,
        location: data.location,
        employmentType: data.employment_type,
        experienceLevel: data.experience_level,
        salaryRange: (data.salary_min !== null && data.salary_min !== undefined && data.salary_max !== null && data.salary_max !== undefined) ? {
          min: data.salary_min,
          max: data.salary_max,
          currency: data.currency || 'INR'
        } : undefined,
        description: data.description,
        requirements: data.requirements || [],
        responsibilities: data.responsibilities || [],
        benefits: data.benefits || [],
        skills: data.skills || [],
        qualifications: data.qualifications || [],
        status: data.status,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        publishedAt: data.published_at,
        // Additional fields
        companyName: data.company_name,
        workMode: data.work_mode,
        jobCategory: data.job_category,
        contactEmail: data.contact_email,
        applicationDeadline: data.application_deadline,
      };

      return { data: jobDescription };
    } catch (error) {
      console.error('Error creating job description:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to create job description' 
      };
    }
  }

  /**
   * Create job description from enhanced AI parser response
   */
  static async createJobDescriptionFromParser(parserResponse: any): Promise<{ data: JobDescription | null; error?: string }> {
    try {
      if (!parserResponse.success || !parserResponse.data) {
        return {
          data: null,
          error: 'Invalid parser response'
        };
      }

      const parsedData = parserResponse.data;
      
      // Generate job description ID
      const generateJobDescriptionId = (title: string): string => {
        const words = title.trim().split(' ');
        let abbreviation = 'JD';
        
        if (words.length >= 2) {
          abbreviation = words[0].charAt(0).toUpperCase() + words[1].charAt(0).toUpperCase();
        } else if (words.length === 1) {
          abbreviation = words[0].substring(0, 3).toUpperCase();
        }
        
        const timestamp = Date.now().toString().slice(-4);
        return `AS-${abbreviation}-${timestamp}`;
      };

      const jobDescriptionId = generateJobDescriptionId(parsedData.job_title);

      const { data, error } = await supabase
        .from('job_descriptions')
        .insert({
          job_description_id: jobDescriptionId,
          title: parsedData.job_title,
          department: parsedData.department,
          location: parsedData.location,
          employment_type: parsedData.employment_type,
          experience_level: parsedData.experience_level,
          work_mode: parsedData.work_mode,
          salary_range: parsedData.salary_range,
          description: parsedData.job_summary, // Use the comprehensive summary as description
          jd_summary: parsedData.job_summary,
          requirements: parsedData.required_skills || [],
          responsibilities: parsedData.key_responsibilities || [],
          benefits: parsedData.benefits || [],
          skills: parsedData.technical_stack || [],
          qualifications: parsedData.qualifications?.minimum || [],
          status: 'active',
          created_by: (await supabase.auth.getUser()).data.user?.id || null,
          // Enhanced structured fields
          key_responsibilities: parsedData.key_responsibilities || [],
          required_skills: parsedData.required_skills || [],
          preferred_skills: parsedData.preferred_skills || [],
          technical_stack: parsedData.technical_stack || [],
          education_requirements: parsedData.education_requirements,
          company_culture: parsedData.company_culture,
          growth_opportunities: parsedData.growth_opportunities,
          qualifications_minimum: parsedData.qualifications?.minimum || [],
          qualifications_preferred: parsedData.qualifications?.preferred || [],
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating job description from parser:', error);
        return { data: null, error: error.message };
      }

      const jobDescription: JobDescription = {
        id: data.id,
        job_description_id: data.job_description_id,
        title: data.title,
        department: data.department,
        location: data.location,
        employmentType: data.employment_type,
        experienceLevel: data.experience_level,
        salary_range: data.salary_range,
        description: data.description,
        jd_summary: data.jd_summary,
        requirements: data.requirements || [],
        responsibilities: data.responsibilities || [],
        benefits: data.benefits || [],
        skills: data.skills || [],
        qualifications: data.qualifications || [],
        status: data.status,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        publishedAt: data.published_at,
        // Enhanced structured fields from AI parser
        key_responsibilities: data.key_responsibilities || [],
        required_skills: data.required_skills || [],
        preferred_skills: data.preferred_skills || [],
        technical_stack: data.technical_stack || [],
        education_requirements: data.education_requirements,
        company_culture: data.company_culture,
        growth_opportunities: data.growth_opportunities,
        qualifications_minimum: data.qualifications_minimum || [],
        qualifications_preferred: data.qualifications_preferred || [],
      };

      return { data: jobDescription };
    } catch (error) {
      console.error('Error creating job description from parser:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to create job description from parser' 
      };
    }
  }

  // Update job description
  static async updateJobDescription(id: string, jobData: Partial<CreateJobDescriptionRequest>): Promise<{ data: JobDescription | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('job_descriptions')
        .update({
          title: jobData.title,
          department: jobData.department,
          location: jobData.location,
          employment_type: jobData.employmentType,
          experience_level: jobData.experienceLevel,
          salary_min: jobData.salaryRange?.min,
          salary_max: jobData.salaryRange?.max,
          currency: jobData.salaryRange?.currency || 'INR',
          description: jobData.description,
          requirements: jobData.requirements,
          responsibilities: jobData.responsibilities,
          benefits: jobData.benefits,
          skills: jobData.skills,
          qualifications: jobData.qualifications,
          status: jobData.status,
          updated_at: new Date().toISOString(),
          // Additional fields
          company_name: jobData.companyName,
          work_mode: jobData.workMode,
          job_category: jobData.jobCategory,
          contact_email: jobData.contactEmail,
          application_deadline: jobData.applicationDeadline && jobData.applicationDeadline.trim() !== '' ? jobData.applicationDeadline : null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating job description:', error);
        return { data: null, error: error.message };
      }

      const jobDescription: JobDescription = {
        id: data.id,
        job_description_id: data.job_description_id,
        title: data.title,
        department: data.department,
        location: data.location,
        employmentType: data.employment_type,
        experienceLevel: data.experience_level,
        salaryRange: (data.salary_min !== null && data.salary_min !== undefined && data.salary_max !== null && data.salary_max !== undefined) ? {
          min: data.salary_min,
          max: data.salary_max,
          currency: data.currency || 'INR'
        } : undefined,
        description: data.description,
        requirements: data.requirements || [],
        responsibilities: data.responsibilities || [],
        benefits: data.benefits || [],
        skills: data.skills || [],
        qualifications: data.qualifications || [],
        status: data.status,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        publishedAt: data.published_at,
        // Additional fields
        companyName: data.company_name,
        workMode: data.work_mode,
        jobCategory: data.job_category,
        contactEmail: data.contact_email,
        applicationDeadline: data.application_deadline,
      };

      return { data: jobDescription };
    } catch (error) {
      console.error('Error updating job description:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to update job description' 
      };
    }
  }

  // Delete job description
  static async deleteJobDescription(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('job_descriptions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting job description:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting job description:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete job description' 
      };
    }
  }
}

// Export individual functions for easier use
export const getJobDescriptions = async (): Promise<JobDescription[]> => {
  const result = await JobDescriptionsService.getJobDescriptions();
  if (result.error) {
    throw new Error(result.error);
  }
  return result.data;
};

export const getJobDescriptionById = async (id: string): Promise<JobDescription> => {
  const result = await JobDescriptionsService.getJobDescriptionById(id);
  if (result.error || !result.data) {
    throw new Error(result.error || 'Job description not found');
  }
  return result.data;
};

export const createJobDescription = async (jobData: CreateJobDescriptionRequest): Promise<JobDescription> => {
  const result = await JobDescriptionsService.createJobDescription(jobData);
  if (result.error || !result.data) {
    throw new Error(result.error || 'Failed to create job description');
  }
  return result.data;
};

export const updateJobDescription = async (id: string, jobData: Partial<CreateJobDescriptionRequest>): Promise<JobDescription> => {
  const result = await JobDescriptionsService.updateJobDescription(id, jobData);
  if (result.error || !result.data) {
    throw new Error(result.error || 'Failed to update job description');
  }
  return result.data;
};

export const deleteJobDescription = async (id: string): Promise<void> => {
  const result = await JobDescriptionsService.deleteJobDescription(id);
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete job description');
  }
};
