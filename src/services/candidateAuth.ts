import { supabase } from './supabase';
import { CandidateUser, CandidateLoginRequest, CandidateAuthResponse } from '../types';

export class CandidateAuthService {
  // Hash password (simple implementation - in production, use bcrypt)
  private static hashPassword(password: string): string {
    // Simple hash for development - replace with bcrypt in production
    return btoa(password + 'candidate_salt_2024');
  }

  // Verify password
  private static verifyPassword(password: string, hash: string): boolean {
    const hashedPassword = this.hashPassword(password);
    return hashedPassword === hash;
  }

  // Generate random password
  static generatePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  // Generate username from name
  static generateUsername(name: string): string {
    const words = name.toLowerCase().split(' ').filter(word => word.length > 0);
    if (words.length >= 2) {
      return `${words[0]}.${words[1]}`;
    } else if (words.length === 1) {
      return words[0];
    }
    return 'candidate';
  }

  // Set candidate credentials
  static async setCandidateCredentials(
    candidateId: string, 
    username: string, 
    password: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const passwordHash = this.hashPassword(password);
      
      const { error } = await supabase
        .from('candidates')
        .update({
          username: username,
          password_hash: passwordHash,
          credentials_generated: true,
          credentials_generated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', candidateId);

      if (error) {
        console.error('Error setting candidate credentials:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in setCandidateCredentials:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to set credentials' 
      };
    }
  }

  // Authenticate candidate with simplified credentials (username and password only)
  static async authenticateCandidateSimple(username: string, password: string): Promise<CandidateAuthResponse> {
    try {
      // Find candidate by username only
      const { data: candidate, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('username', username)
        .single();

      if (error || !candidate) {
        return { 
          candidate: null, 
          error: 'Invalid username or password. Please check your credentials.' 
        };
      }

      // Verify password
      if (!candidate.password_hash || !this.verifyPassword(password, candidate.password_hash)) {
        return { 
          candidate: null, 
          error: 'Invalid username or password. Please check your credentials.' 
        };
      }

      // Check if candidate is active
      if (candidate.status !== 'active') {
        return { 
          candidate: null, 
          error: 'Your account is not active. Please contact support.' 
        };
      }

      // Check if credentials were generated
      if (!candidate.credentials_generated) {
        return { 
          candidate: null, 
          error: 'Interview credentials have not been generated yet. Please contact support.' 
        };
      }

      // Update last login
      await supabase
        .from('candidates')
        .update({ 
          updated_at: new Date().toISOString() 
        })
        .eq('id', candidate.id);

      // Return candidate user object
      const candidateUser: CandidateUser = {
        id: candidate.id,
        candidate_id: candidate.candidate_id,
        email: candidate.email,
        name: candidate.name,
        phone: candidate.phone,
        contact_number: candidate.contact_number,
        username: candidate.username,
        primaryJobDescriptionId: candidate.primary_job_description_id,
        interviewId: candidate.interview_id,
        interview_id: candidate.interview_id,
        status: candidate.status,
        createdAt: candidate.created_at,
        lastLogin: new Date().toISOString()
      };

      return { candidate: candidateUser, error: null };
    } catch (error) {
      console.error('Error in authenticateCandidateSimple:', error);
      return { 
        candidate: null, 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      };
    }
  }

  // Authenticate candidate (original method with full validation)
  static async authenticateCandidate(loginData: CandidateLoginRequest): Promise<CandidateAuthResponse> {
    try {
      // First, find candidate by username and verify basic info
      const { data: candidate, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('username', loginData.username)
        .eq('email', loginData.email.toLowerCase())
        .eq('name', loginData.name)
        .single();

      if (error || !candidate) {
        return { 
          candidate: null, 
          error: 'Invalid credentials. Please check your information and try again.' 
        };
      }

      // Verify contact number (flexible matching)
      const candidateContact = candidate.contact_number || candidate.phone || '';
      const loginContact = loginData.contact_number.replace(/\D/g, '');
      const candidateContactClean = candidateContact.replace(/\D/g, '');
      
      if (candidateContactClean && !candidateContactClean.includes(loginContact.slice(-4))) {
        return { 
          candidate: null, 
          error: 'Contact number does not match our records.' 
        };
      }

      // Verify password
      if (!candidate.password_hash || !this.verifyPassword(loginData.password, candidate.password_hash)) {
        return { 
          candidate: null, 
          error: 'Invalid password. Please check your credentials.' 
        };
      }

      // Check if candidate is active
      if (candidate.status !== 'active') {
        return { 
          candidate: null, 
          error: 'Your account is not active. Please contact support.' 
        };
      }

      // Check if credentials were generated
      if (!candidate.credentials_generated) {
        return { 
          candidate: null, 
          error: 'Interview credentials have not been generated yet. Please contact support.' 
        };
      }

      // Update last login
      await supabase
        .from('candidates')
        .update({ 
          updated_at: new Date().toISOString() 
        })
        .eq('id', candidate.id);

      // Return candidate user object
      const candidateUser: CandidateUser = {
        id: candidate.id,
        candidate_id: candidate.candidate_id,
        email: candidate.email,
        name: candidate.name,
        phone: candidate.phone,
        contact_number: candidate.contact_number,
        username: candidate.username,
        primaryJobDescriptionId: candidate.primary_job_description_id,
        interviewId: candidate.interview_id,
        interview_id: candidate.interview_id,
        status: candidate.status,
        createdAt: candidate.created_at,
        lastLogin: new Date().toISOString()
      };

      return { candidate: candidateUser, error: null };
    } catch (error) {
      console.error('Error in authenticateCandidate:', error);
      return { 
        candidate: null, 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      };
    }
  }

  // Get candidate by username
  static async getCandidateByUsername(username: string): Promise<{ data: CandidateUser | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('username', username)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      const candidateUser: CandidateUser = {
        id: data.id,
        candidate_id: data.candidate_id,
        email: data.email,
        name: data.name,
        phone: data.phone,
        contact_number: data.contact_number,
        username: data.username,
        primaryJobDescriptionId: data.primary_job_description_id,
        interviewId: data.interview_id,
        interview_id: data.interview_id,
        status: data.status,
        createdAt: data.created_at
      };

      return { data: candidateUser };
    } catch (error) {
      console.error('Error in getCandidateByUsername:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to fetch candidate' 
      };
    }
  }

  /**
   * Update candidate password
   */
  static async updateCandidatePassword(candidateId: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Hash the new password
      const hashedPassword = this.hashPassword(newPassword);

      // Update the candidate's password
      const { error } = await supabase
        .from('candidates')
        .update({ 
          password_hash: hashedPassword,
          updated_at: new Date().toISOString()
        })
        .eq('id', candidateId);

      if (error) {
        console.error('Error updating candidate password:', error);
        return { 
          success: false, 
          error: 'Failed to update password. Please try again.' 
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in updateCandidatePassword:', error);
      return { 
        success: false, 
        error: 'An unexpected error occurred. Please try again.' 
      };
    }
  }
}
