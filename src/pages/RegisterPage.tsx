import React, { useState } from 'react';
import { Eye, EyeOff, User, Lock, Building } from 'lucide-react';
import { RegistrationService } from '../services/registration';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    phone: '',
    location: '',
    agreeToTerms: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear errors when user starts typing
    if (error) setError(null);
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!formData.company.trim()) {
      setError('Company name is required');
      return false;
    }
    if (!formData.agreeToTerms) {
      setError('Please agree to the terms and conditions');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      // Call the registration service
      const result = await RegistrationService.registerUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        company: formData.company,
        phone: formData.phone,
        location: formData.location
      });

      if (result.success) {
        setSuccess('Registration successful! Please log in with your new credentials.');
        setTimeout(() => {
          // Redirect to login page after successful registration
          window.location.href = '/login';
        }, 2000);
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }

    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
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
            <div className="grid lg:grid-cols-2 min-h-[700px]">
              
              {/* Left Section - Welcome */}
              <div className="bg-gradient-to-br from-white/20 to-white/5 p-12 flex flex-col justify-between">
                {/* Logo */}
                <div className="flex items-center space-x-3 mb-8">
                  <img 
                    src="/AI-Interviewer-logo.png" 
                    alt="AI Interviewer" 
                    className="h-8 w-auto"
                  />
                  <span className="text-white font-bold text-lg">AI INTERVIEWER</span>
                </div>
                
                {/* Welcome Content */}
                <div className="flex-1 flex flex-col justify-center">
                  <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                    Join our platform
                  </h1>
                  <p className="text-white/90 text-lg leading-relaxed">
                    Create your account to start using AI-powered interviews. 
                    Transform your hiring process with intelligent insights.
                  </p>
                </div>
                
                {/* Features */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 text-white/90">
                    <User className="h-5 w-5 text-ai-orange-light" />
                    <span className="text-sm">Easy candidate management</span>
                  </div>
                  <div className="flex items-center space-x-3 text-white/90">
                    <Building className="h-5 w-5 text-ai-orange-light" />
                    <span className="text-sm">Company-wide access</span>
                  </div>
                  <div className="flex items-center space-x-3 text-white/90">
                    <Lock className="h-5 w-5 text-ai-orange-light" />
                    <span className="text-sm">Secure and reliable</span>
                  </div>
                </div>
              </div>

              {/* Right Section - Registration Form */}
              <div className="bg-white/95 backdrop-blur-sm p-12 flex flex-col justify-center overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-ai-coral/10 border border-ai-coral/20 rounded-lg p-4">
                      <p className="text-ai-coral-dark text-sm">{error}</p>
                    </div>
                  )}

                  {success && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-800 text-sm">{success}</p>
                    </div>
                  )}
                  
                  {/* Header */}
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Create Account
                    </h2>
                    <p className="text-gray-600">
                      Fill in your details to get started
                    </p>
                  </div>

                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">First Name</label>
                      <input
                        type="text"
                        placeholder="Enter first name"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ai-teal focus:border-ai-teal transition-colors duration-200 placeholder-gray-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Last Name</label>
                      <input
                        type="text"
                        placeholder="Enter last name"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ai-teal focus:border-ai-teal transition-colors duration-200 placeholder-gray-400"
                      />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ai-teal focus:border-ai-teal transition-colors duration-200 placeholder-gray-400"
                    />
                  </div>

                  {/* Password Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Create password"
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
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm password"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          required
                          className="w-full px-4 py-3 pr-12 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ai-teal focus:border-ai-teal transition-colors duration-200 placeholder-gray-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Company Field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Company Name</label>
                    <input
                      type="text"
                      placeholder="Enter company name"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ai-teal focus:border-ai-teal transition-colors duration-200 placeholder-gray-400"
                    />
                  </div>

                  {/* Phone and Location */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="Enter phone number"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ai-teal focus:border-ai-teal transition-colors duration-200 placeholder-gray-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Location</label>
                      <input
                        type="text"
                        placeholder="Enter location"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ai-teal focus:border-ai-teal transition-colors duration-200 placeholder-gray-400"
                      />
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      checked={formData.agreeToTerms}
                      onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                      required
                      className="h-4 w-4 text-ai-teal focus:ring-ai-teal border-gray-300 rounded mt-1"
                    />
                    <label className="ml-2 text-sm text-gray-600">
                      I agree to the{' '}
                      <a href="/terms-and-conditions" className="text-ai-teal hover:text-ai-teal-dark">
                        Terms and Conditions
                      </a>
                      ,{' '}
                      <a href="/privacy-policy" className="text-ai-teal hover:text-ai-teal-dark">
                        Privacy Policy
                      </a>
                      , and{' '}
                      <a href="/disclaimer" className="text-ai-teal hover:text-ai-teal-dark">
                        Disclaimer
                      </a>
                    </label>
                  </div>

                  {/* Register Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-ai-teal text-white font-medium py-3 px-4 rounded-xl hover:bg-ai-teal-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Creating Account...
                      </div>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </form>

                {/* Footer Links */}
                <div className="mt-8 text-center">
                  <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <a href="/login" className="text-ai-teal hover:text-ai-teal-dark font-medium">
                      Sign in here
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
