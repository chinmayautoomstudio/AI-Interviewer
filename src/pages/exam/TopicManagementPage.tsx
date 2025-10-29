import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ChevronRight,
  ChevronDown,
  Brain,
  FileText,
  Folder,
  FolderOpen
} from 'lucide-react';

interface Topic {
  id: string;
  name: string;
  description?: string;
  parent_topic_id?: string;
  category: 'technical' | 'aptitude';
  level: number;
  is_active: boolean;
  sort_order: number;
  children?: Topic[];
  question_count?: number;
}

const TopicManagementPage: React.FC = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    // TODO: Fetch topics from backend
    setTimeout(() => {
      const mockTopics: Topic[] = [
        {
          id: '1',
          name: 'Programming Languages',
          description: 'Questions about programming languages and syntax',
          category: 'technical',
          level: 1,
          is_active: true,
          sort_order: 1,
          question_count: 25,
          children: [
            {
              id: '1-1',
              name: 'JavaScript',
              description: 'JavaScript specific questions',
              parent_topic_id: '1',
              category: 'technical',
              level: 2,
              is_active: true,
              sort_order: 1,
              question_count: 12
            },
            {
              id: '1-2',
              name: 'Python',
              description: 'Python specific questions',
              parent_topic_id: '1',
              category: 'technical',
              level: 2,
              is_active: true,
              sort_order: 2,
              question_count: 13
            }
          ]
        },
        {
          id: '2',
          name: 'Data Structures & Algorithms',
          description: 'Questions about data structures, algorithms, and complexity',
          category: 'technical',
          level: 1,
          is_active: true,
          sort_order: 2,
          question_count: 30
        },
        {
          id: '3',
          name: 'Logical Reasoning',
          description: 'Questions testing logical thinking and problem-solving',
          category: 'aptitude',
          level: 1,
          is_active: true,
          sort_order: 1,
          question_count: 20
        },
        {
          id: '4',
          name: 'Quantitative Aptitude',
          description: 'Questions testing mathematical and numerical skills',
          category: 'aptitude',
          level: 1,
          is_active: true,
          sort_order: 2,
          question_count: 15
        }
      ];
      setTopics(mockTopics);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredTopics = topics.filter(topic => 
    selectedCategory === 'all' || topic.category === selectedCategory
  );

  const toggleExpanded = (topicId: string) => {
    setExpandedTopics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) {
        newSet.delete(topicId);
      } else {
        newSet.add(topicId);
      }
      return newSet;
    });
  };

  const getCategoryIcon = (category: string) => {
    return category === 'technical' ? <Brain className="h-4 w-4" /> : <FileText className="h-4 w-4" />;
  };

  const getCategoryColor = (category: string) => {
    return category === 'technical' ? 'text-blue-600 bg-blue-100' : 'text-green-600 bg-green-100';
  };

  const renderTopic = (topic: Topic, level: number = 0) => {
    const isExpanded = expandedTopics.has(topic.id);
    const hasChildren = topic.children && topic.children.length > 0;

    return (
      <div key={topic.id} className="border border-gray-200 rounded-lg mb-2 overflow-hidden max-w-full">
        <div 
          className={`p-3 sm:p-4 hover:bg-gray-50 transition-colors ${level > 0 ? 'ml-2 sm:ml-4' : ''}`}
          style={{ paddingLeft: level > 0 ? `${level * 12 + 12}px` : undefined }}
        >
          {/* Mobile Layout */}
          <div className="block sm:hidden">
            <div className="flex items-start space-x-2 mb-3">
              {hasChildren ? (
                <button
                  onClick={() => toggleExpanded(topic.id)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0 mt-0.5"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-gray-500" />
                  )}
                </button>
              ) : (
                <div className="w-5" />
              )}
              
              <div className="flex-shrink-0 mt-0.5">
                {hasChildren ? (
                  isExpanded ? (
                    <FolderOpen className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Folder className="h-4 w-4 text-gray-500" />
                  )
                ) : (
                  getCategoryIcon(topic.category)
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 break-words leading-tight">{topic.name}</h3>
                {topic.description && (
                  <p className="text-xs text-gray-600 break-words leading-relaxed mt-1">{topic.description}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between pl-7">
              <div className="flex items-center space-x-2 flex-wrap">
                <span className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${getCategoryColor(topic.category)}`}>
                  {topic.category}
                </span>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {topic.question_count || 0} questions
                </span>
              </div>
              
              <div className="flex items-center space-x-1 flex-shrink-0">
                <button className="p-1 text-gray-600 hover:text-blue-600 transition-colors">
                  <Edit className="h-3 w-3" />
                </button>
                <button className="p-1 text-gray-600 hover:text-red-600 transition-colors">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {hasChildren ? (
                <button
                  onClick={() => toggleExpanded(topic.id)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              ) : (
                <div className="w-6" />
              )}
              
              <div className="flex items-center space-x-2 flex-shrink-0">
                {hasChildren ? (
                  isExpanded ? (
                    <FolderOpen className="h-5 w-5 text-gray-500" />
                  ) : (
                    <Folder className="h-5 w-5 text-gray-500" />
                  )
                ) : (
                  getCategoryIcon(topic.category)
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-base lg:text-lg font-medium text-gray-900 break-words">{topic.name}</h3>
                {topic.description && (
                  <p className="text-sm text-gray-600 break-words leading-relaxed mt-1">{topic.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4 flex-shrink-0">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(topic.category)}`}>
                {topic.category}
              </span>
              
              <span className="text-sm text-gray-500">
                {topic.question_count || 0} questions
              </span>

              <div className="flex items-center space-x-1">
                <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
                  <Edit className="h-4 w-4" />
                </button>
                <button className="p-2 text-gray-600 hover:text-red-600 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="border-t border-gray-200">
            {topic.children!.map(child => renderTopic(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-3 sm:p-4 lg:p-6">
        <div className="animate-pulse">
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/3 sm:w-1/4 mb-4 sm:mb-6"></div>
          <div className="space-y-3 sm:space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border">
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-2 sm:h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="w-full max-w-full md:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Topic Management</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Organize questions by topics and categories</p>
          </div>
          <button className="bg-ai-teal text-white px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg hover:bg-ai-teal/90 transition-colors flex items-center justify-center space-x-1 sm:space-x-2 text-sm min-h-[44px] sm:min-h-0 flex-shrink-0">
            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Add Topic</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

      {/* Filters */}
      <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border mb-4 sm:mb-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent text-sm"
            >
              <option value="all">All Categories</option>
              <option value="technical">Technical</option>
              <option value="aptitude">Aptitude</option>
            </select>
          </div>
        </div>
      </div>

      {/* Topics Tree */}
      <div className="space-y-2 max-w-full overflow-hidden">
        {filteredTopics.map(topic => renderTopic(topic))}
      </div>

      {filteredTopics.length === 0 && (
        <div className="text-center py-12">
          <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No topics found</h3>
          <p className="text-gray-600 mb-4">Create your first topic to organize questions</p>
          <button className="bg-ai-teal text-white px-4 py-2 rounded-lg hover:bg-ai-teal/90 transition-colors">
            Add First Topic
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Technical Topics</h3>
          </div>
          <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
            {topics.filter(t => t.category === 'technical').length} technical topics
          </p>
          <button className="text-ai-teal hover:text-ai-teal/80 font-medium text-sm sm:text-base">
            Manage Technical Topics →
          </button>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg flex-shrink-0">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Aptitude Topics</h3>
          </div>
          <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
            {topics.filter(t => t.category === 'aptitude').length} aptitude topics
          </p>
          <button className="text-ai-teal hover:text-ai-teal/80 font-medium text-sm sm:text-base">
            Manage Aptitude Topics →
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};

export default TopicManagementPage;
