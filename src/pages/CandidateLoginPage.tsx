import React, { useState, useEffect } from 'react';
import { Mic, CheckCircle, AlertCircle, User, Briefcase, Lock } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { CandidateAuthService } from '../services/candidateAuth';
import { CandidateLoginRequest } from '../types';
import { supabase } from '../services/supabase';

interface JobDescription {
  id: string;
  job_description_id?: string;
  title: string;
  department: string;
}

const CandidateLoginPage: React.FC = () => {
  const [formData, setFormData] = useState<CandidateLoginRequest>({
    name: '',
    email: '',
    contact_number: '',
    job_description_id: '',
    username: '',
    password: ''
  });
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load job descriptions on component mount
  useEffect(() => {
    const loadJobDescriptions = async () => {
      try {
        const { data, error } = await supabase
          .from('job_descriptions')
          .select('id, job_description_id, title, department')
          .eq('status', 'active')
          .order('title');

        if (error) {
          console.error('Error loading job descriptions:', error);
        } else {
          setJobDescriptions(data || []);
        }
      } catch (error) {
        console.error('Error loading job descriptions:', error);
      }
    };

    loadJobDescriptions();
  }, []);

  const handleInputChange = (field: keyof CandidateLoginRequest, value: string) => {
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
      if (!formData.name.trim() || !formData.email.trim() || !formData.contact_number.trim() || 
          !formData.job_description_id || !formData.username.trim() || !formData.password.trim()) {
        setError('Please fill in all required fields');
        return;
      }

      // Authenticate candidate
      const authResult = await CandidateAuthService.authenticateCandidate(formData);
      
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Card className="border-0 shadow-xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mic className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Candidate Interview Login
            </h1>
            <p className="text-gray-600">
              Enter your credentials to access your interview
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  <p className="text-red-800 text-sm">{error}</p>
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

            {/* Personal Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Personal Information
              </h3>
              
              <Input
                label="Full Name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(value) => handleInputChange('name', value)}
                required
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(value) => handleInputChange('email', value)}
                required
              />

              <Input
                label="Contact Number"
                type="tel"
                placeholder="Enter your contact number"
                value={formData.contact_number}
                onChange={(value) => handleInputChange('contact_number', value)}
                required
              />
            </div>

            {/* Job Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Briefcase className="h-5 w-5 mr-2 text-blue-600" />
                Interview Details
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Position
                </label>
                <select
                  value={formData.job_description_id}
                  onChange={(e) => handleInputChange('job_description_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select the job you're interviewing for</option>
                  {jobDescriptions.map((job) => (
                    <option key={job.id} value={job.job_description_id || job.id}>
                      {job.title} - {job.department}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Login Credentials */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Lock className="h-5 w-5 mr-2 text-blue-600" />
                Login Credentials
              </h3>
              <p className="text-sm text-gray-600">
                These credentials were sent to your email when the interview was scheduled.
              </p>
              
              <Input
                label="Username"
                type="text"
                placeholder="Enter your username"
                value={formData.username}
                onChange={(value) => handleInputChange('username', value)}
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(value) => handleInputChange('password', value)}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-6"
            >
              {loading ? 'Authenticating...' : 'Start Interview'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center mb-2">
              <CheckCircle className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-800">Interview Requirements:</span>
            </div>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• A quiet environment with good lighting</li>
              <li>• Working microphone and speakers/headphones</li>
              <li>• Stable internet connection</li>
              <li>• 30-60 minutes of uninterrupted time</li>
              <li>• Your credentials (sent via email)</li>
            </ul>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-yellow-800">
                <p className="font-medium mb-1">Important:</p>
                <p>Your login credentials are sent to your email when the interview is scheduled. If you haven't received them, please contact the hiring team.</p>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Having trouble? Contact support at{' '}
              <a href="mailto:support@aiinterviewer.com" className="text-blue-600 hover:text-blue-500">
                support@aiinterviewer.com
              </a>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CandidateLoginPage;
