// PDF Text Extraction Service
// Handles PDF file upload and text extraction for question generation

import { PDFExtractionRequest, PDFExtractionResponse } from '../types';

export class PDFTextExtractionService {
  private readonly maxFileSizeMB: number;
  private readonly supportedMimeTypes: string[];

  constructor(maxFileSizeMB: number = 10) {
    this.maxFileSizeMB = maxFileSizeMB;
    this.supportedMimeTypes = [
      'application/pdf',
      'application/x-pdf',
      'application/acrobat',
      'application/vnd.pdf',
      'text/pdf',
      'text/x-pdf'
    ];
  }

  /**
   * Extract text from PDF file
   */
  async extractText(request: PDFExtractionRequest): Promise<PDFExtractionResponse> {
    const { file, max_size_mb = this.maxFileSizeMB } = request;

    try {
      // Validate file
      const validationResult = this.validateFile(file, max_size_mb);
      if (!validationResult.valid) {
        return {
          success: false,
          error: validationResult.error
        };
      }

      // Extract text using pdf-parse
      const extractedText = await this.extractTextFromPDF(file);
      
      // Clean and format the extracted text
      const cleanedText = this.cleanExtractedText(extractedText);

      return {
        success: true,
        extracted_text: cleanedText,
        file_info: {
          name: file.name,
          size: file.size,
          pages: await this.getPageCount(file)
        }
      };

    } catch (error) {
      console.error('PDF extraction error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to extract text from PDF'
      };
    }
  }

  /**
   * Validate PDF file
   */
  private validateFile(file: File, maxSizeMB: number): { valid: boolean; error?: string } {
    // Check file type
    if (!this.supportedMimeTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Please upload a PDF file.'
      };
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `File size exceeds ${maxSizeMB}MB limit. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`
      };
    }

    // Check if file is empty
    if (file.size === 0) {
      return {
        valid: false,
        error: 'File is empty'
      };
    }

    return { valid: true };
  }

  /**
   * Extract text from PDF using a simple approach
   * Note: This is a placeholder implementation. For production, use a proper PDF parsing library
   */
  private async extractTextFromPDF(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          // For now, return a placeholder message
          // In production, you would integrate with a proper PDF parsing service
          resolve('PDF text extraction is not yet implemented. Please use manual input or upload a text file instead.');
        } catch (error) {
          reject(new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Clean and format extracted text
   */
  private cleanExtractedText(text: string): string {
    if (!text || text.trim().length === 0) {
      return '';
    }

    // Remove excessive whitespace and normalize line breaks
    let cleaned = text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\r/g, '\n')   // Handle old Mac line endings
      .replace(/\n{3,}/g, '\n\n') // Replace multiple line breaks with double
      .replace(/[ \t]+/g, ' ') // Replace multiple spaces/tabs with single space
      .trim();

    // Remove common PDF artifacts
    cleaned = cleaned
      .replace(/\f/g, '\n') // Replace form feeds with line breaks
      .replace(/\u00A0/g, ' ') // Replace non-breaking spaces
      .replace(/\u2013|\u2014/g, '-') // Replace en/em dashes with regular dash
      .replace(/\u2018|\u2019/g, "'") // Replace smart quotes
      .replace(/\u201C|\u201D/g, '"') // Replace smart double quotes
      .replace(/\u2026/g, '...') // Replace ellipsis
      .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, ' ') // Remove non-printable characters except extended Unicode
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .trim();

    // Remove page numbers and headers/footers (basic patterns)
    cleaned = cleaned
      .replace(/^\d+\s*$/gm, '') // Remove lines with only numbers (likely page numbers)
      .replace(/^Page \d+ of \d+$/gm, '') // Remove "Page X of Y" patterns
      .replace(/^\d+\/\d+$/gm, '') // Remove "X/Y" patterns
      .replace(/^-\s*\d+\s*-$/gm, '') // Remove "- X -" patterns
      .trim();

    // Remove empty lines and normalize
    cleaned = cleaned
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');

    return cleaned;
  }

  /**
   * Get page count from PDF (placeholder implementation)
   */
  private async getPageCount(file: File): Promise<number> {
    try {
      // For now, return a default page count
      // In production, you would parse the PDF to get actual page count
      return 1;
    } catch (error) {
      console.warn('Error getting page count:', error);
      return 1;
    }
  }

  /**
   * Validate extracted text quality
   */
  validateExtractedText(text: string): { valid: boolean; quality: 'high' | 'medium' | 'low'; issues: string[] } {
    const issues: string[] = [];
    let quality: 'high' | 'medium' | 'low' = 'high';

    if (!text || text.trim().length === 0) {
      return {
        valid: false,
        quality: 'low',
        issues: ['No text extracted from PDF']
      };
    }

    const textLength = text.trim().length;

    // Check minimum length
    if (textLength < 100) {
      issues.push('Extracted text is very short (less than 100 characters)');
      quality = 'low';
    } else if (textLength < 500) {
      issues.push('Extracted text is short (less than 500 characters)');
      quality = 'medium';
    }

    // Check for common PDF extraction issues
    const suspiciousPatterns = [
      /[^\x20-\x7E\u00A0-\uFFFF]/g, // Non-printable characters
      /\s{10,}/g, // Excessive whitespace
      /[A-Z]{20,}/g, // Excessive uppercase (might indicate OCR issues)
      /\d{20,}/g // Excessive numbers (might indicate corrupted text)
    ];

    suspiciousPatterns.forEach((pattern, index) => {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        const patternNames = [
          'non-printable characters',
          'excessive whitespace',
          'excessive uppercase text',
          'excessive numbers'
        ];
        issues.push(`Contains ${patternNames[index]}`);
        if (quality === 'high') quality = 'medium';
      }
    });

    // Check for meaningful content
    const wordCount = text.split(/\s+/).filter(word => word.length > 2).length;
    if (wordCount < 20) {
      issues.push('Very few meaningful words found');
      quality = 'low';
    } else if (wordCount < 50) {
      issues.push('Limited meaningful content found');
      if (quality === 'high') quality = 'medium';
    }

    // Check for common job description keywords
    const jobKeywords = [
      'responsibilities', 'requirements', 'qualifications', 'experience',
      'skills', 'education', 'degree', 'bachelor', 'master', 'phd',
      'years', 'salary', 'benefits', 'location', 'remote', 'hybrid'
    ];

    const foundKeywords = jobKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );

    if (foundKeywords.length < 3) {
      issues.push('Limited job description content detected');
      if (quality === 'high') quality = 'medium';
    }

    return {
      valid: issues.length === 0 || quality !== 'low',
      quality,
      issues
    };
  }

  /**
   * Extract structured information from job description text
   */
  extractJobDescriptionInfo(text: string): {
    title?: string;
    company?: string;
    location?: string;
    employment_type?: string;
    experience_level?: string;
    salary_range?: string;
    key_skills?: string[];
    responsibilities?: string[];
    requirements?: string[];
  } {
    const info: any = {};

    // Extract job title (usually at the beginning)
    const titleMatch = text.match(/^([A-Z][^.\n]{10,60})/m);
    if (titleMatch) {
      info.title = titleMatch[1].trim();
    }

    // Extract company name
    const companyMatch = text.match(/(?:at|@|Company:?\s*)([A-Z][A-Za-z\s&.,]{2,50})/i);
    if (companyMatch) {
      info.company = companyMatch[1].trim();
    }

    // Extract location
    const locationMatch = text.match(/(?:Location:?\s*|Based in\s*)([A-Za-z\s,]{5,50})/i);
    if (locationMatch) {
      info.location = locationMatch[1].trim();
    }

    // Extract employment type
    const employmentTypes = ['full-time', 'part-time', 'contract', 'internship', 'remote', 'hybrid'];
    const employmentMatch = employmentTypes.find(type => 
      text.toLowerCase().includes(type.toLowerCase())
    );
    if (employmentMatch) {
      info.employment_type = employmentMatch;
    }

    // Extract experience level
    const experienceLevels = ['entry', 'junior', 'mid', 'senior', 'lead', 'executive'];
    const experienceMatch = experienceLevels.find(level => 
      text.toLowerCase().includes(`${level} level`) || 
      text.toLowerCase().includes(`${level} position`)
    );
    if (experienceMatch) {
      info.experience_level = experienceMatch;
    }

    // Extract salary range
    const salaryMatch = text.match(/\$[\d,]+(?:-\$?[\d,]+)?(?:\s*(?:k|thousand|million))?/gi);
    if (salaryMatch) {
      info.salary_range = salaryMatch[0];
    }

    // Extract key skills (basic pattern matching)
    const skillsSection = text.match(/(?:skills|technologies|tools?)[:\s]*([^.\n]{50,500})/i);
    if (skillsSection) {
      const skillsText = skillsSection[1];
      const skills = skillsText
        .split(/[,;•\n]/)
        .map(skill => skill.trim())
        .filter(skill => skill.length > 2 && skill.length < 50)
        .slice(0, 10); // Limit to 10 skills
      info.key_skills = skills;
    }

    return info;
  }
}

// Export singleton instance
export const pdfTextExtractionService = new PDFTextExtractionService();
