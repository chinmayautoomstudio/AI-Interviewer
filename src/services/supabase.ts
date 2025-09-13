import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';

// Debug logging
console.log('🔍 Supabase Config Debug:');
console.log('URL:', supabaseUrl);
console.log('Key length:', supabaseAnonKey?.length || 0);
console.log('Key starts with:', supabaseAnonKey?.substring(0, 20) || 'undefined');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Database types
export interface Database {
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'admin' | 'hr_manager' | 'recruiter';
          created_at: string;
          last_login?: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role: 'admin' | 'hr_manager' | 'recruiter';
          created_at?: string;
          last_login?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'admin' | 'hr_manager' | 'recruiter';
          created_at?: string;
          last_login?: string;
          updated_at?: string;
        };
      };
      candidates: {
        Row: {
          id: string;
          candidate_id?: string;
          email: string;
          name: string;
          phone?: string;
          contact_number?: string;
          resume_url?: string;
          resume_text?: string;
          summary?: string;
          resume_summary?: string;
          skills?: any;
          experience?: any;
          education?: any;
          projects?: any;
          status: 'active' | 'inactive' | 'archived';
          interview_id?: string;
          primary_job_description_id?: string;
          username?: string;
          password_hash?: string;
          credentials_generated?: boolean;
          credentials_generated_at?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          candidate_id?: string;
          email: string;
          name: string;
          phone?: string;
          contact_number?: string;
          resume_url?: string;
          resume_text?: string;
          summary?: string;
          resume_summary?: string;
          skills?: any;
          experience?: any;
          education?: any;
          projects?: any;
          status?: 'active' | 'inactive' | 'archived';
          interview_id?: string;
          primary_job_description_id?: string;
          username?: string;
          password_hash?: string;
          credentials_generated?: boolean;
          credentials_generated_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          email?: string;
          name?: string;
          phone?: string;
          contact_number?: string;
          resume_url?: string;
          resume_text?: string;
          summary?: string;
          resume_summary?: string;
          skills?: any;
          experience?: any;
          education?: any;
          projects?: any;
          status?: 'active' | 'inactive' | 'archived';
          interview_id?: string;
          primary_job_description_id?: string;
          username?: string;
          password_hash?: string;
          credentials_generated?: boolean;
          credentials_generated_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      interviews: {
        Row: {
          id: string;
          candidate_id: string;
          job_description_id: string;
          duration: number;
          status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
          scheduled_at: string;
          started_at?: string;
          completed_at?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          job_description_id: string;
          duration: number;
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
          scheduled_at: string;
          started_at?: string;
          completed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          job_description_id?: string;
          duration?: number;
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
          scheduled_at?: string;
          started_at?: string;
          completed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      interview_results: {
        Row: {
          id: string;
          interview_id: string;
          overall_score: number;
          communication_score: number;
          technical_score: number;
          adaptability_score: number;
          transcript: string;
          evaluation: string;
          recommendations: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          interview_id: string;
          overall_score: number;
          communication_score: number;
          technical_score: number;
          adaptability_score: number;
          transcript: string;
          evaluation: string;
          recommendations: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          interview_id?: string;
          overall_score?: number;
          communication_score?: number;
          technical_score?: number;
          adaptability_score?: number;
          transcript?: string;
          evaluation?: string;
          recommendations?: string[];
          created_at?: string;
        };
      };
      job_descriptions: {
        Row: {
          id: string;
          title: string;
          description: string;
          jd_summary?: string;
          requirements: string[];
          skills: string[];
          experience: string;
          location?: string;
          department: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          jd_summary?: string;
          requirements: string[];
          skills: string[];
          experience: string;
          location?: string;
          department: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          jd_summary?: string;
          requirements?: string[];
          skills?: string[];
          experience?: string;
          location?: string;
          department?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
