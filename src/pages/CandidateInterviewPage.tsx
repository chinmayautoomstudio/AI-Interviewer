import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, User, Briefcase, Bot, AlertCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ChatInterface from '../components/interview/ChatInterface';
import { 
  InterviewSession, 
  CandidateUser, 
  JobDescription, 
  AIAgent 
} from '../types';
import { InterviewSystemService } from '../services/interviewSystem';
import { supabase } from '../services/supabase';

const CandidateInterviewPage: React.FC = () => {
  const { sessionToken } = useParams<{ sessionToken: string }>();
  const navigate = useNavigate();
  
  const [candidate, setCandidate] = useState<CandidateUser | null>(null);
  const [jobDescription, setJobDescription] = useState<JobDescription | null>(null);
  const [aiAgent, setAiAgent] = useState<AIAgent | null>(null);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingInterview, setStartingInterview] = useState(false);

  useEffect(() => {
    if (sessionToken) {
      loadInterviewData();
    }
  }, [sessionToken]);

  const loadInterviewData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get candidate data from localStorage
      const candidateSession = localStorage.getItem('candidateSession');
      if (!candidateSession) {
        setError('Candidate session not found. Please login again.');
        return;
      }

      const candidateData: CandidateUser = JSON.parse(candidateSession);
      setCandidate(candidateData);

      // Load job description
      if (candidateData.primaryJobDescriptionId) {
        const { data: jobData, error: jobError } = await supabase
          .from('job_descriptions')
          .select('*')
          .eq('id', candidateData.primaryJobDescriptionId)
          .single();

        if (jobError) {
          console.error('Error loading job description:', jobError);
        } else {
          setJobDescription(jobData);
        }
      }

      // Load AI agent (get the first active agent for now)
      const { data: agentData, error: agentError } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (!agentError && agentData) {
        setAiAgent(agentData);
      }

      // Check if there's an existing session
      if (sessionToken && sessionToken !== 'new') {
        const { data: existingSession, error: sessionError } = await InterviewSystemService.getInterviewSession(sessionToken);
        if (!sessionError && existingSession) {
          setSession(existingSession);
        }
      }

    } catch (error) {
      console.error('Error loading interview data:', error);
      setError('Failed to load interview data');
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = async () => {
    if (!candidate || !jobDescription) {
      setError('Missing candidate or job description data');
      return;
    }

    try {
      setStartingInterview(true);
      setError(null);

      const { data: newSession, error } = await InterviewSystemService.startInterview({
        candidateId: candidate.id,
        jobDescriptionId: jobDescription.id,
        aiAgentId: aiAgent?.id
      });

      if (error || !newSession) {
        setError(error || 'Failed to start interview');
        return;
      }

      setSession(newSession);
      
      // Navigate to the session-specific URL
      navigate(`/candidate/interview/${newSession.sessionId}`);
    } catch (error) {
      console.error('Error starting interview:', error);
      setError('Failed to start interview');
    } finally {
      setStartingInterview(false);
    }
  };

  const handleSessionUpdate = (updatedSession: InterviewSession) => {
    setSession(updatedSession);
  };

  const handleGoBack = () => {
    navigate('/candidate/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading interview data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={handleGoBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!candidate || !jobDescription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Missing Data</h2>
            <p className="text-gray-600 mb-4">
              Unable to load candidate or job description data. Please ensure you're properly assigned to a job.
            </p>
            <Button onClick={handleGoBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button onClick={handleGoBack} variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-semibold text-gray-900">AI Interview</h1>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>{candidate.name}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Briefcase className="h-4 w-4" />
                <span>{jobDescription.title}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Interview Info Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Candidate Info */}
            <Card title="Candidate Information">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Name</p>
                  <p className="text-sm text-gray-900">{candidate.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Email</p>
                  <p className="text-sm text-gray-900">{candidate.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Contact</p>
                  <p className="text-sm text-gray-900">{candidate.phone || candidate.contact_number || 'N/A'}</p>
                </div>
              </div>
            </Card>

            {/* Job Description Info */}
            <Card title="Job Position">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Title</p>
                  <p className="text-sm text-gray-900">{jobDescription.title}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Department</p>
                  <p className="text-sm text-gray-900">{jobDescription.department || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Location</p>
                  <p className="text-sm text-gray-900">{jobDescription.location || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Experience Level</p>
                  <p className="text-sm text-gray-900 capitalize">{jobDescription.experienceLevel || 'N/A'}</p>
                </div>
              </div>
            </Card>

            {/* AI Agent Info */}
            {aiAgent && (
              <Card title="AI Interviewer">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Name</p>
                    <p className="text-sm text-gray-900">{aiAgent.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Type</p>
                    <p className="text-sm text-gray-900 capitalize">{aiAgent.agentType?.replace('_', ' ') || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Description</p>
                    <p className="text-sm text-gray-900">{aiAgent.description || 'N/A'}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Session Status */}
            {session && (
              <Card title="Interview Status">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Status</p>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        session.status === 'completed' ? 'bg-green-500' :
                        session.status === 'in_progress' ? 'bg-blue-500 animate-pulse' :
                        session.status === 'failed' ? 'bg-red-500' :
                        session.status === 'cancelled' ? 'bg-gray-500' :
                        'bg-yellow-500'
                      }`} />
                      <p className="text-sm text-gray-900 capitalize">{session.status ? session.status.replace('_', ' ') : 'Unknown'}</p>
                    </div>
                  </div>
                  {session.startedAt && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Started</p>
                      <p className="text-sm text-gray-900">
                        {new Date(session.startedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {session.durationMinutes && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Duration</p>
                      <p className="text-sm text-gray-900">{session.durationMinutes} minutes</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-700">Questions</p>
                    <p className="text-sm text-gray-900">
                      {session.questionsAnswered || 0} / {session.totalQuestions || 0}
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-2">
            {session ? (
              <div className="h-[600px]">
                <ChatInterface
                  sessionId={session.sessionId || sessionToken || ''}
                  session={session}
                  onSessionUpdate={handleSessionUpdate}
                />
              </div>
            ) : (
              <Card>
                <div className="text-center py-12">
                  <Bot className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Ready to Start Your Interview?</h2>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    The AI interviewer will analyze your profile and the job requirements to ask personalized questions. 
                    Take your time to provide thoughtful answers.
                  </p>
                  <div className="space-y-4">
                    <Button
                      onClick={handleStartInterview}
                      disabled={startingInterview}
                      variant="primary"
                      size="lg"
                      className="px-8"
                    >
                      {startingInterview ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Starting Interview...
                        </>
                      ) : (
                        'Start Interview'
                      )}
                    </Button>
                    <div className="text-sm text-gray-500">
                      <p>• The interview will be conducted through chat</p>
                      <p>• All conversations will be recorded for evaluation</p>
                      <p>• You can take your time to think and respond</p>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateInterviewPage;