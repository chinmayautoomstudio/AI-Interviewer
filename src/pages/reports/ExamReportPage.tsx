import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FileText, TrendingUp, TrendingDown, Clock, Target, Brain, CheckCircle, XCircle, AlertCircle, Calendar, DollarSign, BookOpen, Lightbulb, MessageSquare } from 'lucide-react';
import { ReportData, reportGenerationService } from '../../services/reportGenerationService';
import { supabase } from '../../services/supabase';

interface ComprehensiveReportData {
  executive_summary: {
    overall_performance: string;
    key_strengths: string[];
    main_concerns: string[];
    hiring_recommendation: string;
    confidence_level: number;
    summary_text: string;
  };
  performance_analysis: {
    mcq_performance: {
      score: number;
      max_score: number;
      percentage: number;
      strengths: string[];
      weaknesses: string[];
      analysis: string;
    };
    text_performance: {
      score: number;
      max_score: number;
      percentage: number;
      strengths: string[];
      weaknesses: string[];
      analysis: string;
    };
    overall_performance: {
      score: number;
      max_score: number;
      percentage: number;
      time_efficiency: string;
      consistency: string;
      analysis: string;
    };
  };
  question_analysis: Array<{
    question_id: string;
    question_type: string;
    category: string;
    difficulty: string;
    points_earned: number;
    max_points: number;
    is_correct: boolean;
    time_taken_seconds: number | null;
    performance_rating: string;
    feedback: string;
    strengths: string[];
    improvements: string[];
  }>;
  skill_gap_analysis: {
    critical_gaps: Array<{
      skill: string;
      current_level: string;
      required_level: string;
      gap_severity: string;
      recommendations: string[];
    }>;
    important_gaps: Array<{
      skill: string;
      current_level: string;
      required_level: string;
      gap_severity: string;
      recommendations: string[];
    }>;
    nice_to_have_gaps: Array<{
      skill: string;
      current_level: string;
      required_level: string;
      gap_severity: string;
      recommendations: string[];
    }>;
  };
  strengths: string[];
  weaknesses: string[];
  hiring_recommendation: {
    recommendation: string;
    confidence: number;
    reasoning: string;
    conditions?: string[];
    interview_focus?: string[];
    salary_recommendation?: {
      range: string;
      reasoning: string;
    };
  };
  development_suggestions: {
    immediate: string[];
    short_term: string[];
    long_term: string[];
    resources: string[];
  };
  interview_guidance: {
    focus_areas: string[];
    questions_to_ask: string[];
    red_flags: string[];
    green_flags: string[];
  };
  report_metadata: {
    generated_at: string;
    report_version: string;
    ai_confidence: number;
    data_completeness: string;
  };
}

const ExamReportPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [comprehensiveReport, setComprehensiveReport] = useState<ComprehensiveReportData | null>(null);
  const [candidateData, setCandidateData] = useState<any>(null);
  const [jobData, setJobData] = useState<any>(null);
  const [examResult, setExamResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    if (!sessionId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // First try to get comprehensive report from database
      const { data: examResult, error: resultError } = await supabase
        .from('exam_results')
        .select('*')
        .eq('exam_session_id', sessionId)
        .single();

      if (resultError) {
        console.error('Error fetching exam result:', resultError);
        throw new Error('Failed to fetch exam results');
      }

      // Store the exam result data
      setExamResult(examResult);

      // If comprehensive report exists, parse it
      if (examResult.comprehensive_report) {
        try {
          const parsedReport = JSON.parse(examResult.comprehensive_report);
          setComprehensiveReport(parsedReport);
          
          // Fetch candidate and job data
          const [candidateResponse, jobResponse] = await Promise.all([
            supabase.from('candidates').select('*').eq('id', examResult.candidate_id).single(),
            supabase.from('exam_sessions').select('job_description_id').eq('id', sessionId).single()
          ]);

          if (candidateResponse.data) {
            setCandidateData(candidateResponse.data);
          }

          if (jobResponse.data?.job_description_id) {
            const jobDescResponse = await supabase
              .from('job_descriptions')
              .select('*')
              .eq('id', jobResponse.data.job_description_id)
              .single();
            
            if (jobDescResponse.data) {
              setJobData(jobDescResponse.data);
            }
          }
        } catch (parseError) {
          console.error('Error parsing comprehensive report:', parseError);
          // Fallback to regular report generation
          const report = await reportGenerationService.generateReport(sessionId);
          setReportData(report);
        }
      } else {
        // Fallback to regular report generation
        const report = await reportGenerationService.generateReport(sessionId);
        setReportData(report);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      loadReport();
    }
  }, [sessionId, loadReport]);

  const handleBack = () => {
    navigate('/exams/results');
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export functionality to be implemented');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading exam report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Report</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={handleBack}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Results
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Results
              </button>
              <div className="flex items-center space-x-3">
                <FileText className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">Exam Report</h1>
                {(reportData || comprehensiveReport) && (
                  <span className="text-sm text-gray-500">
                    {comprehensiveReport ? (candidateData?.name || 'Candidate') : reportData?.candidate.name} - {comprehensiveReport ? (jobData?.title || 'Position') : reportData?.jobDescription.title}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {(reportData || comprehensiveReport) && (
          <div className="bg-white rounded-lg shadow-sm">
            {comprehensiveReport ? (
              <ComprehensiveReportView 
                report={comprehensiveReport} 
                candidate={candidateData}
                job={jobData}
                examResult={examResult}
              />
            ) : (
              <SinglePageReport reportData={reportData!} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Single Page Report Component
const SinglePageReport: React.FC<{ reportData: ReportData }> = ({ reportData }) => {
  return (
    <div className="p-8 space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Exam Performance Report</h2>
            <p className="text-gray-600 mt-1">
              {reportData.candidate.name} • {reportData.jobDescription.title}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(reportData.evaluationStatus)}
            <span className="text-lg font-medium capitalize">{reportData.evaluationStatus}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600">{reportData.percentage}%</div>
            <div className="text-sm text-gray-600">Overall Score</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600">{reportData.overallScore}</div>
            <div className="text-sm text-gray-600">Points Earned</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-600">{reportData.maxScore}</div>
            <div className="text-sm text-gray-600">Max Points</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600">{reportData.questionAnalysis.length}</div>
            <div className="text-sm text-gray-600">Total Questions</div>
          </div>
        </div>
      </div>

      {/* Performance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MCQ Performance */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <h3 className="text-xl font-semibold">MCQ Performance</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Score:</span>
              <span className="font-bold text-lg">{reportData.mcqResults.score}/{reportData.mcqResults.totalQuestions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Percentage:</span>
              <span className="font-bold text-lg text-green-600">{reportData.mcqResults.percentage}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Correct Answers:</span>
              <span className="font-bold text-lg">{reportData.mcqResults.correctAnswers}/{reportData.mcqResults.totalQuestions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Avg Time/Question:</span>
              <span className="font-semibold">{reportData.mcqResults.averageTimePerQuestion}s</span>
            </div>
          </div>
        </div>

        {/* Text Performance */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Brain className="h-6 w-6 text-purple-500" />
            <h3 className="text-xl font-semibold">Text Performance</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Score:</span>
              <span className="font-bold text-lg">{reportData.textResults.totalScore}/{reportData.textResults.maxScore}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Percentage:</span>
              <span className="font-bold text-lg text-purple-600">{reportData.textResults.percentage}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">AI Confidence:</span>
              <span className="font-bold text-lg">{Math.round(reportData.textResults.averageConfidence * 100)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Questions:</span>
              <span className="font-semibold">{reportData.textResults.totalQuestions}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hiring Recommendation */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <Target className="h-6 w-6 mr-2 text-blue-600" />
          Hiring Recommendation
        </h3>
        <div className="flex items-center space-x-4">
          <div className={`inline-flex items-center px-6 py-3 rounded-full border text-lg font-medium ${getRecommendationColor(reportData.hiringRecommendation.recommendation)}`}>
            <span className="capitalize">{reportData.hiringRecommendation.recommendation.replace('_', ' ')}</span>
            <span className="ml-3 text-sm">({Math.round(reportData.hiringRecommendation.confidence * 100)}% confidence)</span>
          </div>
        </div>
        <p className="mt-4 text-gray-700 text-lg">{reportData.hiringRecommendation.reasoning}</p>
      </div>

      {/* Question Analysis */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-6 flex items-center">
          <Brain className="h-6 w-6 mr-2 text-indigo-600" />
          Question Analysis
        </h3>
        <div className="space-y-4">
          {reportData.questionAnalysis.map((question, index) => (
            <div key={question.questionId} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-sm font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded">Q{index + 1}</span>
                    <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                      question.questionType === 'mcq' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {question.questionType.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">{question.category}</span>
                    <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">{question.difficulty}</span>
                  </div>
                  <p className="text-sm text-gray-800 mb-2 font-medium">{question.questionText}</p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Answer:</span> {question.candidateAnswer}
                  </p>
                  {question.correctAnswer && (
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Correct Answer:</span> {question.correctAnswer}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-3 ml-4">
                  {question.isCorrect ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-500" />
                  )}
                  <div className="text-right">
                    <div className="text-lg font-bold">{question.pointsEarned}/{question.points}</div>
                    <div className="text-xs text-gray-500">points</div>
                  </div>
                </div>
              </div>
              
              {question.feedback && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 mb-2 font-medium">{question.feedback.overall}</p>
                  {question.feedback.suggestions && question.feedback.suggestions.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Suggestions:</p>
                      <ul className="text-xs text-gray-600 list-disc list-inside space-y-1">
                        {question.feedback.suggestions.slice(0, 3).map((suggestion, i) => (
                          <li key={i}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Skills & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strengths */}
        {reportData.strengths.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-green-800 mb-4 flex items-center">
              <TrendingUp className="h-6 w-6 mr-2" />
              Strengths
            </h3>
            <ul className="space-y-2">
              {reportData.strengths.map((strength, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-green-700">{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Areas for Improvement */}
        {reportData.weaknesses.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-red-800 mb-4 flex items-center">
              <TrendingDown className="h-6 w-6 mr-2" />
              Areas for Improvement
            </h3>
            <ul className="space-y-2">
              {reportData.weaknesses.map((weakness, index) => (
                <li key={index} className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-red-700">{weakness}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Skill Gaps */}
      {reportData.skillGaps.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-6 flex items-center">
            <Target className="h-6 w-6 mr-2 text-orange-600" />
            Skill Gaps Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportData.skillGaps.map((gap, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-lg">{gap.skill}</span>
                  <span className={`px-3 py-1 text-sm rounded-full border font-medium ${getSkillGapColor(gap.level)}`}>
                    {gap.level}
                  </span>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Current: {gap.currentLevel}%</span>
                    <span>Required: {gap.requiredLevel}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                      style={{ width: `${gap.currentLevel}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Recommendations:</p>
                  <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                    {gap.recommendations.slice(0, 2).map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* General Recommendations */}
      {reportData.recommendations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
            <Target className="h-6 w-6 mr-2" />
            General Recommendations
          </h3>
          <ul className="space-y-2">
            {reportData.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start">
                <Target className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-blue-700">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Comprehensive Report View Component
const ComprehensiveReportView: React.FC<{
  report: ComprehensiveReportData;
  candidate: any;
  job: any;
  examResult: any;
}> = ({ report, candidate, job, examResult }) => {
  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'excellent':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'good':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'average':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'below_average':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'poor':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'strong_hire':
      case 'hire':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'conditional_hire':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'no_hire':
      case 'reject':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Executive Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">AI-Generated Exam Report</h2>
            <p className="text-gray-600 mt-1">
              {candidate?.name || 'Candidate'} • {job?.title || 'Position'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Generated on {new Date(report.report_metadata.generated_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`inline-flex items-center px-4 py-2 rounded-full border text-sm font-medium ${getPerformanceColor(report.executive_summary.overall_performance)}`}>
              <span className="capitalize">{report.executive_summary.overall_performance.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Database Scores */}
          <div className="bg-white rounded-lg p-6 border-2 border-blue-200">
            <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Database Scores (Actual)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{examResult?.percentage || 0}%</div>
                <div className="text-sm text-gray-600">Overall Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{examResult?.total_score || 0}</div>
                <div className="text-sm text-gray-600">Points Earned</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-600">{examResult?.max_score || 0}</div>
                <div className="text-sm text-gray-600">Max Points</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{examResult?.correct_answers || 0}</div>
                <div className="text-sm text-gray-600">Correct Answers</div>
              </div>
            </div>
          </div>

          {/* AI Analysis Scores */}
          <div className="bg-white rounded-lg p-6 border-2 border-purple-200">
            <h4 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
              <Brain className="h-5 w-5 mr-2" />
              AI Analysis Scores
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{report.performance_analysis.overall_performance.percentage}%</div>
                <div className="text-sm text-gray-600">AI Overall Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{report.performance_analysis.overall_performance.score}</div>
                <div className="text-sm text-gray-600">AI Points Earned</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-600">{report.performance_analysis.overall_performance.max_score}</div>
                <div className="text-sm text-gray-600">AI Max Points</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{Math.round(report.report_metadata.ai_confidence * 100)}%</div>
                <div className="text-sm text-gray-600">AI Confidence</div>
              </div>
            </div>
          </div>
        </div>

        {/* Score Comparison */}
        {examResult && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Score Comparison
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{examResult.percentage}%</div>
                <div className="text-sm text-gray-600">Database Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{report.performance_analysis.overall_performance.percentage}%</div>
                <div className="text-sm text-gray-600">AI Analysis Score</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${Math.abs(examResult.percentage - report.performance_analysis.overall_performance.percentage) > 5 ? 'text-red-600' : 'text-green-600'}`}>
                  {Math.abs(examResult.percentage - report.performance_analysis.overall_performance.percentage).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Difference</div>
              </div>
            </div>
            {Math.abs(examResult.percentage - report.performance_analysis.overall_performance.percentage) > 5 && (
              <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>Note:</strong> There's a significant difference between the database score and AI analysis score. 
                  The database score ({examResult.percentage}%) represents the actual calculated performance, 
                  while the AI analysis score ({report.performance_analysis.overall_performance.percentage}%) 
                  represents the AI's interpretation of the performance.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-lg p-4 border">
          <h4 className="font-semibold text-gray-900 mb-2">Executive Summary</h4>
          <p className="text-gray-700">{report.executive_summary.summary_text}</p>
        </div>
      </div>

      {/* Performance Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MCQ Performance */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <h3 className="text-xl font-semibold">MCQ Performance</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Score:</span>
              <span className="font-bold text-lg">{report.performance_analysis.mcq_performance.score}/{report.performance_analysis.mcq_performance.max_score}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Percentage:</span>
              <span className="font-bold text-lg text-green-600">{report.performance_analysis.mcq_performance.percentage}%</span>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-700">{report.performance_analysis.mcq_performance.analysis}</p>
            </div>
            {report.performance_analysis.mcq_performance.strengths.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Strengths:</p>
                <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                  {report.performance_analysis.mcq_performance.strengths.map((strength, i) => (
                    <li key={i}>{strength}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Text Performance */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Brain className="h-6 w-6 text-purple-500" />
            <h3 className="text-xl font-semibold">Text Performance</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Score:</span>
              <span className="font-bold text-lg">{report.performance_analysis.text_performance.score}/{report.performance_analysis.text_performance.max_score}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Percentage:</span>
              <span className="font-bold text-lg text-purple-600">{report.performance_analysis.text_performance.percentage}%</span>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-700">{report.performance_analysis.text_performance.analysis}</p>
            </div>
            {report.performance_analysis.text_performance.weaknesses.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Areas for Improvement:</p>
                <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                  {report.performance_analysis.text_performance.weaknesses.slice(0, 3).map((weakness, i) => (
                    <li key={i}>{weakness}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hiring Recommendation */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <Target className="h-6 w-6 mr-2 text-blue-600" />
          Hiring Recommendation
        </h3>
        <div className="flex items-center space-x-4 mb-4">
          <div className={`inline-flex items-center px-6 py-3 rounded-full border text-lg font-medium ${getRecommendationColor(report.hiring_recommendation.recommendation)}`}>
            <span className="capitalize">{report.hiring_recommendation.recommendation.replace('_', ' ')}</span>
            <span className="ml-3 text-sm">({Math.round(report.hiring_recommendation.confidence * 100)}% confidence)</span>
          </div>
        </div>
        <p className="text-gray-700 text-lg mb-4">{report.hiring_recommendation.reasoning}</p>
        
        {report.hiring_recommendation.salary_recommendation && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-gray-900">Salary Recommendation</span>
            </div>
            <p className="text-lg font-bold text-green-600">{report.hiring_recommendation.salary_recommendation.range}</p>
            <p className="text-sm text-gray-600 mt-1">{report.hiring_recommendation.salary_recommendation.reasoning}</p>
          </div>
        )}
      </div>

      {/* Key Strengths and Concerns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Key Strengths */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-green-800 mb-4 flex items-center">
            <TrendingUp className="h-6 w-6 mr-2" />
            Key Strengths
          </h3>
          <ul className="space-y-2">
            {report.executive_summary.key_strengths.map((strength, index) => (
              <li key={index} className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-green-700">{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Main Concerns */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-red-800 mb-4 flex items-center">
            <AlertCircle className="h-6 w-6 mr-2" />
            Main Concerns
          </h3>
          <ul className="space-y-2">
            {report.executive_summary.main_concerns.map((concern, index) => (
              <li key={index} className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-red-700">{concern}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Skill Gap Analysis */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-6 flex items-center">
          <Target className="h-6 w-6 mr-2 text-orange-600" />
          Skill Gap Analysis
        </h3>
        
        {/* Critical Gaps */}
        {report.skill_gap_analysis.critical_gaps.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-red-800 mb-3">Critical Gaps</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.skill_gap_analysis.critical_gaps.map((gap, index) => (
                <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-lg text-red-800">{gap.skill}</span>
                    <span className="px-3 py-1 text-sm rounded-full bg-red-100 text-red-800 font-medium">
                      {gap.gap_severity}
                    </span>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Current: {gap.current_level}</span>
                      <span>Required: {gap.required_level}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Recommendations:</p>
                    <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                      {gap.recommendations.slice(0, 2).map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Important Gaps */}
        {report.skill_gap_analysis.important_gaps.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-yellow-800 mb-3">Important Gaps</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.skill_gap_analysis.important_gaps.map((gap, index) => (
                <div key={index} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-lg text-yellow-800">{gap.skill}</span>
                    <span className="px-3 py-1 text-sm rounded-full bg-yellow-100 text-yellow-800 font-medium">
                      {gap.gap_severity}
                    </span>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Current: {gap.current_level}</span>
                      <span>Required: {gap.required_level}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Recommendations:</p>
                    <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                      {gap.recommendations.slice(0, 2).map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Development Suggestions */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-6 flex items-center">
          <BookOpen className="h-6 w-6 mr-2 text-blue-600" />
          Development Suggestions
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Immediate */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-red-600" />
              Immediate (0-1 months)
            </h4>
            <ul className="space-y-2">
              {report.development_suggestions.immediate.map((suggestion, index) => (
                <li key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-sm text-gray-700">{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Short Term */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-yellow-600" />
              Short Term (1-6 months)
            </h4>
            <ul className="space-y-2">
              {report.development_suggestions.short_term.map((suggestion, index) => (
                <li key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-sm text-gray-700">{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Long Term */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Target className="h-5 w-5 mr-2 text-green-600" />
              Long Term (6+ months)
            </h4>
            <ul className="space-y-2">
              {report.development_suggestions.long_term.map((suggestion, index) => (
                <li key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-sm text-gray-700">{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Resources */}
        {report.development_suggestions.resources.length > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Lightbulb className="h-5 w-5 mr-2 text-blue-600" />
              Recommended Resources
            </h4>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {report.development_suggestions.resources.map((resource, index) => (
                <li key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-sm text-gray-700">{resource}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Interview Guidance */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-6 flex items-center">
          <MessageSquare className="h-6 w-6 mr-2 text-purple-600" />
          Interview Guidance
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Focus Areas */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Focus Areas</h4>
            <ul className="space-y-2">
              {report.interview_guidance.focus_areas.map((area, index) => (
                <li key={index} className="flex items-start">
                  <Target className="h-4 w-4 text-blue-600 mt-1 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{area}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Questions to Ask */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Questions to Ask</h4>
            <ul className="space-y-2">
              {report.interview_guidance.questions_to_ask.map((question, index) => (
                <li key={index} className="flex items-start">
                  <MessageSquare className="h-4 w-4 text-green-600 mt-1 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{question}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Red Flags */}
          <div>
            <h4 className="font-semibold text-red-800 mb-3">Red Flags to Watch</h4>
            <ul className="space-y-2">
              {report.interview_guidance.red_flags.map((flag, index) => (
                <li key={index} className="flex items-start">
                  <XCircle className="h-4 w-4 text-red-600 mt-1 mr-2 flex-shrink-0" />
                  <span className="text-sm text-red-700">{flag}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Green Flags */}
          <div>
            <h4 className="font-semibold text-green-800 mb-3">Positive Indicators</h4>
            <ul className="space-y-2">
              {report.interview_guidance.green_flags.map((flag, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-1 mr-2 flex-shrink-0" />
                  <span className="text-sm text-green-700">{flag}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Question Analysis */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-6 flex items-center">
          <Brain className="h-6 w-6 mr-2 text-indigo-600" />
          Question Analysis
        </h3>
        <div className="space-y-4">
          {report.question_analysis.map((question, index) => (
            <div key={question.question_id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-sm font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded">Q{index + 1}</span>
                    <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                      question.question_type === 'mcq' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {question.question_type.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">{question.category}</span>
                    <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">{question.difficulty}</span>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      question.performance_rating === 'excellent' ? 'bg-green-100 text-green-800' :
                      question.performance_rating === 'good' ? 'bg-blue-100 text-blue-800' :
                      question.performance_rating === 'average' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {question.performance_rating}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-3 ml-4">
                  {question.is_correct ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-500" />
                  )}
                  <div className="text-right">
                    <div className="text-lg font-bold">{question.points_earned}/{question.max_points}</div>
                    <div className="text-xs text-gray-500">points</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 mb-2 font-medium">{question.feedback}</p>
                {question.strengths.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-green-600 mb-1">Strengths:</p>
                    <ul className="text-xs text-green-700 list-disc list-inside space-y-1">
                      {question.strengths.map((strength, i) => (
                        <li key={i}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {question.improvements.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-red-600 mb-1">Improvements:</p>
                    <ul className="text-xs text-red-700 list-disc list-inside space-y-1">
                      {question.improvements.slice(0, 2).map((improvement, i) => (
                        <li key={i}>{improvement}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper function for status icons
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'passed':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'failed':
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
  }
};

// Helper function for recommendation colors
const getRecommendationColor = (recommendation: string) => {
  switch (recommendation) {
    case 'hire':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'interview':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'provide_foundational_training':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'reject':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

// Helper function for skill gap colors
const getSkillGapColor = (level: string) => {
  switch (level) {
    case 'critical':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'important':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'nice_to_have':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

export default ExamReportPage;
