import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Clock, 
  Target, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Download,
  Mail,
  Award,
  Lightbulb
} from 'lucide-react';
import { InterviewSystemService } from '../services/interviewSystem';

interface InterviewReportData {
  id: string;
  interview_session_id: string;
  overall_score: number;
  suitability_status: string;
  technical_score: number;
  communication_score: number;
  problem_solving_score: number;
  cultural_fit_score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string;
  detailed_feedback: string;
  report_data: any;
  created_at: string;
  interview_sessions: {
    session_id: string;
    status: string;
    started_at: string;
    completed_at: string;
    duration_minutes: number;
    candidates: {
      id: string;
      name: string;
      email: string;
    };
    job_descriptions: {
      id: string;
      title: string;
      department: string;
    };
  };
}

const InterviewReportPage: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<InterviewReportData | null>(null);

  useEffect(() => {
    if (reportId) {
      loadReport();
    }
  }, [reportId]);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await InterviewSystemService.getInterviewReportById(reportId!);
      
      if (result.error) {
        setError(result.error);
      } else {
        setReport(result.data);
      }
    } catch (error) {
      console.error('Error loading report:', error);
      setError('Failed to load interview report');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'suitable': return 'text-green-600 bg-green-100';
      case 'not_suitable': return 'text-red-600 bg-red-100';
      case 'conditional': return 'text-yellow-600 bg-yellow-100';
      case 'needs_review': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'suitable': return CheckCircle;
      case 'not_suitable': return XCircle;
      case 'conditional': return AlertTriangle;
      case 'needs_review': return Clock;
      default: return Clock;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleDownloadReport = () => {
    if (!report) return;
    
    const reportData = {
      candidate: report.interview_sessions.candidates.name,
      position: report.interview_sessions.job_descriptions.title,
      date: formatDate(report.created_at),
      scores: {
        overall: report.overall_score,
        technical: report.technical_score,
        communication: report.communication_score,
        problem_solving: report.problem_solving_score,
        cultural_fit: report.cultural_fit_score
      },
      status: report.suitability_status,
      strengths: report.strengths,
      weaknesses: report.weaknesses,
      recommendations: report.recommendations
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-report-${report.interview_sessions.candidates.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error || 'Report not found'}</p>
          <Button 
            variant="primary" 
            onClick={() => navigate('/reports')}
            className="mt-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
        </div>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(report.suitability_status);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/reports')}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Interview Report</h1>
            <p className="text-gray-600">Detailed analysis and evaluation</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleDownloadReport}>
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
          <Button variant="primary">
            <Mail className="h-4 w-4 mr-2" />
            Send Report
          </Button>
        </div>
      </div>

      {/* Candidate & Interview Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Candidate Information">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">{report.interview_sessions.candidates.name}</p>
                <p className="text-sm text-gray-600">{report.interview_sessions.candidates.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Target className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">{report.interview_sessions.job_descriptions.title}</p>
                <p className="text-sm text-gray-600">{report.interview_sessions.job_descriptions.department}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Interview Details">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Interview Date</p>
                <p className="text-sm text-gray-600">{formatDate(report.interview_sessions.started_at)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Duration</p>
                <p className="text-sm text-gray-600">{formatDuration(report.interview_sessions.duration_minutes)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <StatusIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Status</p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.suitability_status)}`}>
                  {report.suitability_status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Overall Score">
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(report.overall_score)}`}>
              {report.overall_score}/10
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${report.overall_score >= 8 ? 'bg-green-500' : report.overall_score >= 6 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${(report.overall_score / 10) * 100}%` }}
                ></div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {report.overall_score >= 8 ? 'Excellent' : report.overall_score >= 6 ? 'Good' : 'Needs Improvement'}
            </p>
          </div>
        </Card>
      </div>

      {/* Detailed Scores */}
      <Card title="Detailed Scores">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-6 w-6 text-blue-500 mr-2" />
              <span className="font-medium text-gray-900">Technical</span>
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(report.technical_score)}`}>
              {report.technical_score}/10
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="h-2 rounded-full bg-blue-500"
                style={{ width: `${(report.technical_score / 10) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <User className="h-6 w-6 text-green-500 mr-2" />
              <span className="font-medium text-gray-900">Communication</span>
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(report.communication_score)}`}>
              {report.communication_score}/10
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="h-2 rounded-full bg-green-500"
                style={{ width: `${(report.communication_score / 10) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Lightbulb className="h-6 w-6 text-yellow-500 mr-2" />
              <span className="font-medium text-gray-900">Problem Solving</span>
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(report.problem_solving_score)}`}>
              {report.problem_solving_score}/10
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="h-2 rounded-full bg-yellow-500"
                style={{ width: `${(report.problem_solving_score / 10) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Award className="h-6 w-6 text-purple-500 mr-2" />
              <span className="font-medium text-gray-900">Cultural Fit</span>
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(report.cultural_fit_score)}`}>
              {report.cultural_fit_score}/10
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="h-2 rounded-full bg-purple-500"
                style={{ width: `${(report.cultural_fit_score / 10) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </Card>

      {/* Strengths and Weaknesses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Strengths">
          <div className="space-y-3">
            {report.strengths.map((strength, index) => (
              <div key={index} className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-gray-700">{strength}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Areas for Improvement">
          <div className="space-y-3">
            {report.weaknesses.map((weakness, index) => (
              <div key={index} className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p className="text-gray-700">{weakness}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recommendations */}
      <Card title="Recommendations">
        <div className="flex items-start space-x-3">
          <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-gray-700">{report.recommendations}</p>
        </div>
      </Card>

      {/* Detailed Feedback */}
      {report.detailed_feedback && (
        <Card title="Detailed Analysis">
          <div className="space-y-6">
            {(() => {
              try {
                const feedback = typeof report.detailed_feedback === 'string' 
                  ? JSON.parse(report.detailed_feedback) 
                  : report.detailed_feedback;

                return (
                  <div className="space-y-6">
                    {/* Technical Competency */}
                    {feedback.technical_competency && (
                      <div className="border-l-4 border-blue-500 pl-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                          <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
                          Technical Competency
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                            {feedback.technical_competency.score}/10
                          </span>
                        </h3>
                        
                        {feedback.technical_competency.strengths && (
                          <div className="mb-4">
                            <h4 className="font-medium text-green-700 mb-2 flex items-center">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Strengths
                            </h4>
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {feedback.technical_competency.strengths}
                            </p>
                          </div>
                        )}

                        {feedback.technical_competency.gaps && (
                          <div className="mb-4">
                            <h4 className="font-medium text-yellow-700 mb-2 flex items-center">
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              Areas for Improvement
                            </h4>
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {feedback.technical_competency.gaps}
                            </p>
                          </div>
                        )}

                        {feedback.technical_competency.recommendations && (
                          <div>
                            <h4 className="font-medium text-blue-700 mb-2 flex items-center">
                              <Lightbulb className="h-4 w-4 mr-1" />
                              Recommendations
                            </h4>
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {feedback.technical_competency.recommendations}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Communication Skills */}
                    {feedback.communication_skills && (
                      <div className="border-l-4 border-green-500 pl-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                          <User className="h-5 w-5 text-green-500 mr-2" />
                          Communication Skills
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                            {feedback.communication_skills.score}/10
                          </span>
                        </h3>
                        
                        {feedback.communication_skills.strengths && (
                          <div className="mb-4">
                            <h4 className="font-medium text-green-700 mb-2 flex items-center">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Strengths
                            </h4>
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {feedback.communication_skills.strengths}
                            </p>
                          </div>
                        )}

                        {feedback.communication_skills.areas_for_improvement && (
                          <div className="mb-4">
                            <h4 className="font-medium text-yellow-700 mb-2 flex items-center">
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              Areas for Improvement
                            </h4>
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {feedback.communication_skills.areas_for_improvement}
                            </p>
                          </div>
                        )}

                        {feedback.communication_skills.team_dynamics && (
                          <div>
                            <h4 className="font-medium text-blue-700 mb-2 flex items-center">
                              <Award className="h-4 w-4 mr-1" />
                              Team Dynamics
                            </h4>
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {feedback.communication_skills.team_dynamics}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Cultural Fit */}
                    {feedback.cultural_fit && (
                      <div className="border-l-4 border-purple-500 pl-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                          <Award className="h-5 w-5 text-purple-500 mr-2" />
                          Cultural Fit
                          <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                            {feedback.cultural_fit.score}/10
                          </span>
                        </h3>
                        
                        {feedback.cultural_fit.alignment && (
                          <div className="mb-4">
                            <h4 className="font-medium text-green-700 mb-2 flex items-center">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Alignment
                            </h4>
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {feedback.cultural_fit.alignment}
                            </p>
                          </div>
                        )}

                        {feedback.cultural_fit.work_style && (
                          <div className="mb-4">
                            <h4 className="font-medium text-blue-700 mb-2 flex items-center">
                              <Target className="h-4 w-4 mr-1" />
                              Work Style
                            </h4>
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {feedback.cultural_fit.work_style}
                            </p>
                          </div>
                        )}

                        {feedback.cultural_fit.integration && (
                          <div>
                            <h4 className="font-medium text-purple-700 mb-2 flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              Team Integration
                            </h4>
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {feedback.cultural_fit.integration}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Job Suitability */}
                    {feedback.job_suitability && (
                      <div className="border-l-4 border-yellow-500 pl-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                          <Target className="h-5 w-5 text-yellow-500 mr-2" />
                          Job Suitability
                          <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                            {feedback.job_suitability.score}/10
                          </span>
                        </h3>
                        
                        {feedback.job_suitability.role_match && (
                          <div className="mb-4">
                            <h4 className="font-medium text-green-700 mb-2 flex items-center">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Role Match
                            </h4>
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {feedback.job_suitability.role_match}
                            </p>
                          </div>
                        )}

                        {feedback.job_suitability.growth_potential && (
                          <div className="mb-4">
                            <h4 className="font-medium text-blue-700 mb-2 flex items-center">
                              <TrendingUp className="h-4 w-4 mr-1" />
                              Growth Potential
                            </h4>
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {feedback.job_suitability.growth_potential}
                            </p>
                          </div>
                        )}

                        {feedback.job_suitability.long_term_value && (
                          <div>
                            <h4 className="font-medium text-purple-700 mb-2 flex items-center">
                              <Award className="h-4 w-4 mr-1" />
                              Long-term Value
                            </h4>
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {feedback.job_suitability.long_term_value}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              } catch (error) {
                // Fallback to raw text if JSON parsing fails
                return (
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                      {typeof report.detailed_feedback === 'string' 
                        ? report.detailed_feedback 
                        : JSON.stringify(report.detailed_feedback, null, 2)
                      }
                    </pre>
                  </div>
                );
              }
            })()}
          </div>
        </Card>
      )}
    </div>
  );
};

export default InterviewReportPage;
