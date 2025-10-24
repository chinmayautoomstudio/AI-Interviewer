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
      <div key={topic.id} className="border border-gray-200 rounded-lg mb-2">
        <div 
          className={`p-4 hover:bg-gray-50 transition-colors ${level > 0 ? 'ml-6' : ''}`}
          style={{ paddingLeft: `${level * 24 + 16}px` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {hasChildren ? (
                <button
                  onClick={() => toggleExpanded(topic.id)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
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
              
              <div className="flex items-center space-x-2">
                {hasChildren ? (
                  isExpanded ? (
                    <FolderOpen className="h-5 w-5 text-gray-500" />
                  ) : (
                    <Folder className="h-5 w-5 text-gray-500" />
                  )
                ) : (
                  getCategoryIcon(topic.category)
                )}
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{topic.name}</h3>
                  {topic.description && (
                    <p className="text-sm text-gray-600">{topic.description}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(topic.category)}`}>
                {topic.category}
              </span>
              
              <span className="text-sm text-gray-500">
                {topic.question_count || 0} questions
              </span>

              <div className="flex items-center space-x-2">
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
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
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
          <h1 className="text-2xl font-bold text-gray-900">Topic Management</h1>
          <p className="text-gray-600 mt-1">Organize questions by topics and categories</p>
        </div>
        <button className="bg-ai-teal text-white px-4 py-2 rounded-lg hover:bg-ai-teal/90 transition-colors flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Topic</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-teal focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="technical">Technical</option>
              <option value="aptitude">Aptitude</option>
            </select>
          </div>
        </div>
      </div>

      {/* Topics Tree */}
      <div className="space-y-2">
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
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Brain className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Technical Topics</h3>
          </div>
          <p className="text-gray-600 mb-4">
            {topics.filter(t => t.category === 'technical').length} technical topics
          </p>
          <button className="text-ai-teal hover:text-ai-teal/80 font-medium">
            Manage Technical Topics →
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Aptitude Topics</h3>
          </div>
          <p className="text-gray-600 mb-4">
            {topics.filter(t => t.category === 'aptitude').length} aptitude topics
          </p>
          <button className="text-ai-teal hover:text-ai-teal/80 font-medium">
            Manage Aptitude Topics →
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopicManagementPage;
