import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  MapPin, 
  Clock, 
  DollarSign, 
  Users, 
  Bot, 
  Calendar,
  ArrowRight,
  LogOut,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { supabase } from '../services/supabase';
import { CandidateUser, JobDescription, AIAgent } from '../types';

interface CandidateDashboardData {
  candidate: CandidateUser;
  jobDescription: JobDescription;
  aiAgent: AIAgent;
  interviewScheduled: boolean;
  interviewDate?: string;
  interviewTime?: string;
}

const CandidateDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<CandidateDashboardData | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get candidate session from localStorage
      const candidateSession = localStorage.getItem('candidateSession');
      if (!candidateSession) {
        setError('No candidate session found. Please login again.');
        return;
      }

      const candidate: CandidateUser = JSON.parse(candidateSession);
      
      // Load job description
      let jobDescription: JobDescription | null = null;
      if (candidate.primaryJobDescriptionId) {
        const { data: jobData, error: jobError } = await supabase
          .from('job_descriptions')
          .select('*')
          .eq('id', candidate.primaryJobDescriptionId)
          .single();

        if (jobError) {
          console.error('Error loading job description:', jobError);
        } else {
          jobDescription = {
            id: jobData.id,
            job_description_id: jobData.job_description_id,
            title: jobData.title,
            department: jobData.department,
            location: jobData.location,
            employmentType: jobData.employment_type,
            experienceLevel: jobData.experience_level,
            salaryRange: jobData.salary_min && jobData.salary_max ? {
              min: jobData.salary_min,
              max: jobData.salary_max,
              currency: jobData.currency || 'INR'
            } : undefined,
            description: jobData.description,
            requirements: Array.isArray(jobData.requirements) ? jobData.requirements : [],
            responsibilities: Array.isArray(jobData.responsibilities) ? jobData.responsibilities : [],
            benefits: Array.isArray(jobData.benefits) ? jobData.benefits : [],
            skills: Array.isArray(jobData.skills) ? jobData.skills : [],
            qualifications: Array.isArray(jobData.qualifications) ? jobData.qualifications : [],
            status: jobData.status,
            createdBy: jobData.created_by,
            createdAt: jobData.created_at,
            updatedAt: jobData.updated_at,
            companyName: jobData.company_name,
            workMode: jobData.work_mode,
            jobCategory: jobData.job_category,
            contactEmail: jobData.contact_email,
            applicationDeadline: jobData.application_deadline
          };
        }
      }

      // Load AI Agent (mock data for now - you can integrate with actual AI agents table)
      const aiAgent: AIAgent = {
        id: 'ai-agent-1',
        name: 'Sarah Chen - Technical Interviewer',
        description: 'Senior AI interviewer specializing in technical roles with 5+ years of experience in software development interviews.',
        agentType: 'technical',
        jobCategories: ['Web Development', 'Software Engineering', 'Technical'],
        capabilities: [
          'Technical problem solving',
          'Code review and analysis',
          'System design discussions',
          'Behavioral assessment'
        ],
        specializations: ['Web Development', 'JavaScript', 'React', 'Node.js'],
        n8nWebhookUrl: 'https://home.ausomemgr.com/webhook-test/technical-interview',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      };

      // Check if interview is scheduled (mock data)
      const interviewScheduled = true;
      const interviewDate = '2025-09-15';
      const interviewTime = '14:30';

      setDashboardData({
        candidate,
        jobDescription: jobDescription || {
          id: 'no-job',
          title: 'No Job Assigned',
          department: 'N/A',
          location: 'N/A',
          employmentType: 'full-time' as const,
          experienceLevel: 'entry' as const,
          description: 'No job description available. Please contact support.',
          requirements: [],
          responsibilities: [],
          benefits: [],
          skills: [],
          qualifications: [],
          status: 'draft' as const,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        aiAgent,
        interviewScheduled,
        interviewDate,
        interviewTime
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = () => {
    if (dashboardData?.candidate.interview_id) {
      navigate(`/candidate/interview/${dashboardData.candidate.interview_id}`);
    } else {
      navigate('/candidate/interview/session');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('candidateSession');
    navigate('/candidate');
  };

  const formatSalary = (salaryRange: { min: number; max: number; currency: string }) => {
    const formatNumber = (num: number) => {
      return new Intl.NumberFormat('en-IN').format(num);
    };
    
    if (salaryRange.currency === 'INR') {
      return `₹${formatNumber(salaryRange.min)} - ₹${formatNumber(salaryRange.max)} per annum`;
    }
    return `${salaryRange.currency} ${formatNumber(salaryRange.min)} - ${formatNumber(salaryRange.max)} per annum`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button variant="primary" onClick={() => navigate('/candidate')}>
              Back to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Data Found</h2>
            <p className="text-gray-600 mb-4">Unable to load dashboard data.</p>
            <Button variant="primary" onClick={() => navigate('/candidate')}>
              Back to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const { candidate, jobDescription, aiAgent, interviewScheduled, interviewDate, interviewTime } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Welcome, {candidate.name}</h1>
                <p className="text-sm text-gray-600">Candidate Dashboard</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Candidate Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Candidate Details */}
            <Card>
              <div className="flex items-center space-x-3 mb-4">
                <User className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Your Information</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{candidate.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{candidate.contact_number || candidate.phone || 'Not provided'}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600 font-medium">Verified Candidate</span>
                </div>
              </div>
            </Card>

            {/* Interview Status */}
            <Card>
              <div className="flex items-center space-x-3 mb-4">
                <Calendar className="h-5 w-5 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">Interview Status</h2>
              </div>
              {interviewScheduled ? (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Interview Scheduled</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{formatDate(interviewDate!)}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{interviewTime}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Interview Not Scheduled</span>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column - Job & AI Agent Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Description */}
            <Card>
              <div className="flex items-center space-x-3 mb-4">
                <Briefcase className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Position Details</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{jobDescription.title}</h3>
                  <p className="text-gray-600">{jobDescription.department}</p>
                  {jobDescription.id === 'no-job' && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-yellow-800">No job position assigned. Please contact support.</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{jobDescription.location}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600 capitalize">{jobDescription.employmentType}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600 capitalize">{jobDescription.experienceLevel} Level</span>
                  </div>
                  {jobDescription.salaryRange && (
                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{formatSalary(jobDescription.salaryRange)}</span>
                    </div>
                  )}
                </div>

                {jobDescription.id !== 'no-job' && (
                  <>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Job Description</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{jobDescription.description}</p>
                    </div>

                    {jobDescription.skills && jobDescription.skills.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Required Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {jobDescription.skills.map((skill, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Card>

            {/* AI Agent Information */}
            <Card>
              <div className="flex items-center space-x-3 mb-4">
                <Bot className="h-5 w-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">Your AI Interviewer</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                    <Bot className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{aiAgent.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{aiAgent.description}</p>
                    
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Specializations</h4>
                        <div className="flex flex-wrap gap-2">
                          {aiAgent.specializations && aiAgent.specializations.length > 0 ? (
                            aiAgent.specializations.map((spec: string, index: number) => (
                              <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                                {spec}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500 italic">No specializations listed</span>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Interview Capabilities</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {aiAgent.capabilities && aiAgent.capabilities.length > 0 ? (
                            aiAgent.capabilities.map((capability: string, index: number) => (
                              <li key={index} className="flex items-center space-x-2">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                <span>{capability}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-sm text-gray-500 italic">No capabilities listed</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Action Button */}
            <div className="text-center">
              {jobDescription.id !== 'no-job' ? (
                <>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleStartInterview}
                    className="px-8"
                  >
                    Start Interview
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  <p className="text-sm text-gray-600 mt-2">
                    Click to begin your AI-powered interview session
                  </p>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="lg"
                    disabled
                    className="px-8"
                  >
                    Interview Not Available
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    Please contact support to assign a job position
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDashboardPage;
