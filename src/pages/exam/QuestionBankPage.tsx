import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Brain,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import AddQuestionModal from '../../components/exam/AddQuestionModal';
import GenerateQuestionModal from '../../components/exam/GenerateQuestionModal';
import { questionService, Question, QuestionFormData } from '../../services/questionService';
import { QuestionTopic } from '../../services/topicManagementService';
import { JobDescriptionsService } from '../../services/jobDescriptions';
import { JobDescription } from '../../types';

// Remove duplicate interface - using imported one

const QuestionBankPage: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [topics, setTopics] = useState<QuestionTopic[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

        const loadData = async () => {
          try {
            setLoading(true);
            const [questionsData, topicsData, jobDescriptionsResponse] = await Promise.all([
              questionService.getQuestions(),
              questionService.getTopics(),
              JobDescriptionsService.getJobDescriptions()
            ]);
            setQuestions(questionsData);
            setTopics(topicsData);
            setJobDescriptions(jobDescriptionsResponse.data);
          } catch (error) {
            console.error('Error loading data:', error);
            // Fallback to mock data for development
      setQuestions([
        {
          id: '1',
          question_text: 'What is the time complexity of binary search?',
          question_type: 'mcq',
          question_category: 'technical',
          difficulty_level: 'medium',
          points: 2,
          time_limit_seconds: 60,
          status: 'approved',
          created_by: 'ai',
          topic_id: '1',
          topic: { 
            id: '1', 
            name: 'Data Structures & Algorithms', 
            category: 'technical',
            level: 1,
            is_active: true,
            sort_order: 1,
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z'
          },
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
          is_active: true,
          mcq_options: [
            { option: 'A', text: 'O(n)' },
            { option: 'B', text: 'O(log n)' },
            { option: 'C', text: 'O(n log n)' },
            { option: 'D', text: 'O(1)' }
          ],
          correct_answer: 'B',
          answer_explanation: 'Binary search has O(log n) time complexity because it eliminates half of the search space in each iteration.',
          tags: ['algorithms', 'search', 'complexity']
        }
      ]);
      setTopics([
        { 
          id: '1', 
          name: 'Data Structures & Algorithms', 
          category: 'technical', 
          level: 1, 
          is_active: true, 
          sort_order: 1,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        },
        { 
          id: '2', 
          name: 'JavaScript', 
          category: 'technical', 
          level: 1, 
          is_active: true, 
          sort_order: 2,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        },
        { 
          id: '3', 
          name: 'Logical Reasoning', 
          category: 'aptitude', 
          level: 1, 
          is_active: true, 
          sort_order: 1,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        }
      ]);
      setJobDescriptions([
        {
          id: '1', 
          job_description_id: 'AS-WDT-7001',
          title: 'Frontend Developer', 
          description: 'We are looking for a skilled Frontend Developer with expertise in modern web technologies. The ideal candidate will have strong experience in React, JavaScript, and responsive design.',
          department: 'Engineering',
          location: 'Remote',
          employmentType: 'full-time',
          experienceLevel: 'mid',
          requirements: ['React', 'JavaScript', 'HTML', 'CSS', 'Responsive Design'], 
          responsibilities: [
            'Develop and maintain user interfaces using React',
            'Optimize application performance',
            'Collaborate with design team to implement UI/UX',
            'Write clean, maintainable code'
          ],
          benefits: ['Health Insurance', 'Remote Work', 'Learning Budget'],
          skills: ['React', 'JavaScript', 'HTML', 'CSS', 'Node.js'],
          qualifications: ['Bachelor degree in Computer Science or related field'],
          status: 'active',
          createdBy: 'admin',
          createdAt: '2024-01-15T10:00:00Z', 
          updatedAt: '2024-01-15T10:00:00Z',
          // AI-extracted fields
          required_skills: ['React', 'JavaScript', 'HTML', 'CSS', 'Responsive Design'], 
          preferred_skills: ['TypeScript', 'Next.js', 'Redux', 'GraphQL'],
          technical_stack: ['React', 'JavaScript', 'HTML', 'CSS', 'Node.js'],
          key_responsibilities: [
            'Develop and maintain user interfaces using React',
            'Optimize application performance',
            'Collaborate with design team to implement UI/UX',
            'Write clean, maintainable code'
          ], 
          education_requirements: 'Bachelor degree in Computer Science or related field'
        },
        {
          id: '2', 
          job_description_id: 'AS-WDT-7002',
          title: 'Backend Developer', 
          description: 'Seeking a Backend Developer to build scalable server-side applications. Must have experience with database design, API development, and cloud technologies.',
          department: 'Engineering',
          location: 'Hybrid',
          employmentType: 'full-time',
          experienceLevel: 'senior',
          requirements: ['Python', 'Node.js', 'SQL', 'REST APIs', 'Database Design'], 
          responsibilities: [
            'Design and develop RESTful APIs',
            'Optimize database performance',
            'Implement security best practices',
            'Deploy applications to cloud platforms'
          ],
          benefits: ['Health Insurance', 'Stock Options', 'Learning Budget'],
          skills: ['Python', 'Node.js', 'PostgreSQL', 'Redis', 'AWS'],
          qualifications: ['Bachelor degree in Computer Science or equivalent experience'],
          status: 'active',
          createdBy: 'admin',
          createdAt: '2024-01-10T09:00:00Z', 
          updatedAt: '2024-01-10T09:00:00Z',
          // AI-extracted fields
          required_skills: ['Python', 'Node.js', 'SQL', 'REST APIs', 'Database Design'], 
          preferred_skills: ['AWS', 'Docker', 'PostgreSQL', 'MongoDB', 'GraphQL'],
          technical_stack: ['Python', 'Node.js', 'PostgreSQL', 'Redis', 'AWS'],
          key_responsibilities: [
            'Design and develop RESTful APIs',
            'Optimize database performance',
            'Implement security best practices',
            'Deploy applications to cloud platforms'
          ], 
          education_requirements: 'Bachelor degree in Computer Science or equivalent experience'
        },
        {
          id: '3', 
          job_description_id: 'AS-WDT-7003',
          title: 'Full Stack Developer', 
          description: 'Looking for a Full Stack Developer who can work on both frontend and backend technologies. Must be comfortable with modern development practices and agile methodologies.',
          department: 'Engineering',
          location: 'On-site',
          employmentType: 'full-time',
          experienceLevel: 'mid',
          requirements: ['React', 'Node.js', 'JavaScript', 'SQL', 'Git'], 
          responsibilities: [
            'Develop full-stack web applications',
            'Design and implement database schemas',
            'Write unit and integration tests',
            'Participate in code reviews'
          ],
          benefits: ['Health Insurance', 'Flexible Hours', 'Learning Budget'],
          skills: ['React', 'Node.js', 'MongoDB', 'Express', 'AWS'],
          qualifications: ['Bachelor degree in Computer Science or related field'],
          status: 'active',
          createdBy: 'admin',
          createdAt: '2024-01-05T14:30:00Z', 
          updatedAt: '2024-01-05T14:30:00Z',
          // AI-extracted fields
          required_skills: ['React', 'Node.js', 'JavaScript', 'SQL', 'Git'], 
          preferred_skills: ['TypeScript', 'MongoDB', 'Docker', 'AWS', 'CI/CD'],
          technical_stack: ['React', 'Node.js', 'MongoDB', 'Express', 'AWS'],
          key_responsibilities: [
            'Develop full-stack web applications',
            'Design and implement database schemas',
            'Write unit and integration tests',
            'Participate in code reviews'
          ], 
          education_requirements: 'Bachelor degree in Computer Science or related field'
        },
        {
          id: '4', 
          job_description_id: 'AS-WDT-7004',
          title: 'DevOps Engineer', 
          description: 'We need a DevOps Engineer to manage our infrastructure and deployment pipelines. Experience with containerization, CI/CD, and cloud platforms is essential.',
          department: 'Engineering',
          location: 'Hybrid',
          employmentType: 'full-time',
          experienceLevel: 'senior',
          requirements: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Linux'], 
          responsibilities: [
            'Manage cloud infrastructure',
            'Automate deployment processes',
            'Monitor system performance',
            'Implement security measures'
          ],
          benefits: ['Health Insurance', 'Stock Options', 'Learning Budget'],
          skills: ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'Jenkins'],
          qualifications: ['Bachelor degree in Computer Science or equivalent experience'],
          status: 'active',
          createdBy: 'admin',
          createdAt: '2024-01-12T11:15:00Z', 
          updatedAt: '2024-01-12T11:15:00Z',
          // AI-extracted fields
          required_skills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Linux'], 
          preferred_skills: ['Terraform', 'Jenkins', 'GitLab CI', 'Monitoring', 'Security'],
          technical_stack: ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'Jenkins'],
          key_responsibilities: [
            'Manage cloud infrastructure',
            'Automate deployment processes',
            'Monitor system performance',
            'Implement security measures'
          ], 
          education_requirements: 'Bachelor degree in Computer Science or equivalent experience'
        }
            ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.question_text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || question.question_category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || question.difficulty_level === selectedDifficulty;
    const matchesStatus = selectedStatus === 'all' || question.status === selectedStatus;
    const matchesType = selectedType === 'all' || question.question_type === selectedType;

    return matchesSearch && matchesCategory && matchesDifficulty && matchesStatus && matchesType;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'draft': return 'text-yellow-600 bg-yellow-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category: string) => {
    return category === 'technical' ? <Brain className="h-4 w-4" /> : <FileText className="h-4 w-4" />;
  };

  const handleAddQuestion = async (questionData: QuestionFormData) => {
    try {
      setSaving(true);
      const newQuestion = await questionService.createQuestion(questionData);
      setQuestions(prev => [newQuestion, ...prev]);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding question:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await questionService.deleteQuestion(questionId);
        setQuestions(prev => prev.filter(q => q.id !== questionId));
      } catch (error) {
        console.error('Error deleting question:', error);
        alert('Failed to delete question. Please try again.');
      }
    }
  };

  const handleQuestionsGenerated = (newQuestions: Question[]) => {
    setQuestions(prev => [...newQuestions, ...prev]);
    setShowGenerateModal(false);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Question Bank</h1>
              <p className="text-gray-600 mt-1">Manage your exam questions</p>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setShowGenerateModal(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <Sparkles className="h-4 w-4" />
                <span>Generate Questions</span>
              </button>
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-ai-teal text-white px-4 py-2 rounded-lg hover:bg-ai-teal/90 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Question</span>
              </button>
            </div>
          </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="technical">Technical</option>
              <option value="aptitude">Aptitude</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent"
            >
              <option value="all">All Levels</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="mcq">MCQ</option>
              <option value="text">Text</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="draft">Draft</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.map((question) => (
          <div key={question.id} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(question.question_category)}
                    <span className="text-sm font-medium text-gray-600 capitalize">
                      {question.question_category}
                    </span>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(question.difficulty_level)}`}>
                    {question.difficulty_level}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(question.status)}`}>
                    {question.status}
                  </span>
                  <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                    {question.question_type.toUpperCase()}
                  </span>
                </div>

                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {question.question_text}
                </h3>

                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-4 w-4" />
                    <span>{question.points} points</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{question.time_limit_seconds}s</span>
                  </div>
                  {question.topic && (
                    <span>Topic: {question.topic.name}</span>
                  )}
                  <span>Created by: {question.created_by.toUpperCase()}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button className="p-2 text-gray-600 hover:text-ai-teal transition-colors">
                  <Eye className="h-4 w-4" />
                </button>
                <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
                  <Edit className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleDeleteQuestion(question.id)}
                  className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredQuestions.length === 0 && (
        <div className="text-center py-12">
          <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your filters or add new questions</p>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-ai-teal text-white px-4 py-2 rounded-lg hover:bg-ai-teal/90 transition-colors"
          >
            Add First Question
          </button>
        </div>
      )}

          {/* Add Question Modal */}
          <AddQuestionModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSave={handleAddQuestion}
            onQuestionsAdded={handleQuestionsGenerated}
            topics={topics}
            loading={saving}
          />

          {/* Generate Questions Modal */}
          <GenerateQuestionModal
            isOpen={showGenerateModal}
            onClose={() => setShowGenerateModal(false)}
            onQuestionsGenerated={handleQuestionsGenerated}
            jobDescriptions={jobDescriptions}
            topics={topics}
            loading={saving}
          />
        </div>
      );
    };

export default QuestionBankPage;
