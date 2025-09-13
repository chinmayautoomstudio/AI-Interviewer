import { supabase } from './supabase';

export interface JDParserRequest {
  jobDescription: string;
}

export interface JDParserResponse {
  success: boolean;
  data?: {
    title: string;
    department: string;
    location: string;
    employmentType: 'full-time' | 'part-time' | 'contract' | 'internship';
    experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
    salaryMin?: number;
    salaryMax?: number;
    currency: string;
    description: string;
    requirements: string[];
    responsibilities: string[];
    skills: string[];
    qualifications: string[];
    benefits: string[];
    companyName: string;
    workMode: 'on-site' | 'remote' | 'hybrid';
    jobCategory: string;
    contactEmail?: string;
    applicationDeadline?: string;
  };
  error?: string;
  timestamp?: string;
}

class JDParserService {
  private static webhookUrl = process.env.REACT_APP_N8N_JD_PARSER_WEBHOOK || 'https://home.ausomemgr.com/webhook-test/parse-job-description';

  /**
   * Parse job description using AI agent
   */
  static async parseJobDescription(jobDescription: string): Promise<JDParserResponse> {
    try {
      if (!jobDescription || jobDescription.trim().length === 0) {
        return {
          success: false,
          error: 'Job description text is required'
        };
      }

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobDescription: jobDescription.trim()
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      
      // Handle array response from n8n webhook
      let result: JDParserResponse;
      if (Array.isArray(responseData) && responseData.length > 0) {
        result = responseData[0];
      } else {
        result = responseData;
      }
      
      if (!result.success) {
        console.error('JD Parser error:', result.error);
        return result;
      }

      // Validate the parsed data
      if (!result.data) {
        return {
          success: false,
          error: 'No data returned from parser'
        };
      }

      // Additional validation
      if (!result.data.title) {
        return {
          success: false,
          error: 'Job title is required but not found in parsed data'
        };
      }

      return result;
    } catch (error) {
      console.error('Error parsing job description:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse job description'
      };
    }
  }

  /**
   * Test the parser with a sample job description
   */
  static async testParser(): Promise<JDParserResponse> {
    const sampleJD = `
Senior Software Developer - TechCorp India
Location: Bangalore, India
Employment Type: Full-time
Experience: 5+ years

We are looking for a senior software developer to join our engineering team.

Key Responsibilities:
• Develop and maintain web applications
• Collaborate with cross-functional teams
• Code review and mentoring

Requirements:
• 5+ years of experience in React and Node.js
• Strong problem-solving skills
• Bachelor's degree in Computer Science

Salary: ₹12,00,000 - ₹18,00,000 per annum

Contact: hr@techcorp.com
    `;

    return this.parseJobDescription(sampleJD);
  }
}

export default JDParserService;
