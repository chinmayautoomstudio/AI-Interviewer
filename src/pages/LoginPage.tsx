import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const { signIn } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { success, error } = await signIn(formData.email, formData.password);
      
      if (!success) {
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
                    alt="AI Interviewer" 
                    className="h-8 w-auto"
                  />
                  <span className="text-ai-teal font-bold text-lg">AI INTERVIEWER</span>
                </div>
                
                {/* Welcome Content */}
                <div className="flex-1 flex flex-col justify-center">
                  <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                    Hello, welcome!
                  </h1>
                  <p className="text-white/90 text-lg leading-relaxed mb-8">
                    Transform your hiring process with AI-powered interviews. 
                    Get intelligent insights and make better hiring decisions.
                  </p>
                  
                  {/* View More Button */}
                  <button className="w-fit bg-white/20 border border-ai-teal/30 text-ai-teal px-6 py-3 rounded-xl font-medium hover:bg-white/30 transition-all duration-200">
                    View more
                  </button>
                </div>
                
                {/* Social Links */}
                <div className="flex items-center space-x-4">
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
              <div className="bg-white/95 backdrop-blur-sm p-12 flex flex-col justify-center">
                <form onSubmit={handleSubmit} className="space-y-6">
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
                      className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ai-teal focus:border-ai-teal transition-colors duration-200 placeholder-gray-400"
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

                  {/* Remember me and Forgot password */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.rememberMe}
                        onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                        className="h-4 w-4 text-ai-teal focus:ring-ai-teal border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-600">Remember me</span>
                    </label>
                    <button type="button" className="text-sm text-ai-teal hover:text-ai-teal-dark">
                      Forgot password?
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-ai-teal text-white font-medium py-3 px-4 rounded-xl hover:bg-ai-teal-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Signing in...
                        </div>
                      ) : (
                        'Login'
                      )}
                    </button>
                    <button
                      type="button"
                      className="flex-1 bg-white border border-ai-teal text-ai-teal font-medium py-3 px-4 rounded-xl hover:bg-ai-teal/5 transition-all duration-200"
                    >
                      Sign up
                    </button>
                  </div>
                </form>

                {/* Footer Links */}
                <div className="mt-8 text-center space-y-4">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <button type="button" className="text-ai-teal hover:text-ai-teal-dark font-medium">
                      Contact your administrator
                    </button>
                  </p>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Are you a candidate?</p>
                    <a 
                      href="/candidate" 
                      className="text-ai-teal hover:text-ai-teal-dark font-medium text-sm"
                    >
                      Access Interview Portal →
                    </a>
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

export default LoginPage;
