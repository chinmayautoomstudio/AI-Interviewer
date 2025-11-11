import React, { useState } from 'react';
import { Eye, EyeOff, Mic, CheckCircle, AlertCircle, Clock, Wifi } from 'lucide-react';
import { CandidateAuthService } from '../services/candidateAuth';

const CandidateLoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Validate required fields
      if (!formData.username.trim() || !formData.password.trim()) {
        setError('Please enter both username and password');
        return;
      }

      // Authenticate candidate with simplified credentials
      const authResult = await CandidateAuthService.authenticateCandidateSimple(
        formData.username,
        formData.password
      );
      
      if (authResult.error) {
        setError(authResult.error);
        return;
      }

      if (authResult.candidate) {
        setSuccess('Login successful! Redirecting to dashboard...');
        
        // Store candidate session (you might want to use a proper session management)
        localStorage.setItem('candidateSession', JSON.stringify(authResult.candidate));
        
        // Redirect to candidate dashboard
        setTimeout(() => {
          window.location.href = `/candidate/dashboard`;
        }, 1500);
      }
    } catch (error) {
      setError('Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
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
      <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-6xl">
          {/* Central Card */}
          <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
            <div className="grid lg:grid-cols-2 min-h-[600px]">
              
              {/* Left Section - Welcome */}
              <div className="bg-gradient-to-br from-white/20 to-white/5 p-12 flex flex-col justify-between">
                {/* Logo */}
                <div className="flex items-center space-x-3 mb-8">
                  <img 
                    src="/AI-Interviewer-logo.png"
                    alt="AI HR Saathi" 
                    className="h-8 w-auto"
                  />
                  <span className="text-white font-bold text-lg">AI HR SAATHI</span>
                </div>
                
                {/* Welcome Content */}
                <div className="flex-1 flex flex-col justify-center">
                  <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                    Ready for your interview?
                  </h1>
                  <p className="text-white/90 text-lg leading-relaxed">
                    Welcome to your AI-powered interview experience. 
                    Show your skills and let technology help you shine.
                  </p>
                </div>
                
                {/* Interview Requirements */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 text-white/90">
                    <Mic className="h-5 w-5 text-ai-orange-light" />
                    <span className="text-sm">Voice-based interview</span>
                  </div>
                  <div className="flex items-center space-x-3 text-white/90">
                    <Clock className="h-5 w-5 text-ai-orange-light" />
                    <span className="text-sm">30-60 minutes duration</span>
                  </div>
                  <div className="flex items-center space-x-3 text-white/90">
                    <Wifi className="h-5 w-5 text-ai-orange-light" />
                    <span className="text-sm">Stable internet required</span>
                  </div>
                </div>
              </div>

              {/* Right Section - Login Form */}
              <div className="bg-white/95 backdrop-blur-sm p-12 flex flex-col justify-center">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-ai-coral/10 border border-ai-coral/20 rounded-lg p-4">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-ai-coral mr-2" />
                        <p className="text-ai-coral-dark text-sm">{error}</p>
                      </div>
                    </div>
                  )}

                  {success && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        <p className="text-green-800 text-sm">{success}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Header */}
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Candidate Login
                    </h2>
                    <p className="text-gray-600">
                      Enter your credentials to start your interview
                    </p>
                  </div>
                  
                  {/* Username Field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <input
                      type="text"
                      placeholder="Enter your username"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ai-teal focus:border-ai-teal transition-colors duration-200 placeholder-gray-400"
                    />
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        required
                        className="w-full px-4 py-3 pr-12 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ai-teal focus:border-ai-teal transition-colors duration-200 placeholder-gray-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Login Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-ai-teal text-white font-medium py-3 px-4 rounded-xl hover:bg-ai-teal-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Authenticating...
                      </div>
                    ) : (
                      'Start Interview'
                    )}
                  </button>
                </form>

                {/* Footer Information */}
                <div className="mt-8 space-y-4">
                  {/* Requirements */}
                  <div className="bg-ai-teal/10 border border-ai-teal/20 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="h-4 w-4 text-ai-teal mr-2" />
                      <span className="text-sm font-medium text-ai-teal">Interview Requirements:</span>
                    </div>
                    <ul className="text-xs text-gray-700 space-y-1">
                      <li>• Quiet environment with good lighting</li>
                      <li>• Working microphone and speakers/headphones</li>
                      <li>• Stable internet connection</li>
                      <li>• 30-60 minutes of uninterrupted time</li>
                    </ul>
                  </div>

                  {/* Important Notice */}
                  <div className="bg-ai-orange/10 border border-ai-orange/20 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertCircle className="h-4 w-4 text-ai-orange mr-2 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-gray-700">
                        <p className="font-medium mb-1">Important:</p>
                        <p>Your login credentials are sent to your email when the interview is scheduled. If you haven't received them, please contact the hiring team.</p>
                      </div>
                    </div>
                  </div>

                  {/* Support */}
                  <div className="text-center">
                    <p className="text-xs text-gray-500">
                      Having trouble? Contact support at{' '}
                      <a href="mailto:support@aiinterviewer.com" className="text-ai-teal hover:text-ai-teal-dark">
                        support@aiinterviewer.com
                      </a>
                    </p>
                  </div>

                  {/* Legal Links */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-center space-x-4 text-xs text-gray-500">
                      <a href="/terms-and-conditions" className="hover:text-ai-teal transition-colors">
                        Terms & Conditions
                      </a>
                      <span>•</span>
                      <a href="/privacy-policy" className="hover:text-ai-teal transition-colors">
                        Privacy Policy
                      </a>
                      <span>•</span>
                      <a href="/disclaimer" className="hover:text-ai-teal transition-colors">
                        Disclaimer
                      </a>
                      <span>•</span>
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
    </div>
  );
};

export default CandidateLoginPage;
