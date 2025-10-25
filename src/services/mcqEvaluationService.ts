// MCQ Evaluation Service
// Handles automatic evaluation of multiple choice questions

import { ExamQuestion } from '../types';

export interface MCQEvaluationResult {
  isCorrect: boolean;
  pointsEarned: number;
  selectedOption?: string;
  correctOption?: string;
  explanation?: string;
  confidence: number; // 0-1 confidence score
  evaluationDetails: {
    answerMatched: boolean;
    optionTextMatched: boolean;
    caseInsensitiveMatch: boolean;
    trimmedMatch: boolean;
  };
}

export interface MCQEvaluationOptions {
  caseSensitive?: boolean;
  allowPartialCredit?: boolean;
  partialCreditThreshold?: number; // 0-1, minimum similarity for partial credit
  enableFuzzyMatching?: boolean;
  fuzzyThreshold?: number; // 0-1, minimum similarity for fuzzy matching
}

export class MCQEvaluationService {
  private static defaultOptions: MCQEvaluationOptions = {
    caseSensitive: false,
    allowPartialCredit: false,
    partialCreditThreshold: 0.8,
    enableFuzzyMatching: false,
    fuzzyThreshold: 0.9
  };

  /**
   * Evaluate an MCQ answer with enhanced logic
   */
  static evaluateAnswer(
    question: ExamQuestion,
    candidateAnswer: string,
    options: MCQEvaluationOptions = {}
  ): MCQEvaluationResult {
    const opts = { ...this.defaultOptions, ...options };
    
    console.log('🔍 Evaluating MCQ answer:', {
      questionId: question.id,
      candidateAnswer: candidateAnswer?.substring(0, 50) + '...',
      correctAnswer: question.correct_answer,
      questionType: question.question_type
    });

    // Validate inputs
    if (!question || question.question_type !== 'mcq') {
      throw new Error('Invalid question type for MCQ evaluation');
    }

    if (!candidateAnswer || candidateAnswer.trim() === '') {
      return this.createResult(false, 0, candidateAnswer, question.correct_answer || '', 
        'No answer provided', 0, {
          answerMatched: false,
          optionTextMatched: false,
          caseInsensitiveMatch: false,
          trimmedMatch: false
        });
    }

    // Get the correct answer and options
    const correctAnswer = question.correct_answer?.trim();
    const mcqOptions = question.mcq_options || [];

    if (!correctAnswer) {
      console.warn('⚠️ No correct answer defined for question:', question.id);
      return this.createResult(false, 0, candidateAnswer, correctAnswer || '',
        'No correct answer defined', 0, {
          answerMatched: false,
          optionTextMatched: false,
          caseInsensitiveMatch: false,
          trimmedMatch: false
        });
    }

    // Clean and normalize the candidate answer
    const cleanCandidateAnswer = this.cleanAnswer(candidateAnswer);
    const cleanCorrectAnswer = this.cleanAnswer(correctAnswer);

    // Evaluation methods
    const evaluations = {
      exactMatch: this.evaluateExactMatch(cleanCandidateAnswer, cleanCorrectAnswer, opts),
      optionMatch: this.evaluateOptionMatch(cleanCandidateAnswer, mcqOptions, correctAnswer, opts),
      fuzzyMatch: opts.enableFuzzyMatching ? 
        this.evaluateFuzzyMatch(cleanCandidateAnswer, cleanCorrectAnswer, opts) : null
    };

    // Determine the best evaluation result
    const bestEvaluation = this.selectBestEvaluation(evaluations, opts);
    
    // Calculate confidence score
    const confidence = this.calculateConfidence(evaluations, bestEvaluation);
    
    // Determine points earned
    const pointsEarned = bestEvaluation.isCorrect ? 
      question.points || 1 : 
      (opts.allowPartialCredit ? Math.round((question.points || 1) * confidence) : 0);

    // Get explanation
    const explanation = this.generateExplanation(
      question, 
      candidateAnswer, 
      correctAnswer, 
      bestEvaluation, 
      confidence
    );

    const result = this.createResult(
      bestEvaluation.isCorrect,
      pointsEarned,
      candidateAnswer,
      correctAnswer,
      explanation,
      confidence,
      bestEvaluation.details
    );

    console.log('✅ MCQ evaluation result:', {
      isCorrect: result.isCorrect,
      pointsEarned: result.pointsEarned,
      confidence: result.confidence,
      evaluationMethod: bestEvaluation.method
    });

    return result;
  }

  /**
   * Clean and normalize an answer for comparison
   */
  private static cleanAnswer(answer: string): string {
    return answer
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s]/g, '') // Remove special characters
      .toLowerCase();
  }

  /**
   * Evaluate exact match between answers
   */
  private static evaluateExactMatch(
    candidateAnswer: string, 
    correctAnswer: string, 
    opts: MCQEvaluationOptions
  ): { isCorrect: boolean; confidence: number; method: string; details: any } {
    const caseSensitive = opts.caseSensitive;
    
    let candidate = candidateAnswer;
    let correct = correctAnswer;
    
    if (!caseSensitive) {
      candidate = candidate.toLowerCase();
      correct = correct.toLowerCase();
    }

    const trimmedMatch = candidate.trim() === correct.trim();
    const caseInsensitiveMatch = candidateAnswer.toLowerCase() === correctAnswer.toLowerCase();
    const answerMatched = trimmedMatch;

    return {
      isCorrect: answerMatched,
      confidence: answerMatched ? 1.0 : 0.0,
      method: 'exact_match',
      details: {
        answerMatched,
        optionTextMatched: false,
        caseInsensitiveMatch,
        trimmedMatch
      }
    };
  }

  /**
   * Evaluate match against MCQ options
   */
  private static evaluateOptionMatch(
    candidateAnswer: string,
    mcqOptions: Array<{ option: string; text: string }>,
    correctAnswer: string,
    opts: MCQEvaluationOptions
  ): { isCorrect: boolean; confidence: number; method: string; details: any } {
    // Find the correct option
    const correctOption = mcqOptions.find(opt => 
      opt.option.toLowerCase() === correctAnswer.toLowerCase() ||
      opt.text.toLowerCase() === correctAnswer.toLowerCase()
    );

    if (!correctOption) {
      return {
        isCorrect: false,
        confidence: 0.0,
        method: 'option_match',
        details: {
          answerMatched: false,
          optionTextMatched: false,
          caseInsensitiveMatch: false,
          trimmedMatch: false
        }
      };
    }

    // Check if candidate answer matches the correct option
    const candidateLower = candidateAnswer.toLowerCase();
    const optionMatch = candidateLower === correctOption.option.toLowerCase();
    const textMatch = candidateLower === correctOption.text.toLowerCase();
    const answerMatched = optionMatch || textMatch;

    return {
      isCorrect: answerMatched,
      confidence: answerMatched ? 1.0 : 0.0,
      method: 'option_match',
      details: {
        answerMatched,
        optionTextMatched: textMatch,
        caseInsensitiveMatch: true,
        trimmedMatch: true
      }
    };
  }

  /**
   * Evaluate fuzzy match using string similarity
   */
  private static evaluateFuzzyMatch(
    candidateAnswer: string,
    correctAnswer: string,
    opts: MCQEvaluationOptions
  ): { isCorrect: boolean; confidence: number; method: string; details: any } {
    const similarity = this.calculateStringSimilarity(candidateAnswer, correctAnswer);
    const isCorrect = similarity >= (opts.fuzzyThreshold || 0.9);

    return {
      isCorrect,
      confidence: similarity,
      method: 'fuzzy_match',
      details: {
        answerMatched: isCorrect,
        optionTextMatched: false,
        caseInsensitiveMatch: true,
        trimmedMatch: true,
        similarity
      }
    };
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private static calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null)
    );

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Select the best evaluation result
   */
  private static selectBestEvaluation(
    evaluations: any,
    opts: MCQEvaluationOptions
  ): { isCorrect: boolean; confidence: number; method: string; details: any } {
    const results = [
      evaluations.exactMatch,
      evaluations.optionMatch,
      evaluations.fuzzyMatch
    ].filter(Boolean);

    // Sort by confidence (highest first)
    results.sort((a, b) => b.confidence - a.confidence);

    // Return the first correct result, or the highest confidence result
    const correctResult = results.find(r => r.isCorrect);
    return correctResult || results[0];
  }

  /**
   * Calculate overall confidence score
   */
  private static calculateConfidence(
    evaluations: any,
    bestEvaluation: any
  ): number {
    // Base confidence from best evaluation
    let confidence = bestEvaluation.confidence;

    // Boost confidence if multiple methods agree
    const agreeingMethods = Object.values(evaluations).filter((evaluation: any) => 
      evaluation && evaluation.isCorrect === bestEvaluation.isCorrect
    ).length;

    if (agreeingMethods > 1) {
      confidence = Math.min(1.0, confidence + 0.1);
    }

    return Math.round(confidence * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Generate explanation for the evaluation result
   */
  private static generateExplanation(
    question: ExamQuestion,
    candidateAnswer: string,
    correctAnswer: string,
    evaluation: any,
    confidence: number
  ): string {
    if (evaluation.isCorrect) {
      return `Correct! ${question.answer_explanation || 'Your answer matches the correct option.'}`;
    } else {
      const confidenceText = confidence > 0.5 ? 
        'Your answer was close but not quite right.' : 
        'Your answer was incorrect.';
      
      return `${confidenceText} The correct answer is: ${correctAnswer}. ${question.answer_explanation || ''}`;
    }
  }

  /**
   * Create a standardized result object
   */
  private static createResult(
    isCorrect: boolean,
    pointsEarned: number,
    selectedOption: string,
    correctOption: string,
    explanation: string,
    confidence: number,
    details: any
  ): MCQEvaluationResult {
    return {
      isCorrect,
      pointsEarned,
      selectedOption,
      correctOption,
      explanation,
      confidence,
      evaluationDetails: details
    };
  }

  /**
   * Batch evaluate multiple MCQ answers
   */
  static batchEvaluate(
    questions: ExamQuestion[],
    answers: Map<string, string>,
    options: MCQEvaluationOptions = {}
  ): Map<string, MCQEvaluationResult> {
    const results = new Map<string, MCQEvaluationResult>();

    questions.forEach(question => {
      if (question.question_type === 'mcq') {
        const answer = answers.get(question.id);
        if (answer) {
          try {
            const result = this.evaluateAnswer(question, answer, options);
            results.set(question.id, result);
          } catch (error) {
            console.error(`Error evaluating question ${question.id}:`, error);
            results.set(question.id, this.createResult(
              false, 0, answer, question.correct_answer || '', 
              'Evaluation error', 0, {
                answerMatched: false,
                optionTextMatched: false,
                caseInsensitiveMatch: false,
                trimmedMatch: false
              }
            ));
          }
        }
      }
    });

    return results;
  }

  /**
   * Get evaluation statistics
   */
  static getEvaluationStats(results: Map<string, MCQEvaluationResult>): {
    totalQuestions: number;
    correctAnswers: number;
    totalPoints: number;
    earnedPoints: number;
    averageConfidence: number;
    accuracyRate: number;
  } {
    const resultsArray = Array.from(results.values());
    
    const totalQuestions = resultsArray.length;
    const correctAnswers = resultsArray.filter(r => r.isCorrect).length;
    const totalPoints = resultsArray.reduce((sum, r) => sum + (r.pointsEarned || 0), 0);
    const earnedPoints = resultsArray.reduce((sum, r) => sum + r.pointsEarned, 0);
    const averageConfidence = resultsArray.reduce((sum, r) => sum + r.confidence, 0) / totalQuestions;
    const accuracyRate = totalQuestions > 0 ? correctAnswers / totalQuestions : 0;

    return {
      totalQuestions,
      correctAnswers,
      totalPoints,
      earnedPoints,
      averageConfidence,
      accuracyRate
    };
  }
}
