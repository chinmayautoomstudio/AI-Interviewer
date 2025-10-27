// Question Assignment Management Page
// Interface for managing which questions are assigned to which job descriptions

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Plus, 
  Minus,
  CheckCircle, 
  XCircle, 
  Eye,
  RefreshCw,
  Users,
  FileText,
  Settings
} from 'lucide-react';
import { ExamQuestion, JobDescription } from '../../types';
import { questionService } from '../../services/questionService';
import { JobDescriptionsService } from '../../services/jobDescriptions';


interface JobQuestionStats {
  totalQuestions: number;
  assignedQuestions: number;
  approvedQuestions: number;
  byCategory: {
    technical: number;
    aptitude: number;
  };
  byDifficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
}

const QuestionAssignmentPage: React.FC = () => {
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [selectedJobDescription, setSelectedJobDescription] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [jobStats, setJobStats] = useState<JobQuestionStats | null>(null);
  const [assignments, setAssignments] = useState<Map<string, boolean>>(new Map());
  const [saving, setSaving] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load all questions
      const questionsResult = await questionService.getQuestions({
        search: '',
        category: '',
        difficulty: '',
        status: '',
        job_description_id: '',
        limit: 1000,
        offset: 0
      });
      
      if (questionsResult.success && questionsResult.data) {
        setQuestions(questionsResult.data);
      }

      // Load job descriptions
      const jobDescriptionsResult = await JobDescriptionsService.getJobDescriptions();
      if (jobDescriptionsResult.data) {
        setJobDescriptions(jobDescriptionsResult.data);
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadJobStats = useCallback(async () => {
    if (!selectedJobDescription) return;

    try {
      // Filter questions assigned to this job description from the loaded questions
      const jobQuestions = questions.filter(q => q.job_description_id === selectedJobDescription);
      const approvedQuestions = jobQuestions.filter(q => q.status === 'approved');
      
      const stats: JobQuestionStats = {
        totalQuestions: jobQuestions.length,
        assignedQuestions: jobQuestions.length,
        approvedQuestions: approvedQuestions.length,
        byCategory: {
          technical: jobQuestions.filter(q => q.question_category === 'technical').length,
          aptitude: jobQuestions.filter(q => q.question_category === 'aptitude').length
        },
        byDifficulty: {
          easy: jobQuestions.filter(q => q.difficulty_level === 'easy').length,
          medium: jobQuestions.filter(q => q.difficulty_level === 'medium').length,
          hard: jobQuestions.filter(q => q.difficulty_level === 'hard').length
        }
      };
      
      setJobStats(stats);
    } catch (error) {
      console.error('Error loading job stats:', error);
    }
  }, [selectedJobDescription, questions]);

  const loadAllAssignments = useCallback(async () => {
    try {
      const assignmentMap = new Map<string, boolean>();
      
      // For each question, check if it's assigned to the selected job description
      questions.forEach(question => {
        const isAssigned = question.job_description_id === selectedJobDescription;
        assignmentMap.set(question.id, isAssigned);
      });
      
      setAssignments(assignmentMap);
    } catch (error) {
      console.error('Error loading all assignments:', error);
    }
  }, [selectedJobDescription, questions]);

  useEffect(() => {
    if (selectedJobDescription) {
      loadJobStats();
      loadAllAssignments();
    }
  }, [selectedJobDescription, questions, loadJobStats, loadAllAssignments]);

  const handleAssignmentToggle = async (questionId: string, assigned: boolean) => {
    if (!selectedJobDescription) return;

    try {
      setSaving(true);
      
      if (assigned) {
        // Assign question to job description
        const result = await questionService.assignQuestionToJob(questionId, selectedJobDescription);
        if (result.success) {
          // Update the questions array to reflect the change
          setQuestions(prev => prev.map(q => 
            q.id === questionId ? { ...q, job_description_id: selectedJobDescription } : q
          ));
          setAssignments(prev => new Map(prev.set(questionId, true)));
          await loadJobStats();
        }
      } else {
        // Remove question from job description
        const result = await questionService.removeQuestionFromJob(questionId, selectedJobDescription);
        if (result.success) {
          // Update the questions array to reflect the change
          setQuestions(prev => prev.map(q => 
            q.id === questionId ? { ...q, job_description_id: undefined } : q
          ));
          setAssignments(prev => new Map(prev.set(questionId, false)));
          await loadJobStats();
        }
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleBulkAssign = async (assigned: boolean) => {
    if (!selectedJobDescription) return;

    try {
      setSaving(true);
      
      const filteredQuestions = getFilteredQuestions();
      const questionIds = filteredQuestions.map(q => q.id);
      
      if (assigned) {
        // Bulk assign questions
        const result = await questionService.bulkAssignQuestionsToJob(questionIds, selectedJobDescription);
        if (result.success) {
          // Update the questions array to reflect the changes
          setQuestions(prev => prev.map(q => 
            questionIds.includes(q.id) ? { ...q, job_description_id: selectedJobDescription } : q
          ));
          // Update assignments map
          const newAssignments = new Map(assignments);
          questionIds.forEach(id => newAssignments.set(id, true));
          setAssignments(newAssignments);
          await loadJobStats();
        }
      } else {
        // Bulk remove questions
        const result = await questionService.bulkRemoveQuestionsFromJob(questionIds, selectedJobDescription);
        if (result.success) {
          // Update the questions array to reflect the changes
          setQuestions(prev => prev.map(q => 
            questionIds.includes(q.id) ? { ...q, job_description_id: undefined } : q
          ));
          // Update assignments map
          const newAssignments = new Map(assignments);
          questionIds.forEach(id => newAssignments.set(id, false));
          setAssignments(newAssignments);
          await loadJobStats();
        }
      }
    } catch (error) {
      console.error('Error performing bulk assignment:', error);
    } finally {
      setSaving(false);
    }
  };

  const getFilteredQuestions = () => {
    return questions.filter(question => {
      const matchesSearch = !searchTerm || 
        question.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        question.subtopic?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = !categoryFilter || question.question_category === categoryFilter;
      const matchesDifficulty = !difficultyFilter || question.difficulty_level === difficultyFilter;
      const matchesStatus = !statusFilter || question.status === statusFilter;
      
      return matchesSearch && matchesCategory && matchesDifficulty && matchesStatus;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical': return 'bg-blue-100 text-blue-800';
      case 'aptitude': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredQuestions = getFilteredQuestions();
  const selectedJob = jobDescriptions.find(jd => jd.id === selectedJobDescription);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading question assignments...</p>
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Question Assignment</h1>
              <p className="text-sm text-gray-600">Manage which questions are assigned to job descriptions</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={loadData}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Job Description Selection */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Select Job Description</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>{jobDescriptions.length} job descriptions available</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Description
              </label>
              <select
                value={selectedJobDescription}
                onChange={(e) => setSelectedJobDescription(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a job description...</option>
                {jobDescriptions.map(job => (
                  <option key={job.id} value={job.id}>
                    {job.title} - {job.department}
                  </option>
                ))}
              </select>
            </div>
            
            {selectedJob && (
              <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{selectedJob.title}</h4>
                  <p className="text-sm text-gray-600">{selectedJob.department}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Job Statistics */}
        {selectedJobDescription && jobStats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="text-2xl font-bold text-gray-900">{jobStats.totalQuestions}</div>
              <div className="text-sm text-gray-600">Total Questions</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="text-2xl font-bold text-green-600">{jobStats.approvedQuestions}</div>
              <div className="text-sm text-gray-600">Approved</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="text-2xl font-bold text-blue-600">{jobStats.byCategory.technical}</div>
              <div className="text-sm text-gray-600">Technical</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="text-2xl font-bold text-purple-600">{jobStats.byCategory.aptitude}</div>
              <div className="text-sm text-gray-600">Aptitude</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="text-2xl font-bold text-yellow-600">
                {jobStats.byDifficulty.easy + jobStats.byDifficulty.medium + jobStats.byDifficulty.hard}
              </div>
              <div className="text-sm text-gray-600">All Difficulties</div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        {selectedJobDescription && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Question Filters</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBulkAssign(true)}
                  disabled={saving}
                  className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  <Plus className="w-3 h-3" />
                  <span>Assign All</span>
                </button>
                <button
                  onClick={() => handleBulkAssign(false)}
                  disabled={saving}
                  className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                >
                  <Minus className="w-3 h-3" />
                  <span>Remove All</span>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  <option value="technical">Technical</option>
                  <option value="aptitude">Aptitude</option>
                </select>
              </div>

              {/* Difficulty Filter */}
              <div>
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Questions Table */}
        {selectedJobDescription && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assignment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Question
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Difficulty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Points
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredQuestions.map((question) => {
                    const isAssigned = assignments.get(question.id) || false;
                    return (
                      <tr key={question.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <button
                              onClick={() => handleAssignmentToggle(question.id, !isAssigned)}
                              disabled={saving}
                              className={`flex items-center space-x-2 px-3 py-1 rounded text-sm transition-colors ${
                                isAssigned
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                              } disabled:opacity-50`}
                            >
                              {isAssigned ? (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Assigned</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4" />
                                  <span>Not Assigned</span>
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {question.question_text}
                            </div>
                            <div className="text-xs text-gray-500">
                              {question.question_type.toUpperCase()} • {question.time_limit_seconds}s
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(question.question_category)}`}>
                            {question.question_category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(question.difficulty_level)}`}>
                            {question.difficulty_level}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(question.status)}`}>
                            {question.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-900">
                            {question.points}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              className="text-blue-600 hover:text-blue-900"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredQuestions.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  {selectedJobDescription ? 'No questions found matching your filters.' : 'Select a job description to view questions.'}
                </div>
              </div>
            )}
          </div>
        )}

        {!selectedJobDescription && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <Settings className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Job Description</h3>
              <p className="text-gray-600">Choose a job description from the dropdown above to manage question assignments.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionAssignmentPage;
