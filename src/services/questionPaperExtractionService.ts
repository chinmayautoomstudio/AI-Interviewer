import { QuestionFormData } from '../types';

export interface ExtractedQuestion {
  question_text: string;
  question_type: 'mcq' | 'text';
  mcq_options?: Array<{ option: string; text: string }>;
  correct_answer: string;
  answer_explanation?: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  points: number;
  time_limit_seconds: number;
  topic?: string;
  topic_id?: string;
  subtopic?: string;
  tags?: string[];
}

export interface QuestionPaperExtractionRequest {
  file: File;
  topic_id?: string;
  default_difficulty?: 'easy' | 'medium' | 'hard';
  default_points?: number;
  default_time_limit?: number;
}

export interface QuestionPaperExtractionResponse {
  extracted_questions: ExtractedQuestion[];
  total_questions: number;
  mcq_count: number;
  text_count: number;
  quality_assessment: {
    overall_quality: 'high' | 'medium' | 'low';
    issues: string[];
    suggestions: string[];
  };
  processing_time: number;
}

export class QuestionPaperExtractionService {
  /**
   * Validates the uploaded question paper file
   */
  validateFile(file: File): { valid: boolean; message?: string } {
    const MAX_FILE_SIZE_MB = 10;
    const ALLOWED_TYPES = ['application/pdf'];

    if (!file) {
      return { valid: false, message: 'No file provided.' };
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return { valid: false, message: `File size exceeds ${MAX_FILE_SIZE_MB}MB.` };
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, message: 'Only PDF files are allowed.' };
    }

    return { valid: true };
  }

  /**
   * Extracts questions from a question paper PDF
   * This is a placeholder implementation that simulates question extraction
   * In production, this would integrate with a proper PDF parsing service or AI model
   */
  async extractQuestions(request: QuestionPaperExtractionRequest): Promise<QuestionPaperExtractionResponse> {
    const { file, topic_id, default_difficulty = 'medium', default_points = 2, default_time_limit = 60 } = request;
    
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock extracted questions - in production, this would be actual PDF parsing
    const mockQuestions: ExtractedQuestion[] = [
      {
        question_text: "What is the time complexity of binary search algorithm?",
        question_type: "mcq",
        mcq_options: [
          { option: "A", text: "O(n)" },
          { option: "B", text: "O(log n)" },
          { option: "C", text: "O(n log n)" },
          { option: "D", text: "O(1)" }
        ],
        correct_answer: "B",
        answer_explanation: "Binary search has O(log n) time complexity because it eliminates half of the search space in each iteration.",
        difficulty_level: "medium",
        points: 2,
        time_limit_seconds: 60,
        topic: "Data Structures & Algorithms",
        topic_id: topic_id || "1",
        subtopic: "Search Algorithms",
        tags: ["algorithms", "search", "complexity"]
      },
      {
        question_text: "Explain the concept of polymorphism in object-oriented programming.",
        question_type: "text",
        correct_answer: "Polymorphism allows objects of different types to be treated as objects of a common base type, enabling the same interface to be used for different underlying forms.",
        answer_explanation: "Polymorphism is a fundamental concept in OOP that allows methods to do different things based on the object that invokes them.",
        difficulty_level: "medium",
        points: 3,
        time_limit_seconds: 120,
        topic: "Object-Oriented Programming",
        topic_id: topic_id || "2",
        subtopic: "Core OOP Concepts",
        tags: ["oop", "polymorphism", "programming"]
      },
      {
        question_text: "Which of the following is NOT a valid HTTP status code?",
        question_type: "mcq",
        mcq_options: [
          { option: "A", text: "200 OK" },
          { option: "B", text: "404 Not Found" },
          { option: "C", text: "500 Internal Server Error" },
          { option: "D", text: "999 Invalid Response" }
        ],
        correct_answer: "D",
        answer_explanation: "HTTP status codes are standardized, and 999 is not a valid HTTP status code.",
        difficulty_level: "easy",
        points: 1,
        time_limit_seconds: 30,
        topic: "Web Development",
        topic_id: topic_id || "3",
        subtopic: "HTTP Protocol",
        tags: ["http", "web", "status-codes"]
      },
      {
        question_text: "What is the difference between 'let' and 'var' in JavaScript?",
        question_type: "text",
        correct_answer: "The main differences are: 1) Scope: 'let' has block scope while 'var' has function scope, 2) Hoisting: 'var' is hoisted and initialized with undefined, while 'let' is hoisted but not initialized, 3) Re-declaration: 'var' allows re-declaration in the same scope, 'let' does not.",
        answer_explanation: "Understanding the differences between 'let' and 'var' is crucial for writing modern JavaScript code.",
        difficulty_level: "medium",
        points: 3,
        time_limit_seconds: 90,
        topic: "JavaScript",
        topic_id: topic_id || "4",
        subtopic: "Variable Declarations",
        tags: ["javascript", "variables", "scope"]
      },
      {
        question_text: "Which sorting algorithm has the best average-case time complexity?",
        question_type: "mcq",
        mcq_options: [
          { option: "A", text: "Bubble Sort" },
          { option: "B", text: "Quick Sort" },
          { option: "C", text: "Selection Sort" },
          { option: "D", text: "Insertion Sort" }
        ],
        correct_answer: "B",
        answer_explanation: "Quick Sort has an average-case time complexity of O(n log n), which is better than the O(n²) of the other options.",
        difficulty_level: "medium",
        points: 2,
        time_limit_seconds: 60,
        topic: "Algorithms",
        topic_id: topic_id || "5",
        subtopic: "Sorting Algorithms",
        tags: ["sorting", "algorithms", "complexity"]
      }
    ];

    // Apply default values and topic_id if provided
    const processedQuestions = mockQuestions.map(question => ({
      ...question,
      topic_id: topic_id || question.topic,
      difficulty_level: question.difficulty_level || default_difficulty,
      points: question.points || default_points,
      time_limit_seconds: question.time_limit_seconds || default_time_limit
    }));

    const mcqCount = processedQuestions.filter(q => q.question_type === 'mcq').length;
    const textCount = processedQuestions.filter(q => q.question_type === 'text').length;

    return {
      extracted_questions: processedQuestions,
      total_questions: processedQuestions.length,
      mcq_count: mcqCount,
      text_count: textCount,
      quality_assessment: {
        overall_quality: 'high',
        issues: [],
        suggestions: [
          'Questions extracted successfully',
          'All questions have proper formatting',
          'Consider reviewing difficulty levels',
          'Verify correct answers for MCQ questions'
        ]
      },
      processing_time: 2.0
    };
  }

  /**
   * Converts extracted questions to the format expected by the question service
   */
  convertToQuestionFormData(extractedQuestions: ExtractedQuestion[], jobDescriptionId: string = ''): QuestionFormData[] {
    return extractedQuestions.map(question => ({
      job_description_id: jobDescriptionId,
      question_text: question.question_text,
      question_type: question.question_type,
      question_category: this.determineCategory(question.topic || ''),
      difficulty_level: question.difficulty_level,
      points: question.points,
      time_limit_seconds: question.time_limit_seconds,
      topic_id: question.topic_id || '',
      subtopic: question.subtopic || '',
      mcq_options: question.mcq_options || [],
      correct_answer: question.correct_answer,
      answer_explanation: question.answer_explanation || '',
      tags: question.tags || []
    }));
  }

  /**
   * Determines the category (technical/aptitude) based on topic
   */
  private determineCategory(topic: string): 'technical' | 'aptitude' {
    const technicalTopics = [
      'programming', 'algorithms', 'data structures', 'javascript', 'python', 'java',
      'web development', 'database', 'sql', 'react', 'node', 'api', 'http',
      'object-oriented', 'oop', 'software engineering', 'computer science'
    ];

    const aptitudeTopics = [
      'logical reasoning', 'quantitative', 'verbal', 'analytical', 'problem solving',
      'attention to detail', 'mathematics', 'english', 'comprehension'
    ];

    const topicLower = topic.toLowerCase();
    
    if (technicalTopics.some(tech => topicLower.includes(tech))) {
      return 'technical';
    } else if (aptitudeTopics.some(apt => topicLower.includes(apt))) {
      return 'aptitude';
    } else {
      // Default to technical if unclear
      return 'technical';
    }
  }

  /**
   * Validates extracted questions for quality and completeness
   */
  validateExtractedQuestions(questions: ExtractedQuestion[]): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (questions.length === 0) {
      issues.push('No questions were extracted from the PDF');
    }

    questions.forEach((question, index) => {
      if (!question.question_text || question.question_text.trim().length < 10) {
        issues.push(`Question ${index + 1}: Question text is too short or missing`);
      }

      if (question.question_type === 'mcq') {
        if (!question.mcq_options || question.mcq_options.length < 2) {
          issues.push(`Question ${index + 1}: MCQ must have at least 2 options`);
        }
        if (!question.correct_answer) {
          issues.push(`Question ${index + 1}: Correct answer is missing for MCQ`);
        }
      }

      if (!question.correct_answer || question.correct_answer.trim().length === 0) {
        issues.push(`Question ${index + 1}: Correct answer is missing`);
      }

      if (question.points <= 0) {
        issues.push(`Question ${index + 1}: Points must be greater than 0`);
      }

      if (question.time_limit_seconds <= 0) {
        issues.push(`Question ${index + 1}: Time limit must be greater than 0`);
      }
    });

    return {
      valid: issues.length === 0,
      issues
    };
  }
}

export const questionPaperExtractionService = new QuestionPaperExtractionService();
