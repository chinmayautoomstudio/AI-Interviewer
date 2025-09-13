import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
// Modal import removed
// ConfirmDialog import removed
// Input import removed
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { 
  Bot, 
  Search, 
  Eye, 
  RefreshCw, 
  Settings,
  Zap,
  Users,
  Code,
  MessageSquare,
  Briefcase,
  Globe
} from 'lucide-react';
import { 
  getAIAgents
} from '../services/aiAgents';
import { AIAgent } from '../types';

const AIAgentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states (removed add/edit functionality)
  
  // Delete functionality removed
  
  // Form states (removed - no longer needed)

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      setError(null);
      const agentsData = await getAIAgents();
      setAgents(agentsData);
    } catch (err) {
      console.error('Error loading AI agents:', err);
      setError(err instanceof Error ? err.message : 'Failed to load AI agents');
    } finally {
      setLoading(false);
    }
  };

  // Filter agents based on search query
  const filteredAgents = agents.filter(agent => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      agent.name.toLowerCase().includes(query) ||
      agent.description?.toLowerCase().includes(query) ||
      agent.agentType.toLowerCase().includes(query) ||
      agent.jobCategories.some(category => category.toLowerCase().includes(query))
    );
  });

  const getAgentTypeIcon = (type: AIAgent['agentType']) => {
    switch (type) {
      case 'technical': return <Code className="h-5 w-5" />;
      case 'behavioral': return <MessageSquare className="h-5 w-5" />;
      case 'hr': return <Users className="h-5 w-5" />;
      case 'domain_specific': return <Briefcase className="h-5 w-5" />;
      case 'general': return <Globe className="h-5 w-5" />;
      default: return <Bot className="h-5 w-5" />;
    }
  };

  const getAgentTypeColor = (type: AIAgent['agentType']) => {
    switch (type) {
      case 'technical': return 'bg-blue-100 text-blue-800';
      case 'behavioral': return 'bg-green-100 text-green-800';
      case 'hr': return 'bg-purple-100 text-purple-800';
      case 'domain_specific': return 'bg-orange-100 text-orange-800';
      case 'general': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Removed handleAddAgent function

  // Removed handleEditAgent function

  // Removed handleDeleteClick function

  // Removed handleDeleteConfirm function

  // Removed handleJobCategoryAdd function

  // Removed handleJobCategoryRemove function

  // Removed handleSubmit function

  // Removed closeModal function

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Agents</h1>
          <p className="text-gray-600">Manage AI interview agents and their configurations</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={loadAgents} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Search */}
      <Card>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search AI agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Agents List */}
      {filteredAgents.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <Bot className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No AI agents found' : 'No AI agents yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery 
                ? 'Try adjusting your search criteria' 
                : 'Get started by adding your first AI agent'
              }
            </p>
            {/* Add AI Agent button removed */}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <Card key={agent.id}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      {getAgentTypeIcon(agent.agentType)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAgentTypeColor(agent.agentType)}`}>
                        {agent.agentType.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  {/* Delete button removed */}
                </div>

                {agent.description && (
                  <p className="text-gray-600 text-sm mb-4">{agent.description}</p>
                )}

                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Job Categories</p>
                    <div className="flex flex-wrap gap-1">
                      {agent.jobCategories.map((category, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      agent.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {agent.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* N8N Webhook URL hidden */}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal removed */}

      {/* Delete Confirmation Dialog removed */}
    </div>
  );
};

export default AIAgentsPage;
