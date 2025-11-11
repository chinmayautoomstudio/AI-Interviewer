import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import TwoFactorVerificationModal from '../components/TwoFactorVerificationModal';

const LoginPage: React.FC = () => {
  const { signIn, completeTwoFactorAuth, resendTwoFactorCode } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [isResendingCode, setIsResendingCode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { success, error, requiresTwoFactor, verificationCode } = await signIn(formData.email, formData.password);
      
      if (success) {
        // Login successful, user will be redirected by AuthContext
      } else if (requiresTwoFactor) {
        // Show 2FA modal
        setPendingEmail(formData.email);
        setShowTwoFactorModal(true);
        
        // Log verification code for development (remove in production)
        if (verificationCode) {
          console.log('🔐 Development: Verification code is:', verificationCode);
        }
      } else {
        setError(error || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTwoFactorVerify = async (code: string) => {
    return await completeTwoFactorAuth(pendingEmail, code);
  };

  const handleResendCode = async () => {
    setIsResendingCode(true);
    try {
      await resendTwoFactorCode(pendingEmail);
    } finally {
      setIsResendingCode(false);
    }
  };

  const handleCloseTwoFactorModal = () => {
    setShowTwoFactorModal(false);
    setPendingEmail('');
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Abstract Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/background-login.jpeg')` }}
      >
        {/* Subtle overlay for better text readability */}
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-6xl">
          {/* Central Card */}
          <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[500px] sm:min-h-[600px]">
              
              {/* Left Section - Welcome */}
              <div className="bg-gradient-to-br from-white/20 to-white/5 p-6 sm:p-8 lg:p-12 flex flex-col justify-between order-1 lg:order-1">
                {/* Logo */}
                <div className="flex items-center space-x-2 sm:space-x-3 mb-6 sm:mb-8">
                  <img 
                    src="/AI-Interviewer-logo.png"
                    alt="AI HR Saathi" 
                    className="h-6 sm:h-8 w-auto"
                  />
                  <span className="text-white font-bold text-sm sm:text-lg">AI HR SAATHI</span>
                </div>
                
                {/* Welcome Content */}
                <div className="flex-1 flex flex-col justify-center">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight">
                    Hello, welcome!
                  </h1>
                  <p className="text-white/90 text-sm sm:text-base lg:text-lg leading-relaxed">
                    Transform your hiring process with AI-powered interviews. 
                    Get intelligent insights and make better hiring decisions.
                  </p>
                </div>
                
                {/* Social Links - Hidden on mobile, visible on larger screens */}
                <div className="hidden sm:flex items-center space-x-4">
                  <span className="text-white/80 text-sm font-medium">FOLLOW</span>
                  <div className="flex space-x-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">f</span>
                    </div>
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">🐦</span>
                    </div>
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">📷</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Section - Login Form */}
              <div className="bg-white/95 backdrop-blur-sm p-6 sm:p-8 lg:p-12 flex flex-col justify-center order-2 lg:order-2">
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  {error && (
                    <div className="bg-ai-coral/10 border border-ai-coral/20 rounded-lg p-4">
                      <p className="text-ai-coral-dark text-sm">{error}</p>
                    </div>
                  )}
                  
                  {/* Email Field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Email address</label>
                    <input
                      type="email"
                      placeholder="name@mail.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/50 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-ai-teal focus:border-ai-teal transition-colors duration-200 placeholder-gray-400 text-sm sm:text-base"
                    />
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="************"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        required
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 bg-white/50 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-ai-teal focus:border-ai-teal transition-colors duration-200 placeholder-gray-400 text-sm sm:text-base"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember me and Forgot password */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.rememberMe}
                        onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                        className="h-4 w-4 text-ai-teal focus:ring-ai-teal border-gray-300 rounded"
                      />
                      <span className="ml-2 text-xs sm:text-sm text-gray-600">Remember me</span>
                    </label>
                    <button type="button" className="text-xs sm:text-sm text-ai-teal hover:text-ai-teal-dark text-left sm:text-right">
                      Forgot password?
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full sm:flex-1 bg-gradient-to-r from-ai-teal to-ai-teal-light text-white font-medium py-2 sm:py-3 px-4 rounded-lg sm:rounded-xl hover:from-ai-teal-dark hover:to-ai-teal transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm sm:text-base"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                          <span className="text-xs sm:text-sm">Signing in...</span>
                        </div>
                      ) : (
                        'Login'
                      )}
                    </button>
                    <button
                      type="button"
                      className="w-full sm:flex-1 bg-white border border-ai-teal text-ai-teal font-medium py-2 sm:py-3 px-4 rounded-lg sm:rounded-xl hover:bg-ai-teal/5 transition-all duration-200 text-sm sm:text-base"
                    >
                      Sign up
                    </button>
                  </div>
                </form>

          {/* Footer Links */}
          <div className="mt-6 sm:mt-8 text-center space-y-3 sm:space-y-4">
            <p className="text-xs sm:text-sm text-gray-600">
              Don't have an account?{' '}
              <a href="/register" className="text-ai-teal hover:text-ai-teal-dark font-medium">
                Create one here
              </a>
            </p>
            
            <div className="pt-3 sm:pt-4 border-t border-gray-200">
              <p className="text-xs sm:text-sm text-gray-600 mb-2">Are you a candidate?</p>
              <a 
                href="/candidate" 
                className="text-ai-teal hover:text-ai-teal-dark font-medium text-xs sm:text-sm"
              >
                Access Interview Portal →
              </a>
            </div>

            <div className="pt-3 sm:pt-4 border-t border-gray-200">
              <div className="flex flex-wrap justify-center gap-2 sm:gap-4 text-xs text-gray-500">
                <a href="/terms-and-conditions" className="hover:text-ai-teal transition-colors">
                  Terms & Conditions
                </a>
                <span className="hidden sm:inline">•</span>
                <a href="/privacy-policy" className="hover:text-ai-teal transition-colors">
                  Privacy Policy
                </a>
                <span className="hidden sm:inline">•</span>
                <a href="/disclaimer" className="hover:text-ai-teal transition-colors">
                  Disclaimer
                </a>
                <span className="hidden sm:inline">•</span>
                <a href="/help" className="hover:text-ai-teal transition-colors">
                  Help
                </a>
              </div>
            </div>
          </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Factor Authentication Modal */}
      <TwoFactorVerificationModal
        isOpen={showTwoFactorModal}
        onClose={handleCloseTwoFactorModal}
        onVerify={handleTwoFactorVerify}
        email={pendingEmail}
        onResendCode={handleResendCode}
        isResending={isResendingCode}
      />
    </div>
  );
};

export default LoginPage;
