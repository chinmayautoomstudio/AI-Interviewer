// Topic Management Service
// Handles question topics, categories, and job-specific question distributions

import { supabase } from './supabase';
import { QuestionTopic, JobQuestionCategory } from '../types';

// Re-export types for easier importing
export type { QuestionTopic, JobQuestionCategory };

export class TopicManagementService {
  // ===== TOPIC MANAGEMENT =====

  /**
   * Get all active topics with hierarchical structure
   */
  async getAllTopics(): Promise<QuestionTopic[]> {
    const { data, error } = await supabase
      .from('question_topics')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching topics:', error);
      throw new Error(`Failed to fetch topics: ${error.message}`);
    }

    return this.buildTopicHierarchy(data || []);
  }

  /**
   * Get topics by category (technical or aptitude)
   */
  async getTopicsByCategory(category: 'technical' | 'aptitude'): Promise<QuestionTopic[]> {
    const { data, error } = await supabase
      .from('question_topics')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching topics by category:', error);
      throw new Error(`Failed to fetch ${category} topics: ${error.message}`);
    }

    return this.buildTopicHierarchy(data || []);
  }

  /**
   * Create a new topic
   */
  async createTopic(topic: Omit<QuestionTopic, 'id' | 'created_at' | 'updated_at'>): Promise<QuestionTopic> {
    const { data, error } = await supabase
      .from('question_topics')
      .insert([topic])
      .select()
      .single();

    if (error) {
      console.error('Error creating topic:', error);
      throw new Error(`Failed to create topic: ${error.message}`);
    }

    return data;
  }

  /**
   * Update an existing topic
   */
  async updateTopic(id: string, updates: Partial<QuestionTopic>): Promise<QuestionTopic> {
    const { data, error } = await supabase
      .from('question_topics')
      .update({ 
        ...updates, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating topic:', error);
      throw new Error(`Failed to update topic: ${error.message}`);
    }

    return data;
  }

  /**
   * Soft delete a topic (set is_active to false)
   */
  async deleteTopic(id: string): Promise<void> {
    const { error } = await supabase
      .from('question_topics')
      .update({ 
        is_active: false, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id);

    if (error) {
      console.error('Error deleting topic:', error);
      throw new Error(`Failed to delete topic: ${error.message}`);
    }
  }

  /**
   * Get a single topic by ID
   */
  async getTopicById(id: string): Promise<QuestionTopic | null> {
    const { data, error } = await supabase
      .from('question_topics')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Topic not found
      }
      console.error('Error fetching topic:', error);
      throw new Error(`Failed to fetch topic: ${error.message}`);
    }

    return data;
  }

  // ===== JOB-SPECIFIC CATEGORY MANAGEMENT =====

  /**
   * Get question categories for a specific job description
   */
  async getJobQuestionCategories(jobDescriptionId: string): Promise<JobQuestionCategory[]> {
    const { data, error } = await supabase
      .from('job_question_categories')
      .select(`
        *,
        topic:question_topics(*)
      `)
      .eq('job_description_id', jobDescriptionId)
      .order('priority', { ascending: false });

    if (error) {
      console.error('Error fetching job question categories:', error);
      throw new Error(`Failed to fetch job question categories: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Set question categories for a job description (replaces existing)
   */
  async setJobQuestionCategories(
    jobDescriptionId: string, 
    categories: Omit<JobQuestionCategory, 'id' | 'job_description_id' | 'created_at' | 'updated_at'>[]
  ): Promise<JobQuestionCategory[]> {
    // Validate that total weight percentage doesn't exceed 100%
    const totalWeight = categories.reduce((sum, cat) => sum + cat.weight_percentage, 0);
    if (totalWeight > 100) {
      throw new Error('Total weight percentage cannot exceed 100%');
    }

    // Delete existing categories
    const { error: deleteError } = await supabase
      .from('job_question_categories')
      .delete()
      .eq('job_description_id', jobDescriptionId);

    if (deleteError) {
      console.error('Error deleting existing categories:', deleteError);
      throw new Error(`Failed to update job question categories: ${deleteError.message}`);
    }

    // Insert new categories
    const categoriesWithJobId = categories.map(cat => ({
      ...cat,
      job_description_id: jobDescriptionId
    }));

    const { data, error } = await supabase
      .from('job_question_categories')
      .insert(categoriesWithJobId)
      .select(`
        *,
        topic:question_topics(*)
      `);

    if (error) {
      console.error('Error inserting new categories:', error);
      throw new Error(`Failed to set job question categories: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Add a single category to a job description
   */
  async addJobQuestionCategory(
    jobDescriptionId: string,
    category: Omit<JobQuestionCategory, 'id' | 'job_description_id' | 'created_at' | 'updated_at'>
  ): Promise<JobQuestionCategory> {
    const { data, error } = await supabase
      .from('job_question_categories')
      .insert([{
        ...category,
        job_description_id: jobDescriptionId
      }])
      .select(`
        *,
        topic:question_topics(*)
      `)
      .single();

    if (error) {
      console.error('Error adding job question category:', error);
      throw new Error(`Failed to add job question category: ${error.message}`);
    }

    return data;
  }

  /**
   * Update a job question category
   */
  async updateJobQuestionCategory(
    categoryId: string,
    updates: Partial<JobQuestionCategory>
  ): Promise<JobQuestionCategory> {
    const { data, error } = await supabase
      .from('job_question_categories')
      .update({ 
        ...updates, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', categoryId)
      .select(`
        *,
        topic:question_topics(*)
      `)
      .single();

    if (error) {
      console.error('Error updating job question category:', error);
      throw new Error(`Failed to update job question category: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a job question category
   */
  async deleteJobQuestionCategory(categoryId: string): Promise<void> {
    const { error } = await supabase
      .from('job_question_categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      console.error('Error deleting job question category:', error);
      throw new Error(`Failed to delete job question category: ${error.message}`);
    }
  }

  // ===== QUESTION DISTRIBUTION CALCULATION =====

  /**
   * Distribute items proportionally using Largest Remainder Method (Hare-Niemeyer)
   * Guarantees the sum of returned counts equals total exactly
   * 
   * @param items Array of items with percentage values
   * @param total Total count to distribute
   * @returns Array of items with exact integer counts summing to total
   */
  private distributeProportionally<T extends { percentage: number }>(
    items: T[],
    total: number
  ): Array<T & { count: number }> {
    if (total <= 0 || items.length === 0) {
      return items.map(item => ({ ...item, count: 0 }));
    }

    // Calculate exact fractional allocations
    const allocations = items.map((item, index) => {
      const exactValue = (item.percentage / 100) * total;
      const floorValue = Math.floor(exactValue);
      const remainder = exactValue - floorValue;
      
      return {
        item,
        index,
        floorValue,
        remainder,
        exactValue
      };
    });

    // Assign floor values first
    let distributed = allocations.reduce((sum, alloc) => sum + alloc.floorValue, 0);
    const remaining = total - distributed;

    // Sort by remainder (largest first) to distribute remaining items
    // Create indices sorted by remainder
    const indicesByRemainder = allocations
      .map((_, index) => index)
      .sort((a, b) => allocations[b].remainder - allocations[a].remainder);

    // Distribute remaining items to items with largest remainders
    for (let i = 0; i < remaining && i < indicesByRemainder.length; i++) {
      const index = indicesByRemainder[i];
      allocations[index].floorValue += 1;
      distributed += 1;
    }

    // Return items with their assigned counts
    return allocations.map(alloc => ({
      ...alloc.item,
      count: alloc.floorValue
    }));
  }

  /**
   * Calculate question distribution for a job description
   * Uses Largest Remainder Method to ensure sum equals totalQuestions exactly
   */
  async getQuestionDistribution(
    jobDescriptionId: string, 
    totalQuestions: number
  ): Promise<{
    topic_id: string;
    topic_name: string;
    question_count: number;
    difficulty_breakdown: { easy: number; medium: number; hard: number };
  }[]> {
    // Input validation
    if (totalQuestions <= 0) {
      console.warn('⚠️ Invalid totalQuestions:', totalQuestions);
      return [];
    }

    const categories = await this.getJobQuestionCategories(jobDescriptionId);
    
    if (categories.length === 0) {
      console.log('ℹ️ No categories configured for job description');
      return [];
    }

    // Validate percentages sum to 100%
    const totalWeight = categories.reduce((sum, cat) => sum + cat.weight_percentage, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      console.warn(`⚠️ Total weight percentage is ${totalWeight}%, expected 100%. Using normalized distribution.`);
    }

    // Distribute questions across topics using Largest Remainder Method
    const topicDistribution = this.distributeProportionally(
      categories.map(cat => ({ percentage: cat.weight_percentage })),
      totalQuestions
    );

    // Validate distribution sum
    const distributedSum = topicDistribution.reduce((sum, dist) => sum + dist.count, 0);
    if (distributedSum !== totalQuestions) {
      console.error(`❌ Distribution validation failed: sum=${distributedSum}, expected=${totalQuestions}`);
      // Fallback: equal distribution
      const equalCount = Math.floor(totalQuestions / categories.length);
      const remainder = totalQuestions - (equalCount * categories.length);
      return categories.map((cat, index) => {
        const questionCount = equalCount + (index < remainder ? 1 : 0);
        return this.calculateDifficultyBreakdown(cat, questionCount);
      });
    }

    // Calculate difficulty breakdown for each topic
    const result = categories.map((cat, index) => {
      const questionCount = topicDistribution[index].count;
      return this.calculateDifficultyBreakdown(cat, questionCount);
    });

    // Final validation
    const finalSum = result.reduce((sum, r) => sum + r.question_count, 0);
    if (finalSum !== totalQuestions) {
      console.error(`❌ Final validation failed: sum=${finalSum}, expected=${totalQuestions}`);
    } else {
      console.log(`✅ Distribution validated: ${finalSum} questions across ${result.length} topics`);
    }

    return result;
  }

  /**
   * Calculate difficulty breakdown for a topic using Largest Remainder Method
   */
  private calculateDifficultyBreakdown(
    category: JobQuestionCategory,
    questionCount: number
  ): {
    topic_id: string;
    topic_name: string;
    question_count: number;
    difficulty_breakdown: { easy: number; medium: number; hard: number };
  } {
    if (questionCount === 0) {
      return {
        topic_id: category.topic_id,
        topic_name: category.topic?.name || 'Unknown Topic',
        question_count: 0,
        difficulty_breakdown: { easy: 0, medium: 0, hard: 0 }
      };
    }

    // Distribute difficulty levels proportionally
    const difficultyDistribution = this.distributeProportionally(
      [
        { percentage: category.easy_percentage },
        { percentage: category.medium_percentage },
        { percentage: 100 - category.easy_percentage - category.medium_percentage }
      ],
      questionCount
    );

    const easyCount = difficultyDistribution[0].count;
    const mediumCount = difficultyDistribution[1].count;
    const hardCount = difficultyDistribution[2].count;

    // Validate difficulty breakdown
    const difficultySum = easyCount + mediumCount + hardCount;
    if (difficultySum !== questionCount) {
      console.warn(`⚠️ Difficulty breakdown mismatch for topic ${category.topic?.name}: sum=${difficultySum}, expected=${questionCount}`);
      // Adjust hard count to match
      const adjustedHard = questionCount - easyCount - mediumCount;
      return {
        topic_id: category.topic_id,
        topic_name: category.topic?.name || 'Unknown Topic',
        question_count: questionCount,
        difficulty_breakdown: {
          easy: easyCount,
          medium: mediumCount,
          hard: Math.max(0, adjustedHard)
        }
      };
    }

    return {
      topic_id: category.topic_id,
      topic_name: category.topic?.name || 'Unknown Topic',
      question_count: questionCount,
      difficulty_breakdown: {
        easy: easyCount,
        medium: mediumCount,
        hard: hardCount
      }
    };
  }

  /**
   * Get available topics for a job description (topics not yet configured)
   */
  async getAvailableTopicsForJob(jobDescriptionId: string): Promise<QuestionTopic[]> {
    const { data, error } = await supabase
      .from('question_topics')
      .select('*')
      .eq('is_active', true)
      .not('id', 'in', 
        supabase
          .from('job_question_categories')
          .select('topic_id')
          .eq('job_description_id', jobDescriptionId)
      )
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching available topics:', error);
      throw new Error(`Failed to fetch available topics: ${error.message}`);
    }

    return data || [];
  }

  // ===== HELPER METHODS =====

  /**
   * Build hierarchical topic structure from flat list
   */
  private buildTopicHierarchy(topics: QuestionTopic[]): QuestionTopic[] {
    const topicMap = new Map<string, QuestionTopic>();
    const rootTopics: QuestionTopic[] = [];

    // Create map of all topics with empty children array
    topics.forEach(topic => {
      topicMap.set(topic.id, { ...topic, children: [] });
    });

    // Build hierarchy
    topics.forEach(topic => {
      const topicWithChildren = topicMap.get(topic.id)!;
      
      if (topic.parent_topic_id) {
        const parent = topicMap.get(topic.parent_topic_id);
        if (parent) {
          parent.children!.push(topicWithChildren);
        }
      } else {
        rootTopics.push(topicWithChildren);
      }
    });

    return rootTopics;
  }

  /**
   * Flatten hierarchical topic structure
   */
  flattenTopicHierarchy(topics: QuestionTopic[]): QuestionTopic[] {
    const flattened: QuestionTopic[] = [];
    
    const flatten = (topicList: QuestionTopic[]) => {
      topicList.forEach(topic => {
        flattened.push(topic);
        if (topic.children && topic.children.length > 0) {
          flatten(topic.children);
        }
      });
    };

    flatten(topics);
    return flattened;
  }

  /**
   * Get topic path (breadcrumb) for a topic
   */
  async getTopicPath(topicId: string): Promise<string[]> {
    const path: string[] = [];
    let currentTopicId: string | undefined = topicId;

    while (currentTopicId) {
      const topic: QuestionTopic | null = await this.getTopicById(currentTopicId);
      if (!topic) break;
      
      path.unshift(topic.name);
      currentTopicId = topic.parent_topic_id;
    }

    return path;
  }

  // ===== DEFAULT TOPICS SETUP =====

  /**
   * Create default topic structure
   */
  async createDefaultTopics(): Promise<void> {
    const defaultTopics = [
      // Technical Topics
      { name: 'Programming Languages', description: 'Questions about programming languages and syntax', category: 'technical' as const, level: 1, sort_order: 1 },
      { name: 'Data Structures & Algorithms', description: 'Questions about data structures, algorithms, and complexity', category: 'technical' as const, level: 1, sort_order: 2 },
      { name: 'Database Management', description: 'Questions about databases, SQL, and data management', category: 'technical' as const, level: 1, sort_order: 3 },
      { name: 'System Design', description: 'Questions about system architecture and design patterns', category: 'technical' as const, level: 1, sort_order: 4 },
      { name: 'Web Development', description: 'Questions about web technologies, frameworks, and development', category: 'technical' as const, level: 1, sort_order: 5 },
      { name: 'Mobile Development', description: 'Questions about mobile app development and platforms', category: 'technical' as const, level: 1, sort_order: 6 },
      { name: 'DevOps & Cloud', description: 'Questions about deployment, cloud services, and infrastructure', category: 'technical' as const, level: 1, sort_order: 7 },
      { name: 'Security', description: 'Questions about cybersecurity, authentication, and data protection', category: 'technical' as const, level: 1, sort_order: 8 },
      
      // Aptitude Topics
      { name: 'Logical Reasoning', description: 'Questions testing logical thinking and problem-solving', category: 'aptitude' as const, level: 1, sort_order: 1 },
      { name: 'Quantitative Aptitude', description: 'Questions testing mathematical and numerical skills', category: 'aptitude' as const, level: 1, sort_order: 2 },
      { name: 'Verbal Ability', description: 'Questions testing language and communication skills', category: 'aptitude' as const, level: 1, sort_order: 3 },
      { name: 'Analytical Skills', description: 'Questions testing analytical thinking and data interpretation', category: 'aptitude' as const, level: 1, sort_order: 4 },
      { name: 'Problem Solving', description: 'Questions testing general problem-solving abilities', category: 'aptitude' as const, level: 1, sort_order: 5 },
      { name: 'Attention to Detail', description: 'Questions testing attention to detail and accuracy', category: 'aptitude' as const, level: 1, sort_order: 6 }
    ];

    try {
      for (const topic of defaultTopics) {
        await this.createTopic({
          ...topic,
          is_active: true
        });
      }
      console.log('Default topics created successfully');
    } catch (error) {
      console.error('Error creating default topics:', error);
      throw error;
    }
  }

  /**
   * Check if default topics exist
   */
  async hasDefaultTopics(): Promise<boolean> {
    const { data, error } = await supabase
      .from('question_topics')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Error checking default topics:', error);
      return false;
    }

    return (data && data.length > 0);
  }
}

// Export singleton instance
export const topicManagementService = new TopicManagementService();
