import { supabase } from './supabase';
import bcrypt from 'bcryptjs';

export interface RegistrationRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  company: string;
  phone?: string;
  location?: string;
}

export interface RegistrationResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: string;
  };
  error?: string;
}

export class RegistrationService {
  // Hash password
  private static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Check if email already exists
  private static async checkEmailExists(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking email existence:', error);
      return false;
    }
  }

  // Register new user
  static async registerUser(request: RegistrationRequest): Promise<RegistrationResponse> {
    try {
      // Validate required fields
      if (!request.firstName || !request.lastName || !request.email || !request.password || !request.company) {
        return {
          success: false,
          error: 'All required fields must be filled'
        };
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(request.email)) {
        return {
          success: false,
          error: 'Please enter a valid email address'
        };
      }

      // Validate password strength
      if (request.password.length < 6) {
        return {
          success: false,
          error: 'Password must be at least 6 characters long'
        };
      }

      // Check if email already exists
      const emailExists = await this.checkEmailExists(request.email);
      if (emailExists) {
        return {
          success: false,
          error: 'An account with this email already exists'
        };
      }

      // Hash password
      const hashedPassword = await this.hashPassword(request.password);

      // Create user in database
      const { data, error } = await supabase
        .from('users')
        .insert({
          email: request.email,
          name: `${request.firstName} ${request.lastName}`,
          password_hash: hashedPassword,
          role: 'recruiter', // Default role for new registrations
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating user:', error);
        return {
          success: false,
          error: 'Failed to create account. Please try again.'
        };
      }

      // Return success response (without password hash)
      return {
        success: true,
        user: {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role,
          createdAt: data.created_at
        }
      };

    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.'
      };
    }
  }

  // Verify user account (for admin approval)
  static async verifyUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error verifying user:', error);
        return {
          success: false,
          error: 'Failed to verify user account'
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Verification error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred'
      };
    }
  }

  // Get pending registrations (for admin review)
  static async getPendingRegistrations(): Promise<{ data: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting pending registrations:', error);
        return {
          data: [],
          error: 'Failed to get pending registrations'
        };
      }

      return { data: data || [] };
    } catch (error) {
      console.error('Error getting pending registrations:', error);
      return {
        data: [],
        error: 'An unexpected error occurred'
      };
    }
  }
}
