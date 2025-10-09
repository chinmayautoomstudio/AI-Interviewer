
export interface JDParserRequest {
  jobDescription: string;
}

export interface JDFileUploadRequest {
  file: File;
}

export interface JDParserResponse {
  success: boolean;
  data?: {
    job_summary: string;
    job_title: string;
    department: string;
    location: string;
    experience_level: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
    employment_type: 'full-time' | 'part-time' | 'contract' | 'internship';
    work_mode: 'remote' | 'on-site' | 'hybrid';
    salary_range: string | null;
    company_name?: string;
    key_responsibilities: string[];
    required_skills: string[];
    preferred_skills: string[];
    technical_stack: string[];
    education_requirements: string;
    company_culture: string;
    growth_opportunities: string;
    benefits: string[];
    qualifications: {
      minimum: string[];
      preferred: string[];
    };
  };
  error?: string;
  timestamp?: string;
}

class JDParserService {
  private static webhookUrl = process.env.REACT_APP_N8N_JD_PARSER_WEBHOOK || 'https://home.ausomemgr.com/webhook/parse-job-description';
  private static fileUploadWebhookUrl = process.env.REACT_APP_N8N_JD_FILE_UPLOAD_WEBHOOK || 'https://home.ausomemgr.com/webhook/parse-job-description-file';



  /**
   * Upload and parse job description file using AI agent
   */
  static async uploadAndParseJobDescriptionFile(file: File): Promise<JDParserResponse> {
    try {
      if (!file) {
        return {
          success: false,
          error: 'File is required'
        };
      }

      // Validate file type
      if (file.type !== 'application/pdf') {
        return {
          success: false,
          error: 'Only PDF files are supported'
        };
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return {
          success: false,
          error: 'File size must be less than 10MB'
        };
      }

      console.log('📁 JD File Upload webhook URL:', this.fileUploadWebhookUrl);
      console.log('📁 Uploading file:', file.name, 'Size:', file.size, 'bytes');

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('filename', file.name);

      const response = await fetch(this.fileUploadWebhookUrl, {
        method: 'POST',
        body: formData,
      });

      console.log('📁 JD File Upload response status:', response.status);
      console.log('📁 JD File Upload response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('📁 JD File Upload raw response:', responseData);

      // Handle the response format
      let parsedData;
      if (Array.isArray(responseData)) {
        // If response is an array, take the first element
        parsedData = responseData[0];
      } else if (responseData && typeof responseData === 'object') {
        // If response is a direct object
        parsedData = responseData;
      } else {
        throw new Error('Invalid response format from JD file upload webhook');
      }

      if (parsedData && parsedData.job_title) {
        return {
          success: true,
          data: parsedData,
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          success: false,
          error: 'Failed to extract job description data from file',
          timestamp: new Date().toISOString()
        };
      }

    } catch (error) {
      console.error('📁 JD File Upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload and parse job description file',
        timestamp: new Date().toISOString()
      };
    }
  }

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

      console.log('🔍 JD Parser webhook URL:', this.webhookUrl);
      console.log('🔍 JD Parser request payload:', { jobDescription: jobDescription.trim() });
      console.log('🔍 JD Parser version: 2.0 - Direct Object Support');

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobDescription: jobDescription.trim()
        }),
      });

      console.log('🔍 JD Parser response status:', response.status);
      console.log('🔍 JD Parser response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('JD Parser HTTP error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
      }

      const responseData = await response.json();
      console.log('🔍 JD Parser raw response:', responseData);
      console.log('🔍 JD Parser response type:', typeof responseData);
      console.log('🔍 JD Parser is array:', Array.isArray(responseData));
      console.log('🔍 JD Parser has job_title:', responseData && responseData.job_title);
      
      // Handle direct object response from n8n webhook
      let parsedData;
      if (Array.isArray(responseData) && responseData.length > 0) {
        // Handle array format (legacy)
        parsedData = responseData[0];
        console.log('🔍 JD Parser extracted data from array:', parsedData);
      } else if (responseData && typeof responseData === 'object' && responseData.job_title) {
        // Handle direct object format (current)
        parsedData = responseData;
        console.log('🔍 JD Parser using direct object data:', parsedData);
      } else {
        console.error('JD Parser error: Invalid response format. Expected object with job_title or array:', typeof responseData);
        console.error('JD Parser responseData:', responseData);
        return {
          success: false,
          error: 'Invalid response format - expected object with job data or array'
        };
      }
      
      // Validate that we have the required data structure
      if (!parsedData || typeof parsedData !== 'object') {
        console.error('JD Parser error: Invalid data format', parsedData);
        return {
          success: false,
          error: 'Invalid data format from parser'
        };
      }
      
      // Create the result object with the parsed data
      const result: JDParserResponse = {
        success: true,
        data: parsedData,
        timestamp: new Date().toISOString()
      };
      
      console.log('🔍 JD Parser final result:', result);

      // Validate the parsed data
      if (!result.data) {
        return {
          success: false,
          error: 'No data returned from parser'
        };
      }

      // Additional validation - check for required fields
      if (!result.data.job_title) {
        return {
          success: false,
          error: 'Job title is required but not found in parsed data'
        };
      }

      if (!result.data.job_summary) {
        return {
          success: false,
          error: 'Job summary is required but not found in parsed data'
        };
      }

      console.log('✅ JD Parser validation passed');
      return result;
    } catch (error) {
      console.error('Error parsing job description:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error
      });
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
