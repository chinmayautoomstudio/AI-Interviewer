import { supabase } from './supabase';
import { User } from '../types';
import { TwoFactorAuthService } from './twoFactorAuth';

export interface AuthResponse {
  user: User | null;
  error: string | null;
  requiresTwoFactor?: boolean;
  verificationCode?: string;
}

export interface TwoFactorAuthResponse {
  success: boolean;
  error?: string;
  user?: User;
}

export class AuthService {
  // Development credentials for testing
  private static readonly DEV_CREDENTIALS = {
    'chinmay.nayak@autoomstudio.com': {
      password: 'Chinmay@2000',
      user: {
        id: 'dev-user-1',
        email: 'chinmay.nayak@autoomstudio.com',
        name: 'Chinmay Nayak',
        role: 'admin' as const,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      }
    },
    'awsadmin@test.com': {
      password: 'AWSAdmin@2025',
      user: {
        id: 'dev-user-2',
        email: 'awsadmin@test.com',
        name: 'AWS Admin',
        role: 'admin' as const,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      }
    },
    'admin@test.com': {
      password: 'Admin@2025',
      user: {
        id: 'dev-user-3',
        email: 'admin@test.com',
        name: 'Admin Dashboard',
        role: 'admin' as const,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      }
    },
    'dillip.sahoo@autoomstudio.com': {
      password: 'Dillip@ut00m',
      user: {
        id: 'dev-user-4',
        email: 'dillip.sahoo@autoomstudio.com',
        name: 'Dillip Sahoo',
        role: 'admin' as const,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      }
    },
    'aditya.sahoo@autoomstudio.com': {
      password: 'Aditya@ut00m',
      user: {
        id: 'dev-user-5',
        email: 'aditya.sahoo@autoomstudio.com',
        name: 'Aditya Sahoo',
        role: 'admin' as const,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      }
    },
    'udit.sahoo@autoomstudio.com': {
      password: 'Udit@ut00m',
      user: {
        id: 'dev-user-6',
        email: 'udit.sahoo@autoomstudio.com',
        name: 'Udit Sahoo',
        role: 'admin' as const,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      }
    }
  };

  // Admin authentication with 2FA support
  static async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      // Check development credentials first (for testing)
      if (this.DEV_CREDENTIALS[email as keyof typeof this.DEV_CREDENTIALS]) {
        const devCreds = this.DEV_CREDENTIALS[email as keyof typeof this.DEV_CREDENTIALS];
        
        if (devCreds.password === password) {
          // Check if 2FA is enabled for dev user
          const isTwoFactorEnabled = await TwoFactorAuthService.isTwoFactorEnabled(email);
          
          if (isTwoFactorEnabled) {
            // Generate verification code for 2FA
            const twoFactorResult = await TwoFactorAuthService.generateVerificationCode(email, devCreds.user.id);
            
            if (twoFactorResult.success) {
              return { 
                user: null, 
                error: null, 
                requiresTwoFactor: true,
                verificationCode: twoFactorResult.verificationCode // For development only
              };
            } else {
              return { user: null, error: 'Failed to send verification code' };
            }
          }
          
          return { user: devCreds.user, error: null };
        } else {
          return { user: null, error: 'Invalid password' };
        }
      }

      // Use Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (data.user) {
        // Get admin user details
        const { data: adminUser, error: adminError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single();

        if (adminError) {
          return { user: null, error: 'Admin user not found' };
        }

        // Check if 2FA is enabled
        const isTwoFactorEnabled = await TwoFactorAuthService.isTwoFactorEnabled(email);
        
        if (isTwoFactorEnabled) {
          // Generate verification code for 2FA
          const twoFactorResult = await TwoFactorAuthService.generateVerificationCode(email, adminUser.id);
          
          if (twoFactorResult.success) {
            return { 
              user: null, 
              error: null, 
              requiresTwoFactor: true,
              verificationCode: twoFactorResult.verificationCode // For development only
            };
          } else {
            return { user: null, error: 'Failed to send verification code' };
          }
        }

        // Update last login
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', adminUser.id);

        const user: User = {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role,
          createdAt: adminUser.created_at,
          lastLogin: adminUser.last_login,
        };

        return { user, error: null };
      }

      return { user: null, error: 'Authentication failed' };
    } catch (error) {
      return { user: null, error: 'An unexpected error occurred' };
    }
  }

  // Sign out
  static async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      return { error: error?.message || null };
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<AuthResponse> {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        return { user: null, error: 'No authenticated user' };
      }

      const { data: adminUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .single();

      if (error) {
        return { user: null, error: 'Admin user not found' };
      }

      const user: User = {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        createdAt: adminUser.created_at,
        lastLogin: adminUser.last_login,
      };

      return { user, error: null };
    } catch (error) {
      return { user: null, error: 'An unexpected error occurred' };
    }
  }

  // Check if user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
    } catch (error) {
      return false;
    }
  }

  // Generate candidate session token
  static async generateCandidateToken(candidateId: string): Promise<{ token: string | null; error: string | null }> {
    try {
      // Create a temporary session for candidate
      const { data, error } = await supabase.auth.signInAnonymously();
      
      if (error) {
        return { token: null, error: error.message };
      }

      // Store candidate session mapping
      const { error: insertError } = await supabase
        .from('candidate_sessions')
        .insert({
          candidate_id: candidateId,
          session_token: data.session?.access_token,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        });

      if (insertError) {
        return { token: null, error: insertError.message };
      }

      return { token: data.session?.access_token || null, error: null };
    } catch (error) {
      return { token: null, error: 'An unexpected error occurred' };
    }
  }

  // Validate candidate session
  static async validateCandidateSession(token: string): Promise<{ candidateId: string | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('candidate_sessions')
        .select('candidate_id')
        .eq('session_token', token)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) {
        return { candidateId: null, error: 'Invalid or expired session' };
      }

      return { candidateId: data.candidate_id, error: null };
    } catch (error) {
      return { candidateId: null, error: 'An unexpected error occurred' };
    }
  }

  // Complete 2FA verification
  static async completeTwoFactorAuth(email: string, verificationCode: string): Promise<TwoFactorAuthResponse> {
    try {
      // Verify the code
      const verifyResult = await TwoFactorAuthService.verifyCode(email, verificationCode);
      
      if (!verifyResult.success) {
        return { success: false, error: verifyResult.error };
      }

      // Get user details after successful verification
      const { data: adminUser, error: adminError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (adminError) {
        return { success: false, error: 'User not found' };
      }

      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', adminUser.id);

      const user: User = {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        createdAt: adminUser.created_at,
        lastLogin: adminUser.last_login,
      };

      return { success: true, user };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // Resend 2FA verification code
  static async resendTwoFactorCode(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get user ID
      const { data: adminUser, error: adminError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (adminError) {
        return { success: false, error: 'User not found' };
      }

      // Generate new verification code
      const result = await TwoFactorAuthService.generateVerificationCode(email, adminUser.id);
      
      return { success: result.success, error: result.error };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
}
