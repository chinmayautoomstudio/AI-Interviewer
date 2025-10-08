import { supabase } from './supabase';
import { AIAgent } from '../types';

export class AIAgentsService {
  /**
   * Get all AI agents
   */
  static async getAllAIAgents(): Promise<AIAgent[]> {
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching AI agents:', error);
        throw new Error(`Failed to fetch AI agents: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllAIAgents:', error);
      throw error;
    }
  }

  /**
   * Get AI agent by ID
   */
  static async getAIAgentById(id: string): Promise<AIAgent | null> {
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No rows returned
        }
        console.error('Error fetching AI agent:', error);
        throw new Error(`Failed to fetch AI agent: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in getAIAgentById:', error);
      throw error;
    }
  }

  /**
   * Create a new AI agent
   */
  static async createAIAgent(agentData: Omit<AIAgent, 'id' | 'createdAt' | 'updatedAt'>): Promise<AIAgent> {
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .insert([agentData])
        .select()
        .single();

      if (error) {
        console.error('Error creating AI agent:', error);
        throw new Error(`Failed to create AI agent: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in createAIAgent:', error);
      throw error;
    }
  }

  /**
   * Update an AI agent
   */
  static async updateAIAgent(id: string, updates: Partial<AIAgent>): Promise<AIAgent> {
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .update({
          ...updates,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating AI agent:', error);
        throw new Error(`Failed to update AI agent: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in updateAIAgent:', error);
      throw error;
    }
  }

  /**
   * Delete an AI agent
   */
  static async deleteAIAgent(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_agents')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting AI agent:', error);
        throw new Error(`Failed to delete AI agent: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteAIAgent:', error);
      throw error;
    }
  }
}