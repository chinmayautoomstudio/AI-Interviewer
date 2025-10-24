// Robust AI Response Parser for Question Generation
// Enhanced to handle various edge cases and provide detailed debugging

// Parse and validate AI response
let aiResponse;
let debugInfo = {};

try {
  // Safely extract AI response with proper error handling
  const inputData = $input.first().json;
  
  debugInfo.inputKeys = Object.keys(inputData || {});
  debugInfo.inputType = typeof inputData;
  
  // Handle different response formats
  if (inputData && inputData.output) {
    // Direct output format (n8n webhook response)
    aiResponse = inputData.output;
    debugInfo.format = 'direct_output';
  } else if (inputData && inputData.choices && Array.isArray(inputData.choices) && inputData.choices.length > 0) {
    // OpenAI API format
    const firstChoice = inputData.choices[0];
    if (!firstChoice || !firstChoice.message || !firstChoice.message.content) {
      throw new Error('Invalid AI response structure: missing message content');
    }
    aiResponse = firstChoice.message.content;
    debugInfo.format = 'openai_choices';
  } else if (inputData && typeof inputData === 'string') {
    // Direct string response
    aiResponse = inputData;
    debugInfo.format = 'direct_string';
  } else {
    throw new Error('Invalid AI response structure: no recognizable format found');
  }
  
  debugInfo.responseLength = aiResponse ? aiResponse.length : 0;
  debugInfo.responseType = typeof aiResponse;
  
  // Clean the response if it contains markdown code blocks
  let cleanedResponse = aiResponse;
  if (aiResponse && aiResponse.includes('```json')) {
    const jsonStart = aiResponse.indexOf('```json') + 7;
    const jsonEnd = aiResponse.lastIndexOf('```');
    if (jsonEnd > jsonStart) {
      cleanedResponse = aiResponse.substring(jsonStart, jsonEnd).trim();
      debugInfo.markdownCleaned = true;
    } else {
      debugInfo.markdownCleaned = false;
    }
  } else {
    debugInfo.markdownCleaned = false;
  }
  
  debugInfo.cleanedLength = cleanedResponse ? cleanedResponse.length : 0;
  
  // More aggressive cleaning for problematic characters
  if (cleanedResponse) {
    // Remove all control characters except newlines and tabs
    cleanedResponse = cleanedResponse
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '') // Remove problematic control characters
      .replace(/\r\n/g, '\n') // Normalize Windows line endings
      .replace(/\r/g, '\n') // Normalize Mac line endings
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
      .replace(/\u00A0/g, ' ') // Replace non-breaking spaces with regular spaces
      .trim();
    
    debugInfo.controlCharsCleaned = true;
    debugInfo.finalCleanedLength = cleanedResponse.length;
  }
  
  // Try to parse JSON with multiple fallback strategies
  let parsedResponse;
  let parseAttempts = [];
  
  // Attempt 1: Direct parsing
  try {
    parsedResponse = JSON.parse(cleanedResponse);
    parseAttempts.push({ method: 'direct', success: true });
  } catch (error) {
    parseAttempts.push({ method: 'direct', success: false, error: error.message });
    
    // Attempt 2: Try to fix common JSON issues
    try {
      let fixedResponse = cleanedResponse
        .replace(/,\s*}/g, '}') // Remove trailing commas before }
        .replace(/,\s*]/g, ']') // Remove trailing commas before ]
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Quote unquoted keys
        .replace(/:\s*([^",{\[\s][^",}\]\s]*)\s*([,}\]])/g, ': "$1"$2'); // Quote unquoted string values
      
      parsedResponse = JSON.parse(fixedResponse);
      parseAttempts.push({ method: 'fixed', success: true });
    } catch (error2) {
      parseAttempts.push({ method: 'fixed', success: false, error: error2.message });
      
      // Attempt 3: Try to extract JSON from the response
      try {
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
          parseAttempts.push({ method: 'extracted', success: true });
        } else {
          throw new Error('No JSON object found in response');
        }
      } catch (error3) {
        parseAttempts.push({ method: 'extracted', success: false, error: error3.message });
        throw new Error(`All parsing attempts failed. Last error: ${error3.message}`);
      }
    }
  }
  
  debugInfo.parseAttempts = parseAttempts;
  
  // Validate structure
  if (!parsedResponse || typeof parsedResponse !== 'object') {
    throw new Error('Parsed response is not a valid object');
  }
  
  if (!parsedResponse.generated_questions || !Array.isArray(parsedResponse.generated_questions)) {
    throw new Error('Invalid response structure: missing generated_questions array');
  }
  
  if (!parsedResponse.generation_metadata) {
    throw new Error('Invalid response structure: missing generation_metadata');
  }
  
  debugInfo.questionsCount = parsedResponse.generated_questions.length;
  debugInfo.hasMetadata = !!parsedResponse.generation_metadata;
  
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
    ai_model_used: parsedResponse.generation_metadata?.ai_model_used || 'unknown',
    confidence_score: parsedResponse.generation_metadata?.confidence_score || 0.5,
    validation_status: 'passed',
    job_relevance_coverage: validatedQuestions.filter(q => q.job_relevance && q.job_relevance !== 'Question relevance to job role not specified').length
  };
  
  return {
    generated_questions: validatedQuestions,
    generation_metadata: metadata,
    success: true,
    validation_passed: true,
    debug_info: debugInfo
  };
  
} catch (error) {
  return {
    error: error.message,
    success: false,
    validation_passed: false,
    raw_response: aiResponse,
    input_structure: $input.first().json,
    debug_info: debugInfo,
    timestamp: new Date().toISOString(),
    generated_questions: [],
    generation_metadata: {
      error: true,
      error_message: error.message,
      generation_time: new Date().toISOString()
    }
  };
}
