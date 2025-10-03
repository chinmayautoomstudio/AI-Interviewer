import React, { useState } from 'react';
import { Eye, EyeOff, Bot, Users, Mic, BarChart3, Sparkles } from 'lucide-react';
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
    <div className="min-h-screen flex">
      {/* Left Panel - Promotional Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background with gradient and patterns */}
        <div className="absolute inset-0 bg-gradient-to-br from-ai-teal via-ai-teal-light to-ai-orange"></div>
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        
        {/* Frosted glass overlay */}
        <div className="absolute inset-0 backdrop-blur-sm bg-white/10"></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-center">
          <div className="max-w-md">
            {/* Main tagline */}
            <div className="mb-8">
              <div className="flex items-center justify-center mb-4">
                <Bot className="h-8 w-8 text-white mr-3" />
                <span className="text-4xl font-bold text-white">AI</span>
              </div>
              <h1 className="text-5xl font-bold text-white mb-2 leading-tight">
                Interviewer
              </h1>
              <p className="text-xl text-white/90 font-medium">
                <span className="text-ai-orange-light">Intelligent</span> platform
              </p>
              <p className="text-xl text-white/90 font-medium">
                for <span className="font-bold">hiring.</span>
              </p>
            </div>
            
            {/* Subtitle */}
            <div className="mb-8">
              <p className="text-white/80 text-lg leading-relaxed">
                "You will never know everything."
              </p>
              <p className="text-white/80 text-lg leading-relaxed">
                "But you will know more."
              </p>
            </div>
            
            {/* Features */}
            <div className="grid grid-cols-2 gap-4 text-white/90">
              <div className="flex items-center space-x-2">
                <Mic className="h-5 w-5 text-ai-orange-light" />
                <span className="text-sm">Voice Interviews</span>
              </div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-ai-orange-light" />
                <span className="text-sm">Smart Analytics</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-ai-orange-light" />
                <span className="text-sm">Candidate Management</span>
              </div>
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-ai-orange-light" />
                <span className="text-sm">AI-Powered</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8">
            <div className="w-12 h-12 bg-ai-teal rounded-xl flex items-center justify-center mb-4">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Hey, hello 👋
            </h2>
            <p className="text-gray-600">
              Enter the information you entered while registering.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-ai-coral/10 border border-ai-coral/20 rounded-lg p-4">
                <p className="text-ai-coral-dark text-sm">{error}</p>
              </div>
            )}
            
            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-ai-teal transition-colors duration-200"
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
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-ai-teal transition-colors duration-200"
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

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-ai-teal to-ai-teal-light text-white font-medium py-3 px-4 rounded-lg hover:from-ai-teal-dark hover:to-ai-teal transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
          </form>

          {/* Divider */}
          <div className="mt-6 mb-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>
          </div>

          {/* Social Login Button */}
          <button className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200">
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>

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
  );
};

export default LoginPage;
