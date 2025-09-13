import { supabase } from './supabase';
import { AIAgent } from '../types';

// Transform AI agent data from Supabase format to frontend format
const transformAIAgentData = (data: any): AIAgent => ({
  id: data.id,
  name: data.name || '',
  description: data.description,
  agentType: data.agent_type || 'general',
  jobCategories: Array.isArray(data.job_categories) ? data.job_categories : [],
  n8nWebhookUrl: data.n8n_webhook_url || '',
  isActive: data.is_active !== false,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
  createdBy: data.created_by || '',
});

// Get all AI agents
export const getAIAgents = async (): Promise<AIAgent[]> => {
  try {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching AI agents:', error);
      throw error;
    }

    return data ? data.map(transformAIAgentData) : [];
  } catch (error) {
    console.error('Error in getAIAgents:', error);
    throw error;
  }
};

// Get AI agent by ID
export const getAIAgentById = async (id: string): Promise<AIAgent | null> => {
  try {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching AI agent:', error);
      throw error;
    }

    return data ? transformAIAgentData(data) : null;
  } catch (error) {
    console.error('Error in getAIAgentById:', error);
    throw error;
  }
};

// Get AI agents by type
export const getAIAgentsByType = async (agentType: AIAgent['agentType']): Promise<AIAgent[]> => {
  try {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('agent_type', agentType)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching AI agents by type:', error);
      throw error;
    }

    return data ? data.map(transformAIAgentData) : [];
  } catch (error) {
    console.error('Error in getAIAgentsByType:', error);
    throw error;
  }
};

// Get AI agents suitable for a job category
export const getAIAgentsForJobCategory = async (jobCategory: string): Promise<AIAgent[]> => {
  try {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('is_active', true)
      .contains('job_categories', [jobCategory])
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching AI agents for job category:', error);
      throw error;
    }

    return data ? data.map(transformAIAgentData) : [];
  } catch (error) {
    console.error('Error in getAIAgentsForJobCategory:', error);
    throw error;
  }
};

// Create a new AI agent
export const createAIAgent = async (agentData: Omit<AIAgent, 'id' | 'createdAt' | 'updatedAt'>): Promise<AIAgent> => {
  try {
    const { data, error } = await supabase
      .from('ai_agents')
      .insert({
        name: agentData.name,
        description: agentData.description || null,
        agent_type: agentData.agentType,
        job_categories: agentData.jobCategories,
        n8n_webhook_url: agentData.n8nWebhookUrl,
        is_active: agentData.isActive,
        created_by: agentData.createdBy,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating AI agent:', error);
      throw error;
    }

    return transformAIAgentData(data);
  } catch (error) {
    console.error('Error in createAIAgent:', error);
    throw error;
  }
};

// Update an AI agent
export const updateAIAgent = async (id: string, agentData: Partial<AIAgent>): Promise<AIAgent> => {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (agentData.name !== undefined) updateData.name = agentData.name;
    if (agentData.description !== undefined) updateData.description = agentData.description;
    if (agentData.agentType !== undefined) updateData.agent_type = agentData.agentType;
    if (agentData.jobCategories !== undefined) updateData.job_categories = agentData.jobCategories;
    if (agentData.n8nWebhookUrl !== undefined) updateData.n8n_webhook_url = agentData.n8nWebhookUrl;
    if (agentData.isActive !== undefined) updateData.is_active = agentData.isActive;

    const { data, error } = await supabase
      .from('ai_agents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating AI agent:', error);
      throw error;
    }

    return transformAIAgentData(data);
  } catch (error) {
    console.error('Error in updateAIAgent:', error);
    throw error;
  }
};

// Delete an AI agent (soft delete by setting is_active to false)
export const deleteAIAgent = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('ai_agents')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error deleting AI agent:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteAIAgent:', error);
    throw error;
  }
};

// Get recommended AI agents for a job description
export const getRecommendedAIAgents = async (jobDescriptionId: string): Promise<AIAgent[]> => {
  try {
    // First get the job description to understand its category and requirements
    const { data: jobData, error: jobError } = await supabase
      .from('job_descriptions')
      .select('job_category, department, experience_level, employment_type')
      .eq('id', jobDescriptionId)
      .single();

    if (jobError) {
      console.error('Error fetching job description:', jobError);
      throw jobError;
    }

    if (!jobData) {
      return [];
    }

    // Get AI agents based on job category
    let agents: AIAgent[] = [];
    
    if (jobData.job_category) {
      agents = await getAIAgentsForJobCategory(jobData.job_category);
    }

    // If no agents found for specific category, get general agents
    if (agents.length === 0) {
      agents = await getAIAgentsByType('general');
    }

    // Add technical agents for technical roles
    if (jobData.department?.toLowerCase().includes('engineering') || 
        jobData.department?.toLowerCase().includes('technology') ||
        jobData.department?.toLowerCase().includes('development')) {
      const technicalAgents = await getAIAgentsByType('technical');
      agents = [...agents, ...technicalAgents];
    }

    // Remove duplicates
    const uniqueAgents = agents.filter((agent, index, self) => 
      index === self.findIndex(a => a.id === agent.id)
    );

    return uniqueAgents;
  } catch (error) {
    console.error('Error in getRecommendedAIAgents:', error);
    throw error;
  }
};
