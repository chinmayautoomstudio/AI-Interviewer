import { supabase } from './supabase';

export interface JobDescription {
  id: string;
  title: string;
  description: string;
  required_skills: string[];
  preferred_skills: string[];
  experience_level: string;
  employment_type: string;
  technical_stack: string[];
  key_responsibilities: string[];
  education_requirements: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export class JobDescriptionService {
  async getJobDescriptions(): Promise<JobDescription[]> {
    const { data, error } = await supabase
      .from('job_descriptions')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as JobDescription[];
  }

  async getJobDescriptionById(id: string): Promise<JobDescription | null> {
    const { data, error } = await supabase
      .from('job_descriptions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data as JobDescription;
  }

  async createJobDescription(jobDescription: Omit<JobDescription, 'id' | 'created_at' | 'updated_at'>): Promise<JobDescription> {
    const { data, error } = await supabase
      .from('job_descriptions')
      .insert([jobDescription])
      .select()
      .single();

    if (error) throw error;
    return data as JobDescription;
  }

  async updateJobDescription(id: string, updates: Partial<JobDescription>): Promise<JobDescription> {
    const { data, error } = await supabase
      .from('job_descriptions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as JobDescription;
  }

  async deleteJobDescription(id: string): Promise<void> {
    const { error } = await supabase
      .from('job_descriptions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

export const jobDescriptionService = new JobDescriptionService();
