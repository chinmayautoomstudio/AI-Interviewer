// Enhanced AI Response Parser for Question Generation
// Updated to handle the new response format with job_relevance and enhanced metadata

// Parse and validate AI response
let aiResponse;

try {
  // Safely extract AI response with proper error handling
  const inputData = $input.first().json;
  
  console.log('🔍 Parsing AI response...');
  console.log('📊 Input data structure:', JSON.stringify(inputData, null, 2));
  
  // Handle different response formats
  if (inputData && inputData.output) {
    // Direct output format (n8n webhook response)
    aiResponse = inputData.output;
    console.log('📝 Using direct output format');
  } else if (inputData && inputData.choices && Array.isArray(inputData.choices) && inputData.choices.length > 0) {
    // OpenAI API format
    const firstChoice = inputData.choices[0];
    if (!firstChoice || !firstChoice.message || !firstChoice.message.content) {
      throw new Error('Invalid AI response structure: missing message content');
    }
    aiResponse = firstChoice.message.content;
    console.log('📝 Using OpenAI choices format');
  } else if (inputData && typeof inputData === 'string') {
    // Direct string response
    aiResponse = inputData;
    console.log('📝 Using direct string format');
  } else {
    throw new Error('Invalid AI response structure: no recognizable format found');
  }
  console.log('📝 AI Response content length:', aiResponse.length);
  
  // Clean the response if it contains markdown code blocks
  let cleanedResponse = aiResponse;
  if (aiResponse.includes('```json')) {
    const jsonStart = aiResponse.indexOf('```json') + 7;
    const jsonEnd = aiResponse.lastIndexOf('```');
    if (jsonEnd > jsonStart) {
      cleanedResponse = aiResponse.substring(jsonStart, jsonEnd).trim();
    }
  }
  
  console.log('🧹 Cleaned response for parsing...');
  
  // Clean control characters and other problematic characters
  // First, remove only the most problematic control characters
  cleanedResponse = cleanedResponse
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '') // Remove problematic control characters but keep \n, \r, \t
    .replace(/\r\n/g, '\n') // Normalize Windows line endings to Unix
    .replace(/\r/g, '\n'); // Normalize Mac line endings to Unix
  
  console.log('🔧 Cleaned control characters from JSON...');
  
  // Parse JSON response
  const parsedResponse = JSON.parse(cleanedResponse);
  console.log('✅ Successfully parsed JSON response');
  
  // Validate structure
  if (!parsedResponse.generated_questions || !Array.isArray(parsedResponse.generated_questions)) {
    throw new Error('Invalid response structure: missing generated_questions array');
  }
  
  if (!parsedResponse.generation_metadata) {
    throw new Error('Invalid response structure: missing generation_metadata');
  }
  
  console.log('📊 Found questions:', parsedResponse.generated_questions.length);
  
  // Validate each question
  const validatedQuestions = parsedResponse.generated_questions.map((question, index) => {
    const errors = [];
    
    // Required fields validation
    if (!question.question_text) errors.push('Missing question_text');
    if (!question.question_type || !['mcq', 'text'].includes(question.question_type)) {
      errors.push('Invalid question_type');
    }
    if (!question.question_category || !['technical', 'aptitude'].includes(question.question_category)) {
      errors.push('Invalid question_category');
    }
    if (!question.difficulty_level || !['easy', 'medium', 'hard'].includes(question.difficulty_level)) {
      errors.push('Invalid difficulty_level');
    }
    if (!question.correct_answer) errors.push('Missing correct_answer');
    if (!question.answer_explanation) errors.push('Missing answer_explanation');
    
    // Validate job_relevance field (new requirement)
    if (!question.job_relevance) {
      console.warn(`⚠️ Question ${index + 1} missing job_relevance field`);
    }
    
    // MCQ specific validation
    if (question.question_type === 'mcq') {
      if (!question.mcq_options || !Array.isArray(question.mcq_options) || question.mcq_options.length !== 4) {
        errors.push('MCQ questions must have exactly 4 options');
      } else {
        // Validate MCQ options structure
        question.mcq_options.forEach((option, optIndex) => {
          if (!option.option || !option.text) {
            errors.push(`MCQ option ${optIndex + 1} missing option or text`);
          }
          if (!['A', 'B', 'C', 'D'].includes(option.option)) {
            errors.push(`MCQ option ${optIndex + 1} has invalid option letter`);
          }
        });
      }
      
      if (!['A', 'B', 'C', 'D'].includes(question.correct_answer)) {
        errors.push('MCQ correct_answer must be A, B, C, or D');
      }
    }
    
    // Validate points and time_limit
    if (question.points && (question.points < 1 || question.points > 5)) {
      errors.push('Points must be between 1 and 5');
    }
    
    if (question.time_limit_seconds && (question.time_limit_seconds < 30 || question.time_limit_seconds > 300)) {
      errors.push('Time limit must be between 30 and 300 seconds');
    }
    
    if (errors.length > 0) {
      throw new Error(`Question ${index + 1} validation failed: ${errors.join(', ')}`);
    }
    
    // Set defaults for optional fields
    return {
      ...question,
      points: question.points || 1,
      time_limit_seconds: question.time_limit_seconds || 60,
      tags: question.tags || [],
      subtopic: question.subtopic || null,
      job_relevance: question.job_relevance || 'Question relevance to job role not specified'
    };
  });
  
  console.log('✅ All questions validated successfully');
  
  // Calculate topic distribution
  const topicDistribution = {};
  validatedQuestions.forEach(question => {
    const topic = question.topic || 'Unknown';
    topicDistribution[topic] = (topicDistribution[topic] || 0) + 1;
  });
  
  // Update metadata with actual counts and enhanced information
  const metadata = {
    ...parsedResponse.generation_metadata,
    total_generated: validatedQuestions.length,
    technical_count: validatedQuestions.filter(q => q.question_category === 'technical').length,
    aptitude_count: validatedQuestions.filter(q => q.question_category === 'aptitude').length,
    mcq_count: validatedQuestions.filter(q => q.question_type === 'mcq').length,
    text_count: validatedQuestions.filter(q => q.question_type === 'text').length,
    difficulty_breakdown: {
      easy: validatedQuestions.filter(q => q.difficulty_level === 'easy').length,
      medium: validatedQuestions.filter(q => q.difficulty_level === 'medium').length,
      hard: validatedQuestions.filter(q => q.difficulty_level === 'hard').length
    },
    topic_distribution: topicDistribution,
    generation_time: new Date().toISOString(),
    ai_model_used: 'gpt-4',
    confidence_score: calculateConfidenceScore(validatedQuestions, parsedResponse.generation_metadata),
    validation_status: 'passed',
    job_relevance_coverage: validatedQuestions.filter(q => q.job_relevance && q.job_relevance !== 'Question relevance to job role not specified').length
  };
  
  // Log summary
  console.log('📊 Generation Summary:');
  console.log(`   Total Questions: ${metadata.total_generated}`);
  console.log(`   Technical: ${metadata.technical_count}, Aptitude: ${metadata.aptitude_count}`);
  console.log(`   MCQ: ${metadata.mcq_count}, Text: ${metadata.text_count}`);
  console.log(`   Difficulty: Easy ${metadata.difficulty_breakdown.easy}, Medium ${metadata.difficulty_breakdown.medium}, Hard ${metadata.difficulty_breakdown.hard}`);
  console.log(`   Job Relevance Coverage: ${metadata.job_relevance_coverage}/${metadata.total_generated}`);
  console.log(`   Confidence Score: ${metadata.confidence_score}`);
  
  return {
    generated_questions: validatedQuestions,
    generation_metadata: metadata,
    success: true,
    validation_passed: true
  };
  
} catch (error) {
  console.error('❌ Error parsing AI response:', error);
  console.error('📊 Input data structure:', JSON.stringify($input.first().json, null, 2));
  console.error('📝 AI Response content:', aiResponse);
  
  return {
    error: error.message,
    success: false,
    validation_passed: false,
    raw_response: aiResponse,
    input_structure: $input.first().json,
    timestamp: new Date().toISOString(),
    generated_questions: [],
    generation_metadata: {
      error: true,
      error_message: error.message,
      generation_time: new Date().toISOString()
    }
  };
}

// Helper function to calculate confidence score
function calculateConfidenceScore(questions, originalMetadata) {
  try {
    let score = 0;
    let totalChecks = 0;
    
    // Check if we got the expected number of questions
    const expectedTotal = originalMetadata.total_generated || questions.length;
    const questionCountScore = questions.length === expectedTotal ? 1.0 : Math.max(0.5, questions.length / expectedTotal);
    score += questionCountScore;
    totalChecks++;
    
    // Check if questions have all required fields
    const requiredFields = ['question_text', 'question_type', 'difficulty_level', 'correct_answer', 'answer_explanation'];
    const fieldCompletenessScore = questions.reduce((score, q) => {
      const hasAllFields = requiredFields.every(field => q[field] !== undefined && q[field] !== null && q[field] !== '');
      return score + (hasAllFields ? 1 : 0);
    }, 0) / questions.length;
    score += fieldCompletenessScore;
    totalChecks++;
    
    // Check job relevance coverage
    const jobRelevanceScore = questions.filter(q => q.job_relevance && q.job_relevance !== 'Question relevance to job role not specified').length / questions.length;
    score += jobRelevanceScore;
    totalChecks++;
    
    // Check difficulty distribution accuracy
    const expectedEasy = originalMetadata.difficulty_breakdown?.easy || 0;
    const expectedMedium = originalMetadata.difficulty_breakdown?.medium || 0;
    const expectedHard = originalMetadata.difficulty_breakdown?.hard || 0;
    
    const actualEasy = questions.filter(q => q.difficulty_level === 'easy').length;
    const actualMedium = questions.filter(q => q.difficulty_level === 'medium').length;
    const actualHard = questions.filter(q => q.difficulty_level === 'hard').length;
    
    const difficultyScore = (
      (expectedEasy > 0 ? Math.min(1, actualEasy / expectedEasy) : 1) +
      (expectedMedium > 0 ? Math.min(1, actualMedium / expectedMedium) : 1) +
      (expectedHard > 0 ? Math.min(1, actualHard / expectedHard) : 1)
    ) / 3;
    
    score += difficultyScore;
    totalChecks++;
    
    // Calculate final confidence score
    const finalScore = score / totalChecks;
    return Math.round(finalScore * 100) / 100; // Round to 2 decimal places
    
  } catch (error) {
    console.error('❌ Error calculating confidence score:', error);
    return 0.5; // Default confidence score
  }
}
